import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Scaling } from 'lucide-react';
import styles from './PropertyCard.module.css';

export default function PropertyCard({ property }) {
  const { id, title, price, status, location, address, beds, bedrooms, baths, bathrooms, sqft, area, images, image } = property;

  // Handle live data fallbacks
  const displayLocation = location || address || "Location TBD";
  const displayBeds = beds || bedrooms || 0;
  const displayBaths = baths || bathrooms || 0;
  const displaySqft = sqft || area || 0;
  
  // Handle image array vs single image string from Firestore
  const allImages = images && Array.isArray(images) && images.length > 0 
    ? images 
    : (image ? [image] : ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80']);

  const displayImages = [
    allImages[0],
    allImages[1] || allImages[0],
    allImages[2] || allImages[0]
  ];

  // Handle price display (Cr/L vs number)
  const displayPrice = typeof price === 'string' 
    ? price 
    : `₹${price.toLocaleString()}`;

  return (
    <motion.article 
      className={styles.propertyCard}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.imgGallery}>
        <span className={styles.badge} style={{ backgroundColor: status === 'For Rent' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.5)', color: status === 'For Rent' ? 'white' : '#222' }}>
          {status}
        </span>
        {displayImages.map((img, idx) => (
          <div key={idx} className={`${styles.galleryItem} ${idx === 0 ? styles.galleryMain : ''}`}>
            <img src={img} alt={`${title} view ${idx + 1}`} className={styles.propertyImg} />
          </div>
        ))}
      </div>
      <div className={styles.content}>
        <div className={styles.price}>
          {displayPrice} {status === 'For Rent' && <span className={styles.perMonth}>/mo</span>}
        </div>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.location}>
          <MapPin size={16} /> {displayLocation}
        </div>
        <div className={styles.features}>
          <span className={styles.featureItem}><BedDouble size={16} /> {displayBeds} Beds</span>
          <span className={styles.featureItem}><Bath size={16} /> {displayBaths} Baths</span>
          <span className={styles.featureItem}><Scaling size={16} /> {displaySqft.toLocaleString()} sqft</span>
        </div>
        <Link to={`/properties/${id}`} className="btn btn-outline" style={{ width: '100%' }}>View Details</Link>
      </div>
    </motion.article>
  );
}
