import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPropertyTypes } from '../services/propertyService';
import PropertyTypeCard from '../components/ui/PropertyTypeCard';
import skeletonStyles from '../components/ui/PropertyTypeCard.module.css';
import SEO from '../components/common/SEO';
import styles from './Properties.module.css';

const CATEGORY_LABELS = {
  residential: 'Residential Properties',
  commercial: 'Commercial Properties',
  industrial: 'Industrial Properties',
};

export default function PropertyTypesPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const label = CATEGORY_LABELS[category] || category;

  useEffect(() => {
    setLoading(true);
    getPropertyTypes()
      .then(all => {
        const filtered = all.filter(
          t => t.category && t.category.toLowerCase() === category.toLowerCase() && t.isActive !== false
        );
        setTypes(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <motion.div
      key={`types-${category}`}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      className={styles.pageWrap}
    >
      <SEO
        title={`${label} | Properties`}
        description={`Browse all ${label.toLowerCase()} on Property Express.`}
        url={`/properties/category/${category}`}
      />

      {/* Header */}
      <section className={styles.pageHeader}>
        <div className={`container ${styles.headerContent}`}>
          <h1>Our Properties</h1>
          <p className="subtitle">Explore by type within this category.</p>
        </div>
      </section>

      <section style={{ padding: '3rem 0 5rem' }}>
        <div className="container">

          {/* Back button + Category banner row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <button
              onClick={() => navigate('/properties')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'transparent', border: '1.5px solid #cbd5e1',
                borderRadius: 30, padding: '0.55rem 1.1rem',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
                color: '#334155', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <ArrowLeft size={16} /> Back
            </button>

            {/* Wide category banner */}
            <div style={{
              flex: 1, background: '#1565C0', borderRadius: 16,
              padding: '1rem 2rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                {label}
              </span>
            </div>
          </div>

          {/* Property Type Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={skeletonStyles.skeleton} />
              ))}
            </div>
          ) : types.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '5rem 0', color: '#64748b' }}
            >
              <p style={{ fontSize: '1.1rem' }}>No property types found in this category.</p>
            </motion.div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem',
            }}
              className={styles.typeGrid}
            >
              {types.map((t, i) => (
                <PropertyTypeCard key={t.id} type={t} categorySlug={category} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
