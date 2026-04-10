import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSiteSettings } from '../../services/propertyService';
import styles from './WhatsAppBubble.module.css';

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
  const [settings, setSettings] = useState(null);

  // Fetch siteSettings from Firebase so social links are always up to date
  useEffect(() => {
    getSiteSettings().then(data => {
      if (data) setSettings(data);
    });
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Build action list from Firebase — only include links that are configured
  const whatsappNum = (settings?.whatsappBusiness || settings?.primaryPhone || '').replace(/\D/g, '');
  const instagramUrl = settings?.instagramUrl || '';
  const facebookUrl = settings?.facebookUrl || '';

  const actions = [
    instagramUrl && {
      id: 'instagram',
      icon: <InstagramIcon size={20} />,
      href: instagramUrl,
      color: '#E1306C',
      label: 'Instagram',
    },
    whatsappNum && {
      id: 'whatsapp',
      icon: <MessageCircle size={20} />,
      href: `https://wa.me/${whatsappNum}`,
      color: '#25D366',
      label: 'WhatsApp',
    },
    facebookUrl && {
      id: 'facebook',
      icon: <FacebookIcon size={20} />,
      href: facebookUrl,
      color: '#4267B2',
      label: 'Facebook',
    },
  ].filter(Boolean);

  // Use fallbacks if Firebase hasn't loaded yet (so bubble still appears)
  const displayActions = actions.length > 0 ? actions : [
    { id: 'whatsapp', icon: <MessageCircle size={20} />, href: '#', color: '#25D366', label: 'WhatsApp' },
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
            {displayActions.map((action, i) => (
              <motion.a
                key={action.id}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={action.label}
                className={styles.subBtn}
                style={{ backgroundColor: action.color, color: 'white' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (displayActions.length - 1 - i) * 0.04 }}
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
