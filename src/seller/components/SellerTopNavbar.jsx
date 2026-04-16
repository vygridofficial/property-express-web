import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, User, Mail, ShieldCheck, X } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import styles from '../styles/seller.module.css';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

/* ─── Portal Bottom Sheet ─── */
function BottomSheet({ show, onClose, isDark, children }) {
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const themeVars = isDark ? { '--text-main': '#ffffff', '--text-muted': '#94a3b8', '--stroke': 'rgba(255, 255, 255, 0.15)', '--card-bg-light': 'rgba(30, 41, 59, 0.4)', color: '#ffffff' } : { '--text-main': '#1e293b', '--text-muted': '#64748b', '--stroke': 'rgba(0, 0, 0, 0.08)', '--card-bg-light': '#ffffff', color: '#1e293b' };

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', }}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              ...themeVars,
              background: isDark ? 'rgba(14, 18, 32, 0.98)' : 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
              borderTop: `1px solid ${dividerColor}`, borderRadius: '24px 24px 0 0',
              width: '100%', maxHeight: '80vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ─── Portal Desktop Dropdown ─── */
function DesktopDropdown({ show, anchorRef, onClose, isDark, children, width }) {
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const themeVars = isDark ? { '--text-main': '#ffffff', '--text-muted': '#94a3b8', '--stroke': 'rgba(255, 255, 255, 0.15)', '--card-bg-light': 'rgba(30, 41, 59, 0.4)', color: '#ffffff' } : { '--text-main': '#1e293b', '--text-muted': '#64748b', '--stroke': 'rgba(0, 0, 0, 0.08)', '--card-bg-light': '#ffffff', color: '#1e293b' };

  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
    }
  }, [show, anchorRef]);

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(
    <AnimatePresence>
      {show && (
        <>
          <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.18 }}
            style={{
              ...themeVars,
              position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999, width, maxHeight: 480, overflowY: 'auto',
              background: isDark ? 'rgba(14, 18, 32, 0.97)' : 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.90)',
              borderRadius: 20, boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.40)' : '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default function SellerTopNavbar() {
  const { user, theme, toggleTheme } = useSeller();
  const [showProfile, setShowProfile] = useState(false);
  const panelRef = useRef(null);
  const isMobile = useIsMobile();
  const isDark = theme === 'dark';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

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

          {isMobile ? (
            <BottomSheet show={showProfile} onClose={() => setShowProfile(false)} isDark={isDark}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', borderBottom: `1px solid ${dividerColor}`, position: 'relative' }}>
                  <button onClick={() => setShowProfile(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={20} /></button>
                  <div style={{ background: 'var(--text-main)', color: 'var(--card-bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, border: '4px solid var(--stroke)', width: 70, height: 70, borderRadius: '50%' }}>
                    {initials}
                  </div>
                  <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.displayName || 'Seller Account'}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 300, wordBreak: 'break-all', textAlign: 'center' }}>{user?.email}</p>
                </div>
                <div style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: `1px solid ${dividerColor}` }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Account Status</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '0.9rem' }}>
                        <ShieldCheck size={18} /><span>Verified Seller</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.2rem', padding: '0.65rem 0', borderBottom: `1px solid ${dividerColor}` }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email Address</span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600, wordBreak: 'break-all' }}>{user?.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last Signed In</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
              </div>
            </BottomSheet>
          ) : (
            <DesktopDropdown show={showProfile} anchorRef={panelRef} onClose={() => setShowProfile(false)} isDark={isDark} width={300}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', borderBottom: `1px solid ${dividerColor}`, position: 'relative' }}>
                  <div style={{ background: 'var(--text-main)', color: 'var(--card-bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, border: '4px solid var(--stroke)', width: 70, height: 70, borderRadius: '50%' }}>
                    {initials}
                  </div>
                  <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.displayName || 'Seller Account'}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 300, wordBreak: 'break-all', textAlign: 'center' }}>{user?.email}</p>
                </div>
                <div style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: `1px solid ${dividerColor}` }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Account Status</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '0.9rem' }}>
                        <ShieldCheck size={18} /><span>Verified</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last Signed In</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
              </div>
            </DesktopDropdown>
          )}
      </div>
    </nav>
  );
}
