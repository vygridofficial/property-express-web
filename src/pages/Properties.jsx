import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Building, Store, Map, LayoutGrid } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getSiteSettings, getAllProperties, searchProperties, getPropertyTypes, getPropertiesByCategory, getCachedProperties } from '../services/propertyService';
import { revealVariants, revealViewport } from '../hooks/useScrollReveal';
import CategoryHero from './CategoryHero';
import SEO from '../components/common/SEO';
import styles from './Properties.module.css';

const CATEGORIES = [
  {
    id: 'Villa',
    title: 'Villas',
    icon: Home,
    desc: 'Luxury standalone houses',
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'Apartment',
    title: 'Flats & Apartments',
    icon: Building,
    desc: 'Premium city living',
    img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'Commercial',
    title: 'Commercial',
    icon: Store,
    desc: 'Office and retail spaces',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'Plot',
    title: 'Plots & Land',
    icon: Map,
    desc: 'Build your dream project',
    img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
];

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const catId = searchParams.get('category');
  const fromCategory = searchParams.get('from'); // parent category slug (e.g. 'residential')
  const [dynamicCategories, setDynamicCategories] = useState(CATEGORIES);
  const selectedCategory = dynamicCategories.find(c => c.id === catId) || null;
  const [categoryProperties, setCategoryProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  
  const queryParam = searchParams.get('q');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');

  useEffect(() => {
    Promise.all([getSiteSettings(), getPropertyTypes()]).then(([data, types]) => {
      if (data) setSiteSettings(data);
      if (types) {
        const visibleTypes = types.filter(t => data?.visibility?.[t.name] !== false);
        const mappedCats = visibleTypes.map(t => {
          let icon = LayoutGrid;
          let desc = `Explore ${t.name} listings`;
          const cDef = CATEGORIES.find(c => c.id === t.id || c.id === t.name);
          if (cDef) {
            icon = cDef.icon;
            desc = cDef.desc;
          }
          return {
            id: t.name,         // URL param uses current name
            originalId: t.id,   // Firestore doc ID (slug) kept for fallback query
            title: t.name,
            icon,
            desc,
            img: t.image || cDef?.img || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
          };
        });
        setDynamicCategories(mappedCats);
      }
    });
  }, []);

  useEffect(() => {
    if (queryParam) {
      setIsSearchMode(true);
      setSearchTitle(`Search: ${queryParam}`);
      setLoading(true);
      getAllProperties({}, false)
        .then(data => {
          const filtered = searchProperties(data, queryParam);
          setCategoryProperties(filtered);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error searching properties:", err);
          setLoading(false);
        });
    } else if (catId) {
      setIsSearchMode(false);

      // SYNC CHECK: If data is in cache, load it immediately to prevent flicker
      const cached = getCachedProperties(catId);
      if (cached && cached.length > 0) {
        setCategoryProperties(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      // Find the matched category — may include an originalId/slug for fallback
      const matchedCat = dynamicCategories.find(c => c.id === catId);
      const fetchCategory = async () => {
        const results = await getPropertiesByCategory(catId);
        
        // If results arrived but loading hasn't been set yet (sync cache hit), 
        // we can skip the loading state entirely
        if (results.length > 0) {
          setCategoryProperties(results);
          setLoading(false);
          return;
        }

        // Standard handles for new/empty results
        setCategoryProperties(results);
        setLoading(false);
      };
      fetchCategory().catch(err => {
        console.error('Error fetching properties:', err);
        setLoading(false);
      });
    } else {
      setIsSearchMode(false);
    }
  }, [catId, queryParam, dynamicCategories]);

  const handleSelectCategory = (cat) => {
    setSearchParams({ category: cat.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    // Pass the category to re-open via route state (invisible in URL, gone on hard refresh)
    navigate('/properties', { state: { openCategory: fromCategory || null } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.pageWrap}
    >
      <SEO 
        title={isSearchMode ? searchTitle : (selectedCategory ? `${selectedCategory.title} Listings` : "All Properties")}
        description={isSearchMode ? `Search results for ${queryParam} on Property Express.` : (selectedCategory ? `Explore our premium selection of ${selectedCategory.title.toLowerCase()} in top locations.` : "Discover your dream home from our extensive collection of premium properties.")}
        url={isSearchMode ? `/properties?q=${queryParam}` : (selectedCategory ? `/properties?category=${selectedCategory.id}` : "/properties")}
      />
      <AnimatePresence mode="wait">
        {!selectedCategory && !isSearchMode ? (
          /* ── Category Selection Screen ─────────────────────── */
          <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4 }}
          >
            <section className={styles.pageHeader}>
              <div className={`container ${styles.headerContent}`}>
                <h1>Our Properties</h1>
                <p className="subtitle">Choose a category to start exploring.</p>
              </div>
            </section>

            <section className="section" style={{ paddingTop: '4rem' }}>
              {/* ── Desktop grid (hidden on mobile via CSS) ──── */}
              <div className="container">
                <div className={styles.catGrid}>
                  {dynamicCategories.map((cat, i) => (
                    <motion.div
                      key={cat.id}
                      variants={revealVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={revealViewport}
                      transition={{ delay: i * 0.1 }}
                      className={styles.catCardWrap}
                      onClick={() => handleSelectCategory(cat)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectCategory(cat)}
                    >
                      <div className={styles.catCard}>
                        <img src={cat.img} alt={cat.title} className={styles.catBgImg} />
                        <div className={styles.catOverlay} />
                        <div className={styles.catContent}>
                          <div className={styles.catIconWrap}>
                            <cat.icon size={28} />
                          </div>
                          <h2 className={styles.catTitle}>{cat.title}</h2>
                          <p className={styles.catDesc}>{cat.desc}</p>
                          <span className={styles.catCta}>Explore →</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          /* ── Category Hero + Scroll Animation Screen ──────── */
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
                <p>Loading properties...</p>
              </div>
            ) : (
              <CategoryHero
                categoryId={isSearchMode ? 'search' : selectedCategory.id}
                categoryTitle={isSearchMode ? searchTitle : selectedCategory.title}
                onBack={handleBack}
                liveProperties={categoryProperties}
                siteSettings={siteSettings}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
