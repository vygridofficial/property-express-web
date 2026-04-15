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

export default function SellerLayout() {
  const { isAuthenticated, loading, theme } = useSeller();

  if (loading) {
    return (
      <div className={styles.loaderWrapper} data-theme={theme}>
        <div className={styles.spinner}></div>
        <p>Initializing Secure Portal...</p>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
