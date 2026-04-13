import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Compass, 
  MapPin, 
  Building, 
  ChevronRight, 
  Command, 
  CornerDownLeft,
  Filter
} from 'lucide-react';
import styles from './SearchSpotlight.module.css';

const TYPE_COLORS = {
  Apartment: '#E3F2FD',
  Villa: '#E8F5E9',
  Commercial: '#FFF3E0',
  Plot: '#F3E5F5',
  Penthouse: '#FCE4EC',
  Apartments: '#E3F2FD', // Mapping for data variations
  Villas: '#E8F5E9',
  Houses: '#E8F5E9'
};

const TYPE_ICONS = {
  Apartment: '🏢',
  Villa: '🏡',
  Commercial: '🏬',
  Plot: '📍',
  Penthouse: '💎'
};

export default function SearchSpotlight({ 
  query, 
  results, 
  isVisible, 
  loading, 
  activeIndex, 
  onSelect,
  onSearchFull
}) {
  if (!isVisible) return null;

  const containerVariants = {
    initial: { opacity: 0, y: -8, scale: 0.97 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.18, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -8, 
      scale: 0.97,
      transition: { duration: 0.15 }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumSignificantDigits: 3
    }).format(price);
  };

  return (
    <motion.div 
      className={styles.spotlightContainer}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.pillBtn}>Sort <Filter size={12} /></button>
        <button className={styles.pillBtn}>Type <ChevronRight size={12} style={{ transform: 'rotate(90deg)' }} /></button>
        <button className={styles.pillBtn}>Location <MapPin size={12} /></button>
      </div>

      {/* Quick Action */}
      {(results.length === 0 || query.length < 3) && !loading && (
        <div className={styles.quickAction} onClick={onSearchFull}>
          <div className={styles.qaLeft}>
            <div className={styles.qaIconBox}>
              <Compass size={18} />
            </div>
            <div className={styles.qaLabels}>
              <span className={styles.qaLabel}>Search all properties</span>
              <span className={styles.qaSublabel}>AI Assistance</span>
            </div>
          </div>
          <div className={styles.enterBadge}>
            <CornerDownLeft size={12} />
          </div>
        </div>
      )}

      {/* Results Section */}
      {loading ? (
        <div className={styles.loadingState}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.skeletonRow}>
              <div className={`${styles.skeletonThumb} ${styles.shimmer}`}></div>
              <div className={styles.skeletonInfo}>
                <div className={`${styles.skeletonText} ${styles.shimmer}`} style={{ width: '60%' }}></div>
                <div className={`${styles.skeletonText} ${styles.shimmer}`} style={{ width: '40%' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className={styles.resultsList}>
          <div className={styles.sectionHeading}>Property Listings</div>
          <motion.div 
            initial="initial"
            animate="animate"
            transition={{ staggerChildren: 0.04 }}
          >
            {results.slice(0, 6).map((property, index) => (
              <motion.div 
                key={property.id}
                variants={itemVariants}
                className={`${styles.resultRow} ${activeIndex === index ? styles.activeRow : ''}`}
                onClick={() => onSelect(property)}
              >
                <div className={styles.rowLeft}>
                  {property.images?.[0] ? (
                    <img src={property.images[0]} alt={property.title} className={styles.thumbnail} />
                  ) : (
                    <div 
                      className={styles.thumbPlaceholder}
                      style={{ background: TYPE_COLORS[property.type] || '#F5F5F5' }}
                    >
                      {TYPE_ICONS[property.type] || '🏠'}
                    </div>
                  )}
                  <div className={styles.rowDetails}>
                    <span className={styles.propTitle}>{property.title}</span>
                    <span className={styles.propMeta}>{property.type} · {property.location}</span>
                    <span className={styles.propPrice}>{formatPrice(property.price)}</span>
                  </div>
                </div>
                <div className={styles.enterBadge}>
                  <CornerDownLeft size={12} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {results.length > 6 && (
            <div className={styles.footerLink} onClick={onSearchFull}>
              See all {results.length} results →
            </div>
          )}
        </div>
      ) : query.length >= 2 && (
        <div className={styles.emptyState}>
          <Search size={48} strokeWidth={1} />
          <div className={styles.emptyTitle}>No properties found for "{query}"</div>
          <div className={styles.emptyText}>Try a different name, location, or type</div>
        </div>
      )}
    </motion.div>
  );
}
