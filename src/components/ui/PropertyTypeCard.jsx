import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import styles from './PropertyTypeCard.module.css';

export default function PropertyTypeCard({ type, categorySlug, index = 0 }) {
  const navigate = useNavigate();
  const IconComponent = LucideIcons[type.icon] || LucideIcons.Building2;

  const handleClick = () => {
    navigate(`/properties/listings?category=${encodeURIComponent(type.name)}`);
  };

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      onClick={handleClick}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
    >
      {type.image && (
        <div className={styles.imgWrap}>
          <img src={type.image} alt={type.name} className={styles.bgImg} />
          <div className={styles.imgOverlay} />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <IconComponent size={28} />
        </div>
        <h3 className={styles.name}>{type.name}</h3>
        {type.subTypes && type.subTypes.length > 0 && (
          <p className={styles.sub}>{type.subTypes.slice(0, 3).join(' · ')}</p>
        )}
        <span className={styles.cta}>View Listings →</span>
      </div>
    </motion.div>
  );
}
