import React from 'react';
import { Routes, Route, useLocation, useNavigationType, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import WhatsAppBubble from './components/common/WhatsAppBubble';
import AdminLayout from './admin/layouts/AdminLayout';
import { AdminProvider } from './admin/context/AdminContext';

import Home from './pages/Home';
import PropertiesPage from './pages/PropertiesPage';
import PropertyTypesPage from './pages/PropertyTypesPage';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Search from './pages/Search';
import About from './pages/About';
import Contact from './pages/Contact';
import Maintenance from './pages/Maintenance';
import { useAdmin } from './admin/context/AdminContext';

import Dashboard from './admin/pages/Dashboard';
import AdminProperties from './admin/pages/AdminProperties';
import Inquiries from './admin/pages/Inquiries';
import Reviews from './admin/pages/Reviews';
import Settings from './admin/pages/Settings';
import ContactSocial from './admin/pages/ContactSocial';

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <WhatsAppBubble />
      <Footer />
    </>
  );
}



function AppContent() {
  const location = useLocation();
  const navType = useNavigationType();
  const { siteSettings, settingsLoading } = useAdmin();

  const isMaintenanceMode = siteSettings?.maintenanceMode;
  const isAdminPath = location.pathname.startsWith('/admin');

  // If settings are still loading from Firestore, do not render public routes yet
  // to prevent flickering of the home page if maintenance mode is enabled.


  // 1. Disable native scroll restoration to stop jumps during animations
  React.useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // 2. Track scroll position for the current route
  React.useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll_${location.key}`, window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.key]);

  // 3. Global scroll restoration
  React.useEffect(() => {
    // Skip global restoration for Properties page (handled internally)
    if (location.pathname.startsWith('/properties')) return;

    if (navType !== 'POP') {
      window.scrollTo(0, 0);
    } else {
      const savedScroll = sessionStorage.getItem(`scroll_${location.key}`);
      if (savedScroll) {
        const timer = setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, location.key, navType]);
  
  if (settingsLoading && !isAdminPath) {
    return null; // Or a minimal branded loader if preferred
  }

  if (isMaintenanceMode && !isAdminPath) {
    return <Maintenance message={siteSettings.maintenanceMessage} />;
  }

  return (
    <>
      <AnimatePresence>
        <Routes location={location} key={location.pathname.startsWith('/admin') ? 'admin' : location.pathname}>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            {/* New category-first properties navigation */}
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/category/:category" element={<PropertyTypesPage />} />
            {/* Legacy: query-param based listings still work */}
            <Route path="/properties/listings" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="properties/:category" element={<AdminProperties />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="settings" element={<Settings />} />
            <Route path="contact-social" element={<ContactSocial />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}
