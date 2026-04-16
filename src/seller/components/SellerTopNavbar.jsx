import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, User, Mail, ShieldCheck } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import styles from '../styles/seller.module.css';

export default function SellerTopNavbar() {
  const { user, theme, toggleTheme } = useSeller();
  const [showProfile, setShowProfile] = useState(false);
  const panelRef = useRef(null);

  // Get initials from display name
  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const initials = getInitials(user?.displayName);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={styles.topNavbar}>
      {/* Theme Toggle */}
      <button 
        className={styles.navActionBtn} 
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Profile Trigger */}
      <div style={{ position: 'relative' }} ref={panelRef}>
        <div 
          className={styles.profileTrigger} 
          onClick={() => setShowProfile(!showProfile)}
        >
          {/* Always use initials as per user request to replace broken images */}
          <div style={{ 
            width: 36, height: 36, borderRadius: '50%', 
            background: 'var(--text-main)', color: 'var(--card-bg-light)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
            border: '2px solid white'
          }}>
            {initials}
          </div>
          <span className={styles.profileName}>{user?.displayName?.split(' ')[0] || 'Account'}</span>
        </div>

        {/* Profile Panel (Google Style) */}
        <AnimatePresence>
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={styles.profilePanel}
            >
              <div 
                className={styles.panelAvatar} 
                style={{ 
                  background: 'var(--text-main)', color: 'var(--card-bg-light)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.75rem', fontWeight: 800, border: '4px solid var(--stroke)'
                }}
              >
                {initials}
              </div>
              
              <h3 className={styles.panelName}>{user?.displayName || 'Seller Account'}</h3>
              <p className={styles.panelEmail}>{user?.email}</p>

              <div className={styles.panelDivider} />

              <div className={styles.panelInfoGrid}>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Account Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '0.9rem' }}>
                    <ShieldCheck size={18} />
                    <span>Verified Seller</span>
                  </div>
                </div>
                
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Email Address</label>
                  <span className={styles.infoValue}>{user?.email}</span>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Last Signed In</label>
                  <span className={styles.infoValue}>{user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              
              {/* Note: No logout button here as per user request */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
