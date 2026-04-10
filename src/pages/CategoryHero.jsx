import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FILTER_TAXONOMY } from '../data/filterTaxonomy';
import { getPropertyCoordinates, getDistanceFromLatLonInKm } from '../utils/geo';
import { formatPrice } from '../utils/formatPrice';
import styles from './CategoryHero.module.css';

// Floating positions for 4 images: top-left, top-right, center-left, bottom-right
const FLOAT_POSITIONS = [
  { top: '8%', left: '-2%', rotate: -8, zIndex: 2 },
  { top: '5%', right: '4%', rotate: 5, zIndex: 3 },
  { top: '42%', left: '5%', rotate: -4, zIndex: 2 },
  { top: '38%', right: '-1%', rotate: 6, zIndex: 2 },
];

function FloatingImage({ src, position, scrollProgress, index, onClick }) {
  const { isMobile } = position; // keep for potential scaling
  // Full flying animations enabled on mobile, but scale reduced slightly
  const exitX = useTransform(scrollProgress, [0, 1], [0, index % 2 === 0 ? -150 : 150]);
  const exitY = useTransform(scrollProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollProgress, [0, 0.55, 0.85], [1, 0.6, 0]);
  const scale = useTransform(scrollProgress, [0, 1], [1, isMobile ? 0.8 : 0.65]);
  const rotate = useTransform(scrollProgress, [0, 1], [position.rotate, 0]);

  const springX = useSpring(exitX, { stiffness: 60, damping: 20 });
  const springY = useSpring(exitY, { stiffness: 60, damping: 20 });
  const springOpacity = useSpring(opacity, { stiffness: 80, damping: 25 });
  const springScale = useSpring(scale, { stiffness: 80, damping: 25 });

  const style = { ...position };
  delete style.rotate; // handle via motion

  return (
    <motion.div
      className={styles.floatingImg}
      style={{
        position: 'absolute',
        x: springX,
        y: springY,
        opacity: springOpacity,
        scale: springScale,
        rotate,
        ...style,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: 'easeOut' }}
    >
      <img src={src} alt="" className={styles.floatingImgEl} />
    </motion.div>
  );
}

function PropertyListingCard({ property, index }) {
  // Ensure we have an image to show
  const displayImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : (property.image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80');

  const displayPrice = formatPrice(property.price);

  return (
    <motion.div
      className={styles.listingCard}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-80px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <div className={styles.listingImgWrap}>
        <span
          className={styles.listingBadge}
          style={{
            background: property.status === 'For Rent' ? '#1a1a1a' : 'rgba(255,255,255,0.55)',
            color: property.status === 'For Rent' ? '#fff' : '#222',
          }}
        >
          {property.status}
        </span>
        <img src={displayImage} alt={property.title} className={styles.listingImg} />
      </div>
      <div className={styles.listingContent}>
        <div className={styles.listingPrice} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {displayPrice}
            {property.status === 'For Rent' && <span className={styles.perMonth}> /mo</span>}
          </div>
          {property._distance !== undefined && property._distance < 999999 && (
            <span style={{ fontSize: '0.75rem', color: '#ed1b24', fontWeight: 700, background: 'rgba(237,27,36,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
              {property._distance < 1 ? '< 1' : Math.round(property._distance)} km away
            </span>
          )}
        </div>
        <div className={styles.titleWrap}>
          <h3 className={styles.listingTitle}>{property.title}</h3>
        </div>
        <p className={styles.listingLocation}>📍 {property.location}</p>
        <div className={styles.listingFeatures}>
          {(property.beds > 0 || property.bedrooms > 0) && (
            <span>🛏 {property.beds || property.bedrooms} Beds</span>
          )}
          {(property.baths > 0 || property.bathrooms > 0) && (
            <span>🚿 {property.baths || property.bathrooms} Baths</span>
          )}
          <span>📐 {(property.sqft || property.area || 0).toLocaleString()} {(property.areaUnit || 'sqft')}</span>
        </div>
        <Link 
          to={`/properties/${property.id}`} 
          state={{ property }}
          className={styles.viewBtn} 
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
}

export default function CategoryHero({ categoryId, categoryTitle, onBack, liveProperties = [] }) {
  const containerRef = useRef(null);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Always use live properties from Firestore.
  const baseProperties = liveProperties;

  const images = baseProperties.map(p => {
    // Robust price normalization
    let nPrice = 0;
    if (typeof p.price === 'number') {
      nPrice = p.price;
    } else if (typeof p.price === 'string') {
      const clean = p.price.replace(/[^\d.]/g, '');
      const val = parseFloat(clean);
      if (!isNaN(val)) {
        if (p.price.toLowerCase().includes('cr')) nPrice = val * 10000000;
        else if (p.price.toLowerCase().includes('l')) nPrice = val * 100000;
        else nPrice = val;
      }
    }

    return {
      ...p,
      images: p.images || (p.image ? [p.image] : []),
      location: (p.location || p.address || "Location TBD").trim(),
      beds: p.beds || p.bedrooms || 0,
      baths: p.baths || p.bathrooms || 0,
      sqft: p.sqft || p.area || 0,
      numericPrice: nPrice
    };
  });

  const taxonomy = FILTER_TAXONOMY[categoryId];

  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Dynamic Filters Parsing
  const { dynamicKeys, dynamicOptions } = React.useMemo(() => {
    const keys = new Set();
    const opts = {};
    images.forEach(p => {
      if (p.dynamicFilters) {
        Object.entries(p.dynamicFilters).forEach(([k, v]) => {
          keys.add(k);
          if (!opts[k]) opts[k] = new Set();
          opts[k].add(v);
        });
      }
    });
    const finalKeys = Array.from(keys);
    finalKeys.forEach(k => opts[k] = Array.from(opts[k]));
    return { dynamicKeys: finalKeys, dynamicOptions: opts };
  }, [images]);

  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    location: '', // Default to all so user can see properties before intentionally clamping strictly to 50km
    priceMax: '',
    ...Object.fromEntries((taxonomy?.subFilters || []).map(sf => [sf.key, '']))
  });
  const [showSubFilters, setShowSubFilters] = useState(false);

  const handleFilterChange = (e) => {
    setLocalFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Apply filters to images & sort by haversine distance
  const filteredImages = React.useMemo(() => {
    let result = [...images];

    // Filter Location (Radial enforcement only)
    if (localFilters.location === 'My Location') {
      const centerCache = window.sessionStorage.getItem('mapCenter');
      if (centerCache) {
        try {
          const center = JSON.parse(centerCache);
          result.forEach(img => {
            const coords = getPropertyCoordinates(img);
            if (coords) {
              img._distance = getDistanceFromLatLonInKm(center.lat, center.lng, coords.lat, coords.lng);
            } else {
              img._distance = 999999;
            }
          });
          
          // Strict Max 50km Radius filter
          result = result.filter(img => img._distance <= 50);

          // Arrange from Nearest to Farthest
          result.sort((a, b) => a._distance - b._distance);
        } catch(e) {}
      }
    }
    
    // Filter Price
    if (localFilters.priceMax) {
      result = result.filter(img => (img.numericPrice || 0) <= parseFloat(localFilters.priceMax));
    }

    // Filter Dynamic Keys
    dynamicKeys.forEach(k => {
      if (localFilters[k]) {
        result = result.filter(img => img.dynamicFilters && img.dynamicFilters[k] === localFilters[k]);
      }
    });
    return result;
  }, [images, localFilters, dynamicKeys]);

  // Title: scale up as you scroll, then fade out
  const titleScale = useTransform(scrollYProgress, [0, 0.3, 0.6], [1, isMobile ? 1.05 : 1.3, isMobile ? 0.9 : 0.7]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.4, 0.7], [1, 0.8, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.8], [0, isMobile ? -30 : -120]);

  const springTitleScale = useSpring(titleScale, { stiffness: 60, damping: 22 });
  const springTitleOpacity = useSpring(titleOpacity, { stiffness: 80, damping: 28 });
  const springTitleY = useSpring(titleY, { stiffness: 60, damping: 22 });

  // Listings reveal opacity - start earlier (at 20% scroll or even immediately on mobile)
  const listingsOpacity = useTransform(scrollYProgress, [isMobile ? 0.05 : 0.25, isMobile ? 0.3 : 0.6], [0, 1]);
  const listingsSpring = useSpring(listingsOpacity, { stiffness: 60, damping: 25 });

  return (
    <div ref={containerRef} className={styles.outerWrap}>
      {/* Sticky hero panel — images float here & scroll away */}
      <div ref={heroRef} className={styles.heroPanel}>
        <div className={styles.heroInner}>
          {/* Back button */}
          <motion.button
            className={styles.backBtn}
            onClick={onBack}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            ← Back
          </motion.button>

          {/* Floating images */}
          {images.slice(0, 4).map((img, i) => (
            <FloatingImage
              key={img.id}
              src={img.images[0]}
              position={{ ...FLOAT_POSITIONS[i], isMobile }}
              scrollProgress={scrollYProgress}
              index={i}
            />
          ))}

          {/* Big category name */}
          <motion.div
            className={styles.heroTitle}
            style={{
              scale: springTitleScale,
              opacity: springTitleOpacity,
              y: springTitleY,
              zIndex: 30 // Force exactly here for framer motion overrides
            }}
          >
            {categoryTitle}
          </motion.div>


        </div>
      </div>

      {/* Listings that emerge below the hero */}
      <motion.section
        className={styles.listingsSection}
        style={{ opacity: listingsSpring }}
      >
        <div className={styles.listingsHeader}>
          <h2>{categoryTitle}</h2>
          <p>{filteredImages.length} properties available</p>
        </div>

        {/* ── Filter Bar ──────────────────────────────── */}
        <div className={styles.filterWrap}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Geo Filtering</label>
              <select name="location" value={localFilters.location} onChange={handleFilterChange}>
                <option value="">Off (Show All)</option>
                {window.sessionStorage.getItem('isLocationDetected') === 'true' && <option value="My Location">On (Within 50km)</option>}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>Max Price</label>
              <select name="priceMax" value={localFilters.priceMax} onChange={handleFilterChange}>
                <option value="">No Max</option>
                <option value="5000000">Up to ₹50L</option>
                <option value="10000000">Up to ₹1Cr</option>
                <option value="50000000">Up to ₹5Cr</option>
              </select>
            </div>
            {(taxonomy?.subFilters?.length > 0 || dynamicKeys.length > 0) && (
              <button
                className={styles.subFilterToggle}
                onClick={() => setShowSubFilters(v => !v)}
              >
                <SlidersHorizontal size={16} />
                {showSubFilters ? 'Less Filters' : 'More Filters'}
              </button>
            )}
            <button className={styles.searchBtn} onClick={() => { }}>
              <Search size={16} /> Search
            </button>
          </div>

          <AnimatePresence>
            {showSubFilters && (
              <motion.div
                className={styles.subFilterRow}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
                transition={{ duration: 0.3 }}
              >
                {/* Fallback Static Subfilters */}
                {taxonomy?.subFilters && taxonomy.subFilters.map(sf => (
                  <div key={sf.key} className={styles.filterGroup}>
                    <label>{sf.label}</label>
                    <select name={sf.key} value={localFilters[sf.key] || ''} onChange={handleFilterChange}>
                      <option value="">Any {sf.label}</option>
                      {sf.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
                
                {/* Dynamically Injected Admin Subfilters */}
                {dynamicKeys.map(key => (
                  <div key={key} className={styles.filterGroup}>
                    <label>{key}</label>
                    <select name={key} value={localFilters[key] || ''} onChange={handleFilterChange}>
                      <option value="">Any {key}</option>
                      {dynamicOptions[key].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.listingsGrid}>
          {filteredImages.length > 0
            ? filteredImages.map((property, i) => (
              <PropertyListingCard key={property.id} property={property} index={i} />
            ))
            : (
              <div className={styles.noResults} style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No properties found within 50km.</p>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>We couldn't find any {categoryTitle.toLowerCase()} near your current location.</p>
                <button 
                  onClick={() => setLocalFilters(prev => ({ ...prev, location: '' }))}
                  style={{ background: 'white', color: 'black', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Show All Properties
                </button>
              </div>
            )
          }
        </div>
      </motion.section>
    </div>
  );
}
