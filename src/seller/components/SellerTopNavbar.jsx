import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, User, Mail, ShieldCheck } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import styles from '../styles/seller.module.css';

export default function SellerTopNavbar() {
  const { user, theme, toggleTheme } = useSeller();
  const [showProfile, setShowProfile] = useState(false);
  const panelRef = useRef(null);

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
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className={styles.avatar} />
          ) : (
            <div className={styles.navActionBtn} style={{ width: 34, height: 34, borderRadius: '50%' }}>
              <User size={18} />
            </div>
          )}
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
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className={styles.panelAvatar} />
              ) : (
                <div className={styles.panelAvatar} style={{ background: 'var(--stroke)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={40} color="var(--text-muted)" />
                </div>
              )}
              
              <h3 className={styles.panelName}>{user?.displayName || 'Seller Account'}</h3>
              <p className={styles.panelEmail}>{user?.email}</p>

              <div className={styles.panelDivider} />

              <div className={styles.panelInfoGrid}>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Account Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700 }}>
                    <ShieldCheck size={16} />
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
