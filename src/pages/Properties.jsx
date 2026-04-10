import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Building, Store, Map, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getPropertiesByCategory, getSiteSettings } from '../services/propertyService';
import { revealVariants, revealViewport } from '../hooks/useScrollReveal';
import CategoryHero from './CategoryHero';
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
  const catId = searchParams.get('category');
  const [dynamicCategories, setDynamicCategories] = useState(CATEGORIES);
  const selectedCategory = dynamicCategories.find(c => c.id === catId) || null;
  const [categoryProperties, setCategoryProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    getSiteSettings().then(data => {
      if (data) {
        setSiteSettings(data);
        const visibleBase = CATEGORIES.filter(cat => data.visibility?.[cat.id] !== false);
        const customObjects = (data.customCategories || []).map(cat => ({
          id: cat.name,
          title: cat.name,
          icon: LayoutGrid,
          desc: `Explore ${cat.name} listings`,
          img: cat.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
          isVisible: data.visibility?.[cat.name] !== false
        })).filter(cat => cat.isVisible);
        
        setDynamicCategories([...visibleBase, ...customObjects]);
      }
    });
  }, []);

  useEffect(() => {
    if (catId) {
      setLoading(true);
      // Fetch both exact and potentially lowercased category matches
      getPropertiesByCategory(catId)
        .then(async (data) => {
          let results = [...data];
          
          // Fallback check: if no results, try lowercase version in case of data inconsistency
          if (results.length === 0) {
            const lowerData = await getPropertiesByCategory(catId.toLowerCase());
            results = lowerData;
          }

          console.log("DEBUG: Fetched live properties for category", catId, ":", results);
          setCategoryProperties(results);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching properties:", err);
          setLoading(false);
        });
    }
  }, [catId]);

  const handleSelectCategory = (cat) => {
    setSearchParams({ category: cat.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSearchParams({});
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
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
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
                categoryId={selectedCategory.id}
                categoryTitle={selectedCategory.title}
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
