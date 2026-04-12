import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs, query, where, setDoc } from 'firebase/firestore';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  // ─── Auth: true=logged in, false=logged out, null=loading ───
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('property_express_admin_auth') === 'true';
  });
  const [properties, setProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Issue 1: Auth Persistence ──
  // Using pure local storage since authentication uses custom env static hash 
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('property_express_admin_auth', 'true');
    } else {
      localStorage.removeItem('property_express_admin_auth');
    }
  }, [isAuthenticated]);

  // ── Real-time Properties Sync ──
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'properties'), (snapshot) => {
      const data = snapshot.docs.map(d => {
        const docData = d.data();
        let numericPrice = 0;
        if (docData.numericPrice !== undefined) {
          numericPrice = Number(docData.numericPrice);
        } else if (docData.price) {
          const pStr = docData.price.toString().replace(/[^0-9.]/g, '');
          const pNum = parseFloat(pStr);
          if (!isNaN(pNum)) {
            if (docData.price.toLowerCase().includes('cr')) numericPrice = pNum * 10000000;
            else if (docData.price.toLowerCase().includes('l')) numericPrice = pNum * 100000;
            else numericPrice = pNum;
          }
        }
        return { id: d.id, ...docData, numericPrice };
      });
      setProperties(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Issue 6: Reviews — Real-time sync so new reviews appear immediately ──
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const revs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(revs);
    });
    return () => unsubscribe();
  }, []);

  // ── Property CRUD ──
  const updatePropertyStatus = async (id, status) => {
    await updateDoc(doc(db, 'properties', id), { status });
  };

  const deletePropertyItem = async (id) => {
    await deleteDoc(doc(db, 'properties', id));
  };

  // ── Sections (visibility) state ──
  const [sections, setSections] = useState({});

  // ── Issue 9: Dark Mode — persisted in localStorage ──
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

  // ── Notifications ──
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'leads'), (snapshot) => {
      const newLeads = snapshot.docs
        .filter(d => d.data().status === 'new')
        .map(d => ({
          id: d.id,
          type: 'New Enquiry',
          message: `New enquiry from ${d.data().name || 'Someone'}`,
          time: 'Just now',
          read: false,
          link: '/admin/inquiries'
        }));
      setNotifications(newLeads);
    });
    return () => unsubscribe();
  }, []);

  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const deleteNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
  const clearAllNotifications = () => setNotifications([]);

  const login = () => {
    localStorage.setItem('property_express_admin_auth', 'true');
    setIsAuthenticated(true);
  };
  const logout = () => {
    localStorage.removeItem('property_express_admin_auth');
    setIsAuthenticated(false);
  };

  // ── Issues 2, 3, 4, 5: Global Site Settings ──
  // All settings stored in Firestore at settings/global
  const [siteSettings, setSiteSettings] = useState({
    siteName: '',
    tagline: '',
    metaDescription: '',
    metaKeywords: '',
    ogImage: '',
    twitterHandle: '',
    visibility: {},
    achievementsPropertiesSold: '1.2',
    achievementsClientSatisfaction: '4.9',
    achievementsVerifiedListings: '100',
    achievementsExpertConsultants: '50',
    primaryPhone: '',
    whatsappBusiness: '',
    supportEmail: '',
    officeAddress: '',
    googleMapsEmbed: '',
    instagramUrl: '',
    facebookUrl: '',
    customCategories: [],
    showReviews: true,
    showContactForm: true,
    taxonomy: {},
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSiteSettings(prev => ({ ...prev, ...data }));
        // Sync visibility sections for sidebar
        if (data.visibility) {
          setSections(prev => ({ ...prev, ...data.visibility }));
        }
        // Sync custom categories
        if (Array.isArray(data.customCategories)) {
          setCustomCategories(data.customCategories);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // updateCategoryTaxonomy merges new filters for a specific category
  const updateCategoryTaxonomy = async (categoryName, subFilters) => {
    const ref = doc(db, 'settings', 'global');
    const newTaxonomy = { ...(siteSettings.taxonomy || {}), [categoryName]: { subFilters } };
    await setDoc(ref, { taxonomy: newTaxonomy }, { merge: true });
  };

  // updateSiteSettings merges new fields, does NOT overwrite the whole doc.
  const updateSiteSettings = async (newSettings) => {
    const ref = doc(db, 'settings', 'global');
    // Use setDoc with merge:true so that if doc doesn't exist it gets created
    await setDoc(ref, newSettings, { merge: true });
  };

  // ── Issues 10, 11: Custom Categories — stored as objects {name, image, filters} ──
  const [customCategories, setCustomCategories] = useState([]);
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, category: '' });

  const requestDeleteCustomCategory = (name) => {
    setDeleteModalConfig({ isOpen: true, category: name });
  };

  const closeDeleteModal = () => {
    setDeleteModalConfig({ isOpen: false, category: '' });
  };

  const addCustomCategory = async (name, filters = [], customImageUrl) => {
    const trimmed = name?.trim();
    if (!trimmed || !customImageUrl) return; // customImageUrl is now required

    const base = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Uncategorized'];
    const alreadyExists = base.includes(trimmed) || customCategories.some(c => c.name === trimmed);
    if (alreadyExists) return;

    const newCat = { name: trimmed, image: customImageUrl, filters };
    const updatedCats = [...customCategories, newCat];

    // Enable visibility by default
    const updatedVis = { ...(siteSettings.visibility || {}), [trimmed]: true };

    await updateSiteSettings({ customCategories: updatedCats, visibility: updatedVis });
  };

  // Issue 11: deleteCustomCategory — moves properties to Uncategorized
  const deleteCustomCategory = async (name) => {
    // 1. Move all properties of this category to Uncategorized
    const q = query(collection(db, 'properties'), where('category', '==', name));
    const snap = await getDocs(q);
    const migrationPromises = snap.docs.map(d =>
      updateDoc(doc(db, 'properties', d.id), { category: 'Uncategorized' })
    );
    await Promise.all(migrationPromises);

    // 2. Remove from customCategories list
    const updatedCats = customCategories.filter(c => c.name !== name);

    // 3. Remove from visibility map
    const updatedVis = { ...(siteSettings.visibility || {}) };
    delete updatedVis[name];

    await updateSiteSettings({ customCategories: updatedCats, visibility: updatedVis });
  };

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated, login, logout,
        sections, setSections,
        notifications, setNotifications, markAllAsRead, deleteNotification, clearAllNotifications,
        isDark, toggleTheme,
        properties, setProperties, loading, updatePropertyStatus, deletePropertyItem,
        reviews,
        siteSettings, updateSiteSettings,
        customCategories, addCustomCategory, deleteCustomCategory,
        deleteModalConfig, requestDeleteCustomCategory, closeDeleteModal,
        updateCategoryTaxonomy,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
