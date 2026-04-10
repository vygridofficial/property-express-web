import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import styles from './GtaMarker.module.css';

export default function GtaMarker({ property, style, delay, mobileCompact }) {
  const { id, price, images, title } = property;

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
        <Link to={`/properties/${id}`} className={styles.compactPin}>
          ${price.toLocaleString()}
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
      <Link to={`/properties/${id}`} className={styles.pinCard}>
        <div className={styles.pinCardPrice}>
          <Home size={14} /> ${price.toLocaleString()}
        </div>
        <div className={styles.pinCardImg}>
          <img src={images[0]} alt={title} />
        </div>
      </Link>
    </motion.div>
  );
}
