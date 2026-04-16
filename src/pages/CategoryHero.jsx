import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Phone } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdmin } from '../admin/context/AdminContext';
import { FILTER_TAXONOMY } from '../data/filterTaxonomy';
import { KERALA_DISTRICTS, DISTRICT_COORDINATES } from '../data/districts';
import { getPropertyCoordinates, getDistanceFromLatLonInKm } from '../utils/geo';
import { formatPrice } from '../utils/formatPrice';
import { formatDate } from '../utils/formatDate';
import styles from './CategoryHero.module.css';

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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
  const { siteSettings } = useAdmin();

  // Ensure we have an image to show
  const displayImage = property.images && property.images.length > 0
    ? property.images[0]
    : (property.image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80');

  const displayPrice = formatPrice(property.price);

  // ── Contact Logic ──
  const propertyPhone = property.sellerPhone || property.agentPhone;
  const globalPhone = siteSettings?.whatsappBusiness || siteSettings?.primaryPhone || '';
  const finalPhone = (propertyPhone || globalPhone || '').toString();
  const cleanPhone = finalPhone.replace(/\D/g, '');

  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi, I'm interested in ${property.title}`)}`
    : null;
  const callLink = cleanPhone ? `tel:${cleanPhone}` : null;

  return (
    <motion.div
      className={styles.listingCard}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
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

        <div className={styles.cardActions}>
          {callLink && (
            <a href={callLink} className={styles.cardActionBtn} title="Call agent" onClick={e => e.stopPropagation()}>
              <Phone size={18} />
            </a>
          )}
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer" className={`${styles.cardActionBtn} ${styles.cardActionWa}`} title="WhatsApp agent" onClick={e => e.stopPropagation()}>
              <WhatsAppIcon size={18} />
            </a>
          )}
        </div>
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
        {formatDate(property.createdAt) && (
          <div className={styles.listingAddedDate}>
            Added on: {formatDate(property.createdAt)}
          </div>
        )}
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

export default function CategoryHero({ categoryId, categoryTitle, onBack, liveProperties, siteSettings }) {
  const containerRef = useRef(null);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [showSubFilters, setShowSubFilters] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const taxonomy = React.useMemo(() => {
    // 1. Check if DB has custom taxonomy for this category
    if (siteSettings?.taxonomy?.[categoryId]) {
      return siteSettings.taxonomy[categoryId];
    }
    // 2. Fall back to static FILTER_TAXONOMY
    return FILTER_TAXONOMY[categoryId] || { subFilters: [] };
  }, [categoryId, siteSettings]);

  const [localFilters, setLocalFilters] = useState({
    district: '',
    location: '',
    priceMax: '',
    ...Object.fromEntries((taxonomy?.subFilters || []).map(sf => [sf.key, '']))
  });

  const baseProperties = liveProperties || [];

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

  // Sync filters when category changes
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);

    const isAutoGeo = searchParams.get('autoGeo') === 'true';

    setLocalFilters({
      district: '',
      location: isAutoGeo ? 'My Location' : '',
      priceMax: '',
      ...Object.fromEntries((taxonomy?.subFilters || []).map(sf => [sf.key, '']))
    });

    if (isAutoGeo) {
      searchParams.delete('autoGeo');
      setSearchParams(searchParams, { replace: true });
    }

    setShowSubFilters(false);

    return () => mq.removeEventListener('change', handler);
  }, [categoryId, taxonomy]);

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

  const handleFilterChange = (e) => {
    setLocalFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGeoToggle = () => {
    if (localFilters.location === 'My Location') {
      setLocalFilters(prev => ({ ...prev, location: '' }));
      return;
    }

    // Turn ON
    const currentlyDetected = window.sessionStorage.getItem('isLocationDetected') === 'true';
    if (currentlyDetected) {
      setLocalFilters(prev => ({ ...prev, location: 'My Location' }));
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition((position) => {
        const center = { lat: position.coords.latitude, lng: position.coords.longitude };
        window.sessionStorage.setItem('mapCenter', JSON.stringify(center));
        window.sessionStorage.setItem('isLocationDetected', 'true');
        setIsDetectingLocation(false);
        setLocalFilters(prev => ({ ...prev, location: 'My Location' }));
      }, (error) => {
        console.error("Error getting location", error);
        alert("Unable to retrieve your location. Please check browser permissions.");
        setIsDetectingLocation(false);
      });
    }
  };

  // Apply filters to images & sort by haversine distance
  const filteredImages = React.useMemo(() => {
    let result = [...images];

    // Filter District
    if (localFilters.district) {
      result = result.filter(img => (img.district || '').toLowerCase() === localFilters.district.toLowerCase());
    }

    // Filter Location (Radial enforcement only)
    if (localFilters.location === 'My Location') {
      const centerCache = window.sessionStorage.getItem('mapCenter');
      if (centerCache) {
        try {
          const center = JSON.parse(centerCache);
          result.forEach(img => {
            const distKey = KERALA_DISTRICTS.find(d => d.toLowerCase() === (img.district || '').toLowerCase()) || img.district;
            const coords = DISTRICT_COORDINATES[distKey];
            if (coords) {
              img._distance = getDistanceFromLatLonInKm(center.lat, center.lng, coords.lat, coords.lng);
            } else {
              const exactCoords = getPropertyCoordinates(img);
              if (exactCoords) {
                img._distance = getDistanceFromLatLonInKm(center.lat, center.lng, exactCoords.lat, exactCoords.lng);
              } else {
                img._distance = 999999;
              }
            }
          });

          // Strict Max 50km Radius filter
          result = result.filter(img => img._distance <= 50);

          // Arrange from Nearest to Farthest
          result.sort((a, b) => a._distance - b._distance);
        } catch (e) { }
      }
    }

    // Filter Price
    if (localFilters.priceMax) {
      result = result.filter(img => (img.numericPrice || 0) <= parseFloat(localFilters.priceMax));
    }

    // Filter Subfilters (Taxonomy & Dynamic)
    const allSubFilterKeys = new Set([
      ...(taxonomy?.subFilters || []).map(sf => sf.key),
      ...dynamicKeys
    ]);

    allSubFilterKeys.forEach(k => {
      if (localFilters[k]) {
        const filterVal = localFilters[k].toString().toLowerCase();

        result = result.filter(img => {
          // 1. Check top-level property
          const topVal = img[k];
          if (topVal !== undefined && topVal !== null && topVal.toString().toLowerCase() === filterVal) return true;

          // 2. Check dynamicFilters
          const dynVal = img.dynamicFilters?.[k];
          if (dynVal !== undefined && dynVal !== null && dynVal.toString().toLowerCase() === filterVal) return true;

          // 3. Special Case: BHK / Bedrooms mapping
          if (k === 'bhk') {
            const bedCount = parseInt(img.bedrooms || img.beds || 0);
            if (filterVal === 'studio' && bedCount <= 1) return true;
            if (filterVal.includes('bhk')) {
              const numericMatch = filterVal.match(/\d+/);
              if (numericMatch) {
                const targetBeds = parseInt(numericMatch[0]);
                if (filterVal.includes('+')) {
                  return bedCount >= targetBeds;
                }
                return bedCount === targetBeds;
              }
            }
          }

          return false;
        });
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
            <div className={styles.geoToggleWrap}>
              <div className={styles.geoToggleLabel}>
                <span>Location Filter</span>
                <span>{isDetectingLocation ? 'Detecting...' : (localFilters.location === 'My Location' ? 'Within 50km' : 'All Areas')}</span>
              </div>
              <button
                type="button"
                className={styles.toggleSwitch}
                data-active={localFilters.location === 'My Location'}
                onClick={handleGeoToggle}
                disabled={isDetectingLocation}
                aria-label="Toggle Geo Filter"
              >
                <div className={styles.toggleKnob} />
              </button>
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
            <div className={styles.filterGroup}>
              <label>District</label>
              <select name="district" value={localFilters.district} onChange={handleFilterChange}>
                <option value="">All Districts</option>
                {KERALA_DISTRICTS.map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
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
                key="sub-filters-row"
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
                <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {localFilters.district
                    ? `No properties found in ${localFilters.district}`
                    : localFilters.location === 'My Location'
                      ? 'No properties found within 50km'
                      : 'No properties found'
                  }
                </p>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                  {localFilters.district
                    ? `We couldn't find any ${categoryTitle.toLowerCase()} in the ${localFilters.district} district matching your criteria.`
                    : localFilters.location === 'My Location'
                      ? `We couldn't find any ${categoryTitle.toLowerCase()} near your current location.`
                      : `Try adjusting your filters to find more ${categoryTitle.toLowerCase()}.`
                  }
                </p>
                <button
                  onClick={() => setLocalFilters({ district: '', location: '', priceMax: '', ...Object.fromEntries((taxonomy?.subFilters || []).map(sf => [sf.key, ''])) })}
                  style={{ background: 'white', color: 'black', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Clear All Filters
                </button>
              </div>
            )
          }
        </div>
      </motion.section>
    </div>
  );
}
