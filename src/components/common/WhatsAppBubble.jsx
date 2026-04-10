import React, { useState } from 'react';
import { MessageCircle, Phone, MapPin, X, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './WhatsAppBubble.module.css';

// Inline brand SVGs (Instagram & Facebook removed from lucide-react v1.x)
const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

export default function WhatsAppBubble() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const actions = [
    { id: 'instagram', icon: <InstagramIcon size={20} />, href: 'https://instagram.com/propertyexpress', color: '#E1306C' },
    { id: 'whatsapp', icon: <MessageCircle size={20} />, href: 'https://wa.me/15551234567', color: '#25D366' },
    { id: 'facebook', icon: <FacebookIcon size={20} />, href: 'https://facebook.com/propertyexpress', color: '#4267B2' }
  ];

  return (
    <div className={styles.floatingActions}>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.expandedMenu}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {actions.map((action, i) => (
              <motion.a
                key={action.id}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.subBtn}
                style={{ backgroundColor: action.color, color: 'white' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (actions.length - 1 - i) * 0.04 }}
              >
                {action.icon}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        className={styles.floatBtn}
        onClick={toggleMenu}
        title="Contact Us"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? <X size={28} /> : <Share2 size={28} />}
      </motion.button>
    </div>
  );
}
