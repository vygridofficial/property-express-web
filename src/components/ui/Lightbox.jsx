import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Lightbox.module.css';

export default function Lightbox({ images = [], index = 0, isOpen = false, onClose, onPrev, onNext }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!images || images.length === 0) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Touch handlers for mobile swiping
  const [touchStart, setTouchStart] = React.useState(null);
  const [touchEnd, setTouchEnd] = React.useState(null);
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
      onNext();
    } else if (distance < -minSwipeDistance) {
      onPrev();
    }
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close lightbox">
            <X size={32} />
          </button>
          
          <div className={styles.container}>
            <div className={styles.imageWrapper}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={index}
                  src={images[index]}
                  alt={`View ${index + 1}`}
                  className={styles.mainImage}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button className={`${styles.navBtn} ${styles.prevBtn} ${styles.desktopOnly}`} onClick={(e) => { e.stopPropagation(); onPrev(); }}>
                    <ChevronLeft size={48} />
                  </button>
                  <button className={`${styles.navBtn} ${styles.nextBtn} ${styles.desktopOnly}`} onClick={(e) => { e.stopPropagation(); onNext(); }}>
                    <ChevronRight size={48} />
                  </button>
                  
                  <div className={styles.counter}>
                    {index + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
