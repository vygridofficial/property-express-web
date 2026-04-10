import React from 'react';
import { Routes, Route, useLocation, useNavigationType, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import WhatsAppBubble from './components/common/WhatsAppBubble';
import AdminLayout from './admin/layouts/AdminLayout';
import { AdminProvider } from './admin/context/AdminContext';

import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import About from './pages/About';
import Contact from './pages/Contact';

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

import { useAdmin } from './admin/context/AdminContext';

function SEOManager() {
  const { siteSettings } = useAdmin();
  
  React.useEffect(() => {
    if (siteSettings) {
      document.title = `${siteSettings.siteName || 'Property Express'} | ${siteSettings.tagline || 'Premium Real Estate'}`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', siteSettings.metaDescription || '');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = siteSettings.metaDescription || '';
        document.head.appendChild(meta);
      }
    }
  }, [siteSettings]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const navType = useNavigationType();

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
    if (navType !== 'POP') {
      // New page: instant scroll to top
      window.scrollTo(0, 0);
    } else {
      // Re-entering page from 'back': wait for exit animation then restore
      const savedScroll = sessionStorage.getItem(`scroll_${location.key}`);
      if (savedScroll) {
        const timer = setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, location.key, navType]);

  return (
    <>
      <SEOManager />
      <AnimatePresence>
        <Routes location={location} key={location.pathname.startsWith('/admin') ? 'admin' : location.pathname}>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
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
