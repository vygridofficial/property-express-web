import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time Firestore Sync
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'properties'), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        let numericPrice = 0;
        
        // Ensure numericPrice is available for filtering even if doc only has string price
        if (docData.numericPrice !== undefined) {
          numericPrice = Number(docData.numericPrice);
        } else if (docData.price) {
          // Fallback parsing if numericPrice is missing
          const pStr = docData.price.toString().replace(/[^0-9.]/g, '');
          numericPrice = parseFloat(pStr) * (docData.price.includes('Cr') ? 10000000 : (docData.price.includes('L') ? 100000 : 1));
        }

        return { 
          id: doc.id, 
          ...docData,
          numericPrice: numericPrice 
        };
      });
      setProperties(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updatePropertyStatus = async (id, status) => {
    await updateDoc(doc(db, 'properties', id), { status });
  };

  const deletePropertyItem = async (id) => {
    await deleteDoc(doc(db, 'properties', id));
  };
  
  // Section Visibility Logic
  const [sections, setSections] = useState({
    showFlats: true,
    showPlots: true,
    showWarehouses: true,
    showVillas: true,
    showReviews: true,
    showContactForm: true,
  });

  // Dark mode — persisted in localStorage
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('adminTheme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('adminTheme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
      localStorage.setItem('adminTheme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'leads'), (snapshot) => {
      const newLeads = snapshot.docs
        .filter(doc => doc.data().status === 'new')
        .map(doc => ({
          id: doc.id,
          type: 'New Enquiry',
          message: `New enquiry from ${doc.data().name || 'Someone'}`,
          time: 'Just now',
          read: false,
          link: '/admin/inquiries'
        }));
      setNotifications(newLeads);
    });
    return () => unsubscribe();
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => setNotifications([]);


  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  // Global Site Settings (Site Name, Tagline, Visibility)
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'Property Express',
    tagline: 'Premium Real Estate Properties',
    metaDescription: 'Discover the most premium luxury villas, apartments, and plots available.',
    showFlats: true,
    showPlots: true,
    showWarehouses: true,
    showVillas: true,
    showReviews: true,
    showContactForm: true,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings(prev => ({ ...prev, ...docSnap.data() }));
        // Sync visibility sections for backward compatibility in components
        setSections(prev => ({ ...prev, ...docSnap.data() }));
      }
    });
    return () => unsubscribe();
  }, []);

  const updateSiteSettings = async (newSettings) => {
    await updateDoc(doc(db, 'settings', 'global'), newSettings);
  };

  const [customCategories, setCustomCategories] = useState([]);
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, category: '' });

  const requestDeleteCustomCategory = (name) => {
    setDeleteModalConfig({ isOpen: true, category: name });
  };

  const closeDeleteModal = () => {
    setDeleteModalConfig({ isOpen: false, category: '' });
  };

  const addCustomCategory = (name) => {
    if (name && !customCategories.includes(name.trim()) && !['Flat', 'Villa', 'Plot', 'Warehouse'].includes(name.trim())) {
      setCustomCategories(prev => [...prev, name.trim()]);
    }
  };

  const deleteCustomCategory = (name, action = 'delete', destCategory = '') => {
    setCustomCategories(prev => prev.filter(c => c !== name));
    if (action === 'delete') {
      // Logic for deleting properties of this category would go here
    }
  };

  return (
    <AdminContext.Provider 
      value={{
        isAuthenticated, login, logout,
        sections, setSections,
        notifications, setNotifications, markAllAsRead, deleteNotification, clearAllNotifications,
        isDark, toggleTheme,
        properties, setProperties, loading, updatePropertyStatus, deletePropertyItem,
        siteSettings, updateSiteSettings,
        customCategories, addCustomCategory, deleteCustomCategory,
        deleteModalConfig, requestDeleteCustomCategory, closeDeleteModal
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
