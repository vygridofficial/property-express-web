import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [properties, setProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth Persistence Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);
  
  // Real-time Properties Sync
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'properties'), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        let numericPrice = 0;
        
        if (docData.numericPrice !== undefined) {
          numericPrice = Number(docData.numericPrice);
        } else if (docData.price) {
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

  // Real-time Reviews Sync (Fixes Point 6)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(revs);
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
  const [sections, setSections] = useState({});

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
  const logout = () => {
    auth.signOut();
    setIsAuthenticated(false);
  };

  // Global Site Settings
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'Property Express',
    tagline: 'Premium Real Estate Properties',
    metaDescription: 'Discover the most premium luxury villas, apartments, and plots available.',
    visibility: {}, // Dynamic visibility map
    achievementsPropertiesSold: '1.2',
    achievementsClientSatisfaction: '4.9',
    achievementsVerifiedListings: '100',
    achievementsExpertConsultants: '50',
    // Contact Info
    primaryPhone: '+1 (555) 123-4567',
    whatsappBusiness: '+1 (555) 123-4567',
    supportEmail: 'hello@propertyexpress.com',
    officeAddress: '123 Business Avenue, Suite 100, New York, NY 10001',
    googleMapsEmbed: '',
    instagramUrl: 'https://instagram.com/propertyexpress',
    facebookUrl: 'https://facebook.com/propertyexpress'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSiteSettings(prev => ({ ...prev, ...data }));
        // Backward compatibility for sections
        setSections(prev => ({ ...prev, ...data.visibility }));
        if (data.customCategories) {
          setCustomCategories(data.customCategories);
        }
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

  const addCustomCategory = async (name) => {
    const trimmed = name?.trim();
    if (trimmed && !customCategories.includes(trimmed) && !['Apartment', 'Villa', 'Plot', 'Commercial'].includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      await updateSiteSettings({ customCategories: updated });
    }
  };

  const deleteCustomCategory = async (name, action = 'delete', destCategory = '') => {
    const updated = customCategories.filter(c => c !== name);
    await updateSiteSettings({ customCategories: updated });
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
        reviews, siteSettings, updateSiteSettings,
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
