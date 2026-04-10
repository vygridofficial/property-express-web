import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Users, MessageSquare, Star, Building2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import styles from '../styles/admin.module.css';
import logo from '../../assets/logo.png';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

/* ─── Portal Bottom Sheet — renders directly on document.body ─── */
function BottomSheet({ show, onClose, isDark, children }) {
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return ReactDOM.createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: isDark ? 'rgba(14, 18, 32, 0.98)' : 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderTop: `1px solid ${dividerColor}`,
              borderRadius: '24px 24px 0 0',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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

/* ─── Portal Desktop Dropdown — avoids stacking context clipping ─── */
function DesktopDropdown({ show, anchorRef, onClose, isDark, children, width }) {
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      });
    }
  }, [show, anchorRef]);

  return ReactDOM.createPortal(
    <AnimatePresence>
      {show && (
        <>
          {/* invisible close layer */}
          <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed',
              top: pos.top,
              right: pos.right,
              zIndex: 9999,
              width,
              maxHeight: 480,
              overflowY: 'auto',
              background: isDark ? 'rgba(14, 18, 32, 0.97)' : 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.90)',
              borderRadius: 20,
              boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.40)' : '0 20px 60px rgba(0,0,0,0.15)',
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

export default function TopNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markAllAsRead, deleteNotification, clearAllNotifications, isDark, toggleTheme } = useAdmin();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const isMobile = useIsMobile();

  const notifBtnRef = useRef(null);
  const aboutBtnRef = useRef(null);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard';
    if (path.includes('/properties')) {
      if (path.includes('flats')) return 'Flats';
      if (path.includes('plots')) return 'Plots';
      if (path.includes('warehouses')) return 'Warehouses';
      if (path.includes('villas')) return 'Villas';
      return 'All Properties';
    }
    if (path.includes('/inquiries')) return 'Enquiries';
    if (path.includes('/reviews')) return 'Reviews';
    if (path.includes('/settings')) return 'Site Settings';
    if (path.includes('/contact-social')) return 'Contact & Social';
    return 'Admin Panel';
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const getNotifIcon = (type) => {
    if (type === 'New Enquiry') return <MessageSquare size={16} />;
    if (type === 'New Review') return <Star size={16} />;
    return <Building2 size={16} />;
  };

  const handleNotifClick = (n) => {
    setShowNotifications(false);
    navigate(n.link);
  };

  const infoRows = [
    ['Version', 'v1.0.0'],
    ['Build', '2026'],
    ['Framework', 'React + Vite'],
    ['UI', 'Glassmorphism'],
    ['Font', 'Outfit'],
  ];

  /* ─── Shared Notification Content ─── */
  const NotifContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.25rem', borderBottom: `1px solid ${dividerColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>Notifications</h3>
          {notifications.length > 0 && (
            <span style={{ background: '#ed1b24', color: 'white', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
              {notifications.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {unreadCount > 0 && <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>Mark read</button>}
          {notifications.length > 0 && <button onClick={clearAllNotifications} style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: '#ed1b24', cursor: 'pointer', fontWeight: 600 }}>Clear All</button>}
          {isMobile && <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)', display: 'flex' }}><X size={20} /></button>}
        </div>
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Bell size={36} style={{ color: 'var(--admin-text-muted)', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-muted)', fontWeight: 300 }}>You're all caught up</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {notifications.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }} transition={{ duration: 0.2 }}
              onClick={() => handleNotifClick(n)}
              style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', borderBottom: i < notifications.length - 1 ? `1px solid ${dividerColor}` : 'none', background: n.read ? 'transparent' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(237,27,36,0.03)'), borderLeft: n.read ? '2px solid transparent' : '2px solid #ed1b24' }}
            >
              <div style={{ padding: '0.5rem', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderRadius: '50%', color: 'var(--admin-text-muted)', flexShrink: 0 }}>{getNotifIcon(n.type)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', fontWeight: 400, color: 'var(--admin-text-body)', lineHeight: 1.4 }}>{n.message}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{n.time}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, background: 'rgba(0,0,0,0.06)', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(237,27,36,0.1)'; e.currentTarget.style.color = '#ed1b24'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = 'var(--admin-text-muted)'; }}
              ><X size={11} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );

  /* ─── Shared About Content ─── */
  const AboutContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', borderBottom: `1px solid ${dividerColor}`, position: 'relative' }}>
        {isMobile && <button onClick={() => setShowAbout(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)', display: 'flex' }}><X size={20} /></button>}
        <img src={logo} alt="Property Express" style={{ height: 64, objectFit: 'contain' }} />
        <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>Property Express</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-muted)', fontWeight: 300 }}>Admin Dashboard</p>
      </div>
      <div style={{ padding: '1rem 1.5rem' }}>
        {infoRows.map(([label, value], i) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: i < infoRows.length - 1 ? `1px solid ${dividerColor}` : 'none' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 300 }}>{label}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-main)', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <header className={styles.topNav}>
      <h1 className={styles.pageTitle}>{getPageTitle()}</h1>

      <div className={styles.navActions}>
        {/* Theme Toggle */}
        <button className={styles.iconBtn} onClick={toggleTheme} style={{ width: 40, height: 40 }}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button ref={notifBtnRef} className={styles.iconBtn} onClick={() => { setShowNotifications(v => !v); setShowAbout(false); }} style={{ width: 40, height: 40, position: 'relative' }}>
            <Bell size={20} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  style={{ position: 'absolute', top: 2, right: 2, background: '#ed1b24', color: 'white', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, pointerEvents: 'none' }}
                >{unreadCount}</motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Logo Avatar */}
        <div style={{ position: 'relative' }}>
          <button ref={aboutBtnRef} onClick={() => { setShowAbout(v => !v); setShowNotifications(false); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <img src={logo} alt="Property Express" className={styles.avatar} />
          </button>
        </div>
      </div>

      {/* ── Portalled Panels ── */}
      {isMobile ? (
        <>
          <BottomSheet show={showNotifications} onClose={() => setShowNotifications(false)} isDark={isDark}>
            <NotifContent />
          </BottomSheet>
          <BottomSheet show={showAbout} onClose={() => setShowAbout(false)} isDark={isDark}>
            <AboutContent />
          </BottomSheet>
        </>
      ) : (
        <>
          <DesktopDropdown show={showNotifications} anchorRef={notifBtnRef} onClose={() => setShowNotifications(false)} isDark={isDark} width={360}>
            <NotifContent />
          </DesktopDropdown>
          <DesktopDropdown show={showAbout} anchorRef={aboutBtnRef} onClose={() => setShowAbout(false)} isDark={isDark} width={300}>
            <AboutContent />
          </DesktopDropdown>
        </>
      )}
    </header>
  );
}
