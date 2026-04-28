import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Scaling, Phone } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import { useAdmin } from '../../admin/context/AdminContext';
import styles from './PropertyCard.module.css';

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

export default function PropertyCard({ property }) {
  const { siteSettings } = useAdmin();
  const navigate = useNavigate();
  const { id, title, price, status, location, address, beds, bedrooms, baths, bathrooms, sqft, area } = property;
  const [imgErrors, setImgErrors] = useState({});
  const [activeSlide, setActiveSlide] = useState(0);
  
  // Touch handlers for mobile swiping
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      setActiveSlide(i => (i + 1) % allImages.length);
    } else if (distance < -minSwipeDistance) {
      setActiveSlide(i => (i - 1 + allImages.length) % allImages.length);
    }
  };

  const handleImageClick = (e) => {
    // Only navigate if user was not swiping
    if (touchStart && touchEnd && Math.abs(touchStart - touchEnd) > minSwipeDistance) return;
    navigate(`/properties/${id}`, { state: { property } });
  };

  // Build image array — match details page logic
  const rawImages = property.imageUrls || property.images || (property.image ? [property.image] : []);
  const allImages = (Array.isArray(rawImages) && rawImages.filter(img => img && typeof img === 'string' && img.trim() !== '').length > 0) 
    ? rawImages.filter(img => img && typeof img === 'string' && img.trim() !== '') 
    : [PLACEHOLDER];

  // Handle live data fallbacks
  const displayLocation = location || address || 'Location TBD';
  const displayBeds = beds || bedrooms || 0;
  const displayBaths = baths || bathrooms || 0;
  const displaySqft = sqft || area || 0;

  const handleImgError = (idx) => {
    setImgErrors(prev => ({ ...prev, [idx]: true }));
  };

  // Prefer numericPrice (raw number) so formatPrice() can correctly render K/L/Cr.
  // Falls back to the old pre-formatted price string for backward compatibility.
  const displayPrice = formatPrice(property.numericPrice || price);

  // ── Contact Logic ──
  const propertyPhone = property.sellerPhone || property.agentPhone;
  const globalPhone = siteSettings?.whatsappBusiness || siteSettings?.primaryPhone || '';
  const finalPhone = (propertyPhone || globalPhone || '').toString();
  const cleanPhone = finalPhone.replace(/\D/g, '');

  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi, I'm interested in ${title}`)}`
    : null;
  const callLink = cleanPhone ? `tel:${cleanPhone}` : null;
  

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <motion.article
      className={styles.propertyCard}
      whileHover={isMobile ? {} : { y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image Slideshow/Carousel — click navigates to detail page */}
      <div 
        className={styles.carousel} 
        onClick={handleImageClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ cursor: 'pointer' }}
      >


        <div className={styles.slides}>
          {allImages.map((img, idx) => (
            <img
              key={idx}
              src={imgErrors[idx] ? PLACEHOLDER : img}
              alt={`${title} view ${idx + 1}`}
              className={styles.slideImg}
              style={{ transform: `translateX(${(idx - activeSlide) * 100}%)` }}
              onError={() => handleImgError(idx)}
            />
          ))}
        </div>

        {allImages.length > 1 && (
          <>
            <button
              className={`${styles.slideArrow} ${styles.slideArrowLeft} ${styles.desktopOnly}`}
              onClick={e => { e.preventDefault(); e.stopPropagation(); setActiveSlide(i => (i - 1 + allImages.length) % allImages.length); }}
              aria-label="Previous image"
            >‹</button>
            <button
              className={`${styles.slideArrow} ${styles.slideArrowRight} ${styles.desktopOnly}`}
              onClick={e => { e.preventDefault(); e.stopPropagation(); setActiveSlide(i => (i + 1) % allImages.length); }}
              aria-label="Next image"
            >›</button>
            <div className={styles.dots}>
              {allImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${idx === activeSlide ? styles.dotActive : ''}`}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setActiveSlide(idx); }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.content}>
        <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            className={styles.badge}
            style={{
              backgroundColor: status === 'Inactive' ? 'rgba(255,255,255,0.8)' : ((property.listingType === 'Rent' || status === 'For Rent') ? '#007bff' : '#ed1b24'),
              color: status === 'Inactive' ? '#222' : 'white',
              border: status === 'Inactive' ? '1px solid #ccc' : 'none'
            }}
          >
            {status === 'Inactive' ? 'Inactive' : ((property.listingType === 'Rent' || status === 'For Rent') ? 'For Rent' : 'For Sale')}
          </span>
          {property.isUsedProperty && (
            <span
              className={styles.badge}
              style={{ backgroundColor: 'black', color: 'white', border: 'none' }}
            >
              Used
            </span>
          )}
          {property.isFeatured && (
            <span className={styles.featuredTag} style={{ marginLeft: 0 }}>Featured</span>
          )}
        </div>
        <div className={styles.price}>
          {displayPrice}
          {(property.listingType === 'Rent' || status === 'For Rent') && (
            <span className={styles.perMonth}>/month</span>
          )}
        </div>
        <div className={styles.titleWrap}>
          <Link to={`/properties/${id}`} state={{ property }} className={styles.titleLink}>
            <h3 className={styles.title}>{title}</h3>
          </Link>
        </div>
        <Link to={`/properties/${id}`} state={{ property }} className={styles.locationLink}>
          <div className={styles.location}>
            <MapPin size={16} /> {displayLocation}{property.district ? `, ${property.district}` : ''}
          </div>
        </Link>
        {(property.createdAt || property.addedOn) && (
          <div className={styles.addedDate}>
            Added on: {formatDate(property.createdAt || property.addedOn)}
          </div>
        )}

        {/* Contact quick-buttons moved here */}
        <div className={styles.cardActions}>
          {callLink && (
            <a href={callLink} className={styles.cardActionBtn} title="Call agent" onClick={e => e.stopPropagation()}>
              <Phone size={18} /> Call
            </a>
          )}
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer" className={`${styles.cardActionBtn} ${styles.cardActionWa}`} title="WhatsApp agent" onClick={e => e.stopPropagation()}>
              <WhatsAppIcon size={18} /> WhatsApp
            </a>
          )}
        </div>
        <div className={styles.features}>
          {displayBeds > 0 && (
            <span className={styles.featureItem}><BedDouble size={16} /> {displayBeds} Beds</span>
          )}
          {displayBaths > 0 && (
            <span className={styles.featureItem}><Bath size={16} /> {displayBaths} Baths</span>
          )}
          {displaySqft > 0 && (
            <span className={styles.featureItem}><Scaling size={16} /> {Number(displaySqft).toLocaleString()} sqft</span>
          )}
        </div>
        <Link to={`/properties/${id}`} state={{ property }} className="btn btn-outline" style={{ width: '100%' }}>
          View Details
        </Link>
      </div>
    </motion.article>
  );
}
