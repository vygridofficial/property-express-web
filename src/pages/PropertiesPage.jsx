import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, X, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getPropertyTypes } from '../services/propertyService';
import SEO from '../components/common/SEO';
import styles from './Properties.module.css';
import ptStyles from '../components/ui/PropertyTypeCard.module.css';
import proStyles from './PropertiesPage.module.css';

/* ── static data ── */
const CATEGORIES = [
  {
    slug: 'residential',
    label: 'Residential Properties',
    desc: 'Villas, apartments, plots & more',
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
  },
  {
    slug: 'commercial',
    label: 'Commercial Properties',
    desc: 'Office spaces, retail shops & showrooms',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
  },
  {
    slug: 'industrial',
    label: 'Industrial Properties',
    desc: 'Warehouses, factories & logistics hubs',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
  },
];

/* Fallback images for default types without uploaded images */
const TYPE_FALLBACKS = {
  Villa: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  Apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  Plot: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  Commercial: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  Uncategorized: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
};
const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

/* ── skeleton card ── */
function Skeleton() {
  return <div className={ptStyles.skeleton} style={{ minHeight: 230, borderRadius: 20 }} />;
}

/* ── property-type card ── */
function TypeCard({ type, categorySlug, index }) {
  const navigate = useNavigate();
  const Icon = LucideIcons[type.icon] || LucideIcons.Building2;
  const img = type.image || TYPE_FALLBACKS[type.name] || DEFAULT_FALLBACK;

  return (
    <motion.div
      onClick={() =>
        navigate(`/properties/listings?category=${encodeURIComponent(type.name)}&from=${categorySlug}`)
      }
      className={styles.catCardWrap}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className={styles.catCard} style={{ height: 250 }}>
        <img src={img} alt={type.name} className={styles.catBgImg} />
        <div className={styles.catOverlay} />
        <div className={styles.catContent}>
          <div className={styles.catIconWrap}><Icon size={22} /></div>
          <h3 className={styles.catTitle} style={{ fontSize: '1.2rem' }}>{type.name}</h3>
          {type.subTypes?.length > 0 && (
            <p className={styles.catDesc}>{type.subTypes.slice(0, 3).join(' · ')}</p>
          )}
          <span className={styles.catCta}>
            View Listings <ChevronRight size={13} style={{ verticalAlign: 'middle' }} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function PropertiesPage() {
  const [searchParams] = useSearchParams();
  const openParam = searchParams.get('open'); // auto-open from back navigation
  const [selected, setSelected] = useState(openParam || null);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allTypes, setAllTypes] = useState([]);
  const typesRef = useRef(null);
  const catSectionRef = useRef(null); // ref on the category cards section

  // Load all property types once
  useEffect(() => {
    getPropertyTypes()
      .then(data => setAllTypes(data.filter(t => t.isActive !== false)))
      .catch(console.error);
  }, []);

  // If open param changes (e.g. back navigation), sync selected
  useEffect(() => {
    if (openParam) setSelected(openParam);
  }, [openParam]);

  // ── Scroll handlers ──────────────────────────────────────
  // SELECT: scroll down just enough so the bottom of the category cards is
  //         partially visible (~25% peeking) and the types grid starts below.
  const handleSelect = (slug) => {
    setSelected(slug);
    setTimeout(() => {
      if (!catSectionRef.current) return;
      const catRect = catSectionRef.current.getBoundingClientRect();
      // Target: scroll so that the bottom 25% of the category card section
      // sits at the very top of the viewport (plus 80px navbar offset).
      // That means scrolling down by (catRect.bottom - viewportHeight * 0.28).
      const targetScroll = window.scrollY + catRect.bottom - window.innerHeight * 0.28;
      window.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }, 420); // wait for CSS flex transition + AnimatePresence enter
  };

  // DESELECT: collapse grid + scroll back to very top simultaneously.
  const handleDeselect = () => {
    setSelected(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter when category selected
  useEffect(() => {
    if (!selected) { setTypes([]); return; }
    setLoading(true);
    const filtered = allTypes.filter(
      t => t.category && t.category.toLowerCase() === selected.toLowerCase()
    );
    const timer = setTimeout(() => { setTypes(filtered); setLoading(false); }, 200);
    return () => clearTimeout(timer);
  }, [selected, allTypes]);

  const activeCat = CATEGORIES.find(c => c.slug === selected);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.pageWrap}
    >
      <SEO
        title="Our Properties"
        description="Explore premium residential, commercial and industrial properties."
        url="/properties"
      />

      {/* Hero Header */}
      <section className={styles.pageHeader}>
        <div className={`container ${styles.headerContent}`}>
          <h1>Our Properties</h1>
          <p className="subtitle">
            {selected ? `Browsing ${activeCat?.label}` : 'Choose a category to start exploring.'}
          </p>
        </div>
      </section>

      {/* Category Cards */}
      <section ref={catSectionRef} style={{ padding: '3.5rem 0 0' }}>
        <div className="container">
          <div className={proStyles.catRow}>
            {CATEGORIES.map((cat) => {
              const isActive = selected === cat.slug;
              const isHidden = !!selected && !isActive;
              return (
                <div
                  key={cat.slug}
                  className={`${proStyles.catSlot} ${isActive ? proStyles.catSlotActive : ''} ${isHidden ? proStyles.catSlotHidden : ''}`}
                  onClick={() => isActive ? handleDeselect() : handleSelect(cat.slug)}
                >
                  <div className={styles.catCard} style={{ height: 360 }}>
                    <img src={cat.img} alt={cat.label} className={styles.catBgImg} />
                    <div className={styles.catOverlay} />
                    <div className={styles.catContent} style={{ position: 'relative' }}>
                      <h3 className={styles.catTitle}>{cat.label}</h3>
                      <p className={styles.catDesc}>{cat.desc}</p>
                      {!isActive && (
                        <span className={styles.catCta}>
                          Explore <ArrowRight size={13} style={{ verticalAlign: 'middle' }} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Property Types below selected category */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.section
            ref={typesRef}
            key={selected}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
              <p style={{
                fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase',
                letterSpacing: '0.1em', color: '#64748b', marginBottom: '1.5rem'
              }}>
                {activeCat?.label} — Property Types
              </p>

              {loading ? (
                <div className={styles.catGrid}>
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}
                </div>
              ) : types.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem 0' }}>
                  No property types found in this category.
                </p>
              ) : (
                <div className={styles.catGrid}>
                  {types.map((t, i) => (
                    <TypeCard key={t.id} type={t} categorySlug={selected} index={i} />
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {!selected && <div style={{ paddingBottom: '5rem' }} />}
    </motion.div>
  );
}
