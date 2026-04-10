import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import MobileBottomNav from '../components/MobileBottomNav';
import CategoryDeleteModal from '../components/CategoryDeleteModal';
import Login from '../pages/Login';
import { useAdmin } from '../context/AdminContext';
import styles from '../styles/admin.module.css';

export default function AdminLayout() {
  const location = useLocation();
  // isAuthenticated is null while Firebase is resolving, false when logged out, true when logged in
  const { isAuthenticated } = useAdmin();

  // Show nothing while Firebase is resolving auth state (prevents flash-to-login on refresh)
  if (isAuthenticated === null) {
    return (
      <div className={styles.adminLayout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className={styles.adminCanvas} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
        >
          <div style={{
            width: 40, height: 40, border: '3px solid rgba(0,0,0,0.1)',
            borderTop: '3px solid #ed1b24', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <div className={styles.adminCanvas} />
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            style={{ width: '100%' }}
          >
            <Login />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}
          >
            {/* Desktop Sidebar — hidden on mobile via CSS */}
            <Sidebar />

            {/* Main scrollable area */}
            <div className={styles.mainContent} style={{ overflowY: 'auto' }}>
              <TopNavbar />
              <main className={styles.pageContainer}>
                <AnimatePresence>
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>

            {/* Mobile Bottom Nav — shown only on mobile via CSS */}
            <MobileBottomNav />
            <CategoryDeleteModal />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
