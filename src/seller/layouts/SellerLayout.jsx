import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeller } from '../context/SellerContext';
import SellerSidebar from '../components/SellerSidebar';
import SellerMobileBottomNav from '../components/SellerMobileBottomNav';
import SellerLogin from '../pages/Login';
import SellerDashboard from '../pages/Dashboard';
import SignAgreement from '../pages/SignAgreement';
import ListProperty from '../pages/ListProperty';
import SigningHistory from '../pages/SigningHistory';
import SubmissionDetail from '../pages/SubmissionDetail';
import HelpCenter from '../pages/HelpCenter';
import styles from '../styles/seller.module.css';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import SellerTopNavbar from '../components/SellerTopNavbar';

export default function SellerLayout() {
  const { isAuthenticated, loading, theme } = useSeller();

  // Skeleton layout for the entire portal while checking authentication
  if (loading) {
    return (
      <div className={styles.sellerApp} data-theme={theme}>
        <div className={styles.sellerCanvas}></div>
        {/* Desktop Sidebar Skeleton */}
        <div className={styles.desktopSidebar}>
          <div style={{ padding: '2rem' }}>
            <Skeleton height={40} width="80%" style={{ marginBottom: '3rem' }} />
            <Skeleton count={5} height={45} style={{ marginBottom: '1rem', borderRadius: '12px' }} />
          </div>
        </div>
        <div className={styles.mainContent}>
          <header style={{ height: 72, background: 'rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
          <main className={styles.pageContainer}>
            <div style={{ padding: '2rem' }}>
              <Skeleton height={40} width={250} style={{ marginBottom: '2rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <Skeleton height={100} borderRadius="1rem" />
                <Skeleton height={100} borderRadius="1rem" />
                <Skeleton height={100} borderRadius="1rem" />
              </div>
              <Skeleton height={300} borderRadius="1.5rem" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sellerApp} data-theme={theme}>
      <div className={styles.sellerCanvas}></div>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div 
            key="login" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className={styles.loginWrapper}
          >
            <SellerLogin />
          </motion.div>
        ) : (
          <motion.div 
            key="content" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className={styles.layoutWrapper}
          >
            {/* Desktop sidebar — hidden on mobile via CSS */}
            <SellerSidebar />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
              {/* Added Top Navbar */}
              <SellerTopNavbar />

              {/* Main content */}
              <main className={styles.mainContent}>
                <Routes>
                  <Route index element={<SellerDashboard />} />
                  <Route path="sign/:id" element={<SignAgreement />} />
                  <Route path="list" element={<ListProperty />} />
                  <Route path="signed" element={<SigningHistory />} />
                  <Route path="signed/:id" element={<SubmissionDetail />} />
                  <Route path="help" element={<HelpCenter />} />
                  <Route path="*" element={<SellerDashboard />} />
                </Routes>
              </main>

              {/* Mobile bottom nav — shown only on mobile via CSS */}
              <SellerMobileBottomNav />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
