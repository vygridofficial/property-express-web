import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import styles from '../../pages/Properties.module.css';

const CATEGORY_META = {
  residential: {
    label: 'Residential Properties',
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    desc: 'Villas, apartments, plots & more',
  },
  commercial: {
    label: 'Commercial Properties',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    desc: 'Office spaces, retail shops & showrooms',
  },
  industrial: {
    label: 'Industrial Properties',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    desc: 'Warehouses, factories & logistics hubs',
  },
};

export default function CategoryCard({ slug, onClick, index = 0 }) {
  const meta = CATEGORY_META[slug] || {
    label: slug,
    img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
    desc: `Explore ${slug} listings`,
  };

  return (
    <motion.div
      className={styles.catCardWrap}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      onClick={onClick}
    >
      <div className={styles.catCard}>
        <img src={meta.img} alt={meta.label} className={styles.catBgImg} />
        <div className={styles.catOverlay} />
        <div className={styles.catContent}>
          <h3 className={styles.catTitle}>{meta.label}</h3>
          <p className={styles.catDesc}>{meta.desc}</p>
          <span className={styles.catCta}>
            Explore&nbsp;<ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
