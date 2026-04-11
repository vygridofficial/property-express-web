import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import styles from './GtaMarker.module.css';

export default function GtaMarker({ property, style, delay, mobileCompact }) {
  if (!property) return null;

  const { id, price, images, title, image } = property;
  const displayPrice = formatPrice(price);
  const displayImages = images && images.length > 0 ? images : (image ? [image] : ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80']);

  if (mobileCompact) {
    return (
      <motion.div
        className={`${styles.gtaMarker} ${styles.gtaMarkerCompact}`}
        style={style}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ delay: delay, duration: 0.4 }}
      >
        <Link to={`/properties/${id}`} state={{ property }} className={styles.compactPin}>
          {displayPrice}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.gtaMarker}
      style={style}
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: delay, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      whileHover={{ y: -5, scale: 1.06, zIndex: 20 }}
    >
      <Link to={`/properties/${id}`} state={{ property }} className={styles.pinCard}>
        <div className={styles.pinCardPrice}>
          <Home size={14} /> {displayPrice}
        </div>
        <div className={styles.pinCardImg}>
          <img src={displayImages[0]} alt={title} />
        </div>
      </Link>
    </motion.div>
  );
}
