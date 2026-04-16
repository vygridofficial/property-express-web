import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Scaling, Phone, MessageCircle } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import styles from './PropertyCard.module.css';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

export default function PropertyCard({ property }) {
  const { id, title, price, status, location, address, beds, bedrooms, baths, bathrooms, sqft, area, images, image, agentPhone } = property;
  const [imgErrors, setImgErrors] = useState({});
  const [activeSlide, setActiveSlide] = useState(0);

  // Handle live data fallbacks
  const displayLocation = location || address || 'Location TBD';
  const displayBeds = beds || bedrooms || 0;
  const displayBaths = baths || bathrooms || 0;
  const displaySqft = sqft || area || 0;

  // Build image array — use placeholder if none provided
  const rawImages = images && Array.isArray(images) && images.length > 0
    ? images
    : (image ? [image] : []);
  const allImages = rawImages.length > 0 ? rawImages : [PLACEHOLDER];

  const displayPrice = formatPrice(price);

  // WhatsApp & Call using agent's phone or seller's phone
  const phone = property.sellerPhone || property.agentPhone || agentPhone || '';
  const cleanPhone = phone.replace(/\D/g, '');
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi, I'm interested in ${title}`)}`
    : null;
  const callLink = cleanPhone ? `tel:${cleanPhone}` : null;

  const handleImgError = (idx) => setImgErrors(prev => ({ ...prev, [idx]: true }));

  return (
    <motion.article
      className={styles.propertyCard}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image Carousel */}
      <div className={styles.carousel}>
        <span
          className={styles.badge}
          style={{
            backgroundColor: status === 'For Rent' ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)',
            color: status === 'For Rent' ? 'white' : '#222'
          }}
        >
          {status}
        </span>

        {/* Contact quick-buttons */}
        <div className={styles.cardActions}>
          {callLink && (
            <a href={callLink} className={styles.cardActionBtn} title="Call agent" onClick={e => e.stopPropagation()}>
              <Phone size={15} />
            </a>
          )}
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer" className={`${styles.cardActionBtn} ${styles.cardActionWa}`} title="WhatsApp agent" onClick={e => e.stopPropagation()}>
              <MessageCircle size={15} />
            </a>
          )}
        </div>

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
              className={`${styles.slideArrow} ${styles.slideArrowLeft}`}
              onClick={e => { e.preventDefault(); setActiveSlide(i => (i - 1 + allImages.length) % allImages.length); }}
              aria-label="Previous image"
            >‹</button>
            <button
              className={`${styles.slideArrow} ${styles.slideArrowRight}`}
              onClick={e => { e.preventDefault(); setActiveSlide(i => (i + 1) % allImages.length); }}
              aria-label="Next image"
            >›</button>
            <div className={styles.dots}>
              {allImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${idx === activeSlide ? styles.dotActive : ''}`}
                  onClick={e => { e.preventDefault(); setActiveSlide(idx); }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.price}>
          {displayPrice} {status === 'For Rent' && <span className={styles.perMonth}>/mo</span>}
        </div>
        <div className={styles.titleWrap}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.location}>
          <MapPin size={16} /> {displayLocation}{property.district ? `, ${property.district}` : ''}
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
