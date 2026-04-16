import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSiteSettings } from '../../services/propertyService';
import { formatSocialUrl } from '../../utils/social';
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

const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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
      href: formatSocialUrl(instagramUrl, 'instagram'),
      color: '#E1306C',
      label: 'Instagram',
    },
    whatsappNum && {
      id: 'whatsapp',
      icon: <WhatsAppIcon size={20} />,
      href: `https://wa.me/${whatsappNum}`,
      color: '#25D366',
      label: 'WhatsApp',
    },
    facebookUrl && {
      id: 'facebook',
      icon: <FacebookIcon size={20} />,
      href: formatSocialUrl(facebookUrl, 'facebook'),
      color: '#4267B2',
      label: 'Facebook',
    },
  ].filter(Boolean);

  // Use fallbacks if Firebase hasn't loaded yet (so bubble still appears)
  const displayActions = actions.length > 0 ? actions : [
    { id: 'whatsapp', icon: <WhatsAppIcon size={20} />, href: '#', color: '#25D366', label: 'WhatsApp' },
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
