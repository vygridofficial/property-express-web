import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs, query, where, setDoc, deleteField, writeBatch } from 'firebase/firestore';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  // ─── Auth: true=logged in, false=logged out, null=loading ───
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [properties, setProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [propertyTypes, setPropertyTypes] = useState([]);

  // ── Auth Persistence via Firebase ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Only allow the admin email to be authenticated here 
      // (or we can just check if any user is logged in, but better to enforce an admin email or admin claim)
      if (user && user.email === 'admin@propertyexpress.com') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

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

  // ── Property Types Collection Sync & Seeding ──
  useEffect(() => {
    const DEFAULT_CATEGORY_MAP = {
      Apartment: 'residential',
      Villa: 'residential',
      Plot: 'residential',
      Commercial: 'commercial',
      Uncategorized: 'residential',
    };

    const unsubscribe = onSnapshot(collection(db, 'propertyTypes'), async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial property types...');
        const initialTypes = [
          { name: 'Apartment', category: 'residential' },
          { name: 'Villa',     category: 'residential' },
          { name: 'Plot',      category: 'residential' },
          { name: 'Commercial', category: 'commercial' },
          { name: 'Uncategorized', category: 'residential' },
        ];
        try {
          const promises = initialTypes.map((t, index) =>
            setDoc(doc(db, 'propertyTypes', t.name), {
              name: t.name, category: t.category, isDefault: true,
              isActive: true, createdAt: new Date(), order: index,
              slug: t.name.toLowerCase(), subTypes: [], icon: 'Building2'
            })
          );
          await Promise.all(promises);
        } catch (error) {
          console.error('Failed to seed property types', error);
        }
        return;
      }

      // One-time migration: patch docs that are missing the category field
      const needsMigration = snapshot.docs.filter(d => !d.data().category);
      if (needsMigration.length > 0) {
        const batch = writeBatch(db);
        needsMigration.forEach(d => {
          const fallback = DEFAULT_CATEGORY_MAP[d.data().name] || 'residential';
          batch.update(doc(db, 'propertyTypes', d.id), { category: fallback, isActive: true, slug: d.id.toLowerCase(), subTypes: [], icon: 'Building2' });
        });
        await batch.commit();
        console.log(`Migrated ${needsMigration.length} property type(s) with missing category.`);
        return; // snapshot will re-fire after batch
      }

      const types = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      types.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPropertyTypes(types);
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
  const [rawLeads, setRawLeads] = useState([]);
  const [clearedNotifs, setClearedNotifs] = useState(() => JSON.parse(localStorage.getItem('adminClearedNotifs') || '[]'));
  const [readNotifs, setReadNotifs] = useState(() => JSON.parse(localStorage.getItem('adminReadNotifs') || '[]'));

  useEffect(() => {
    localStorage.setItem('adminClearedNotifs', JSON.stringify(clearedNotifs));
  }, [clearedNotifs]);

  useEffect(() => {
    localStorage.setItem('adminReadNotifs', JSON.stringify(readNotifs));
  }, [readNotifs]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'leads'), (snapshot) => {
      setRawLeads(snapshot.docs.filter(d => d.data().status === 'new'));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const derived = rawLeads
      .filter(d => !clearedNotifs.includes(d.id))
      .map(d => ({
        id: d.id,
        type: 'New Enquiry',
        message: `New enquiry from ${d.data().name || 'Someone'}`,
        time: d.data().createdAt?.toDate 
          ? d.data().createdAt.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
          : (d.data().createdAt ? new Date(d.data().createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'),
        read: readNotifs.includes(d.id),
        link: '/admin/inquiries'
      }));
    setNotifications(derived);
  }, [rawLeads, clearedNotifs, readNotifs]);

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    setReadNotifs(prev => [...new Set([...prev, ...unreadIds])]);
  };

  const deleteNotification = (id) => {
    setClearedNotifs(prev => [...new Set([...prev, id])]);
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    setClearedNotifs(prev => [...new Set([...prev, ...allIds])]);
  };

  const login = () => {
    // Firebase auth handles login via signInWithEmailAndPassword in Login.jsx
    setIsAuthenticated(true);
  };
  const logout = () => {
    auth.signOut().then(() => {
      setIsAuthenticated(false);
    });
  };

  // ── Issues 2, 3, 4, 5: Global Site Settings ──
  // All settings stored in Firestore at settings/global
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'Property Express',
    tagline: 'Premium Real Estate Properties',
    visibility: {},
    maintenanceMode: false,
    maintenanceMessage: "We'll be back soon. Our site is currently undergoing scheduled maintenance.",
    heroTitle: 'Find Your Perfect Property',
    heroDescription: 'Discover the most premium luxury villas, apartments, and plots available.',
    achievementsPropertiesSold: '1.2',
    achievementsClientSatisfaction: '4.9',
    achievementsVerifiedListings: '100',
    achievementsExpertConsultants: '50',
    primaryPhone: '',
    primaryPhoneCode: '+91',
    whatsappBusiness: '',
    whatsappCode: '+91',
    supportEmail: '',
    officeAddress: '',
    googleMapsEmbed: '',
    instagramUrl: '',
    facebookUrl: '',
    customCategories: [],
    showReviews: true,
    showContactForm: true,
    taxonomy: {},
    heroImage: '',
    amenities: [
      'Swimming Pool', '24/7 Security', 'Private Garage', 
      'Central AC / Heating', 'Smart Home System', 'Outdoor BBQ Area',
      'City Water Supply', 'High-Speed Internet', 'Gym', 'Elevator',
      'CCTV', 'Power Backup'
    ],
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
        if (data.customCategories) {
          setCustomCategories(data.customCategories);
        }
        // If settings doc exists but has no amenities array, add it
        if (!data.amenities) {
          updateDoc(doc(db, 'settings', 'global'), {
            amenities: [
              'Swimming Pool', '24/7 Security', 'Private Garage', 
              'Central AC / Heating', 'Smart Home System', 'Outdoor BBQ Area',
              'City Water Supply', 'High-Speed Internet', 'Gym', 'Elevator',
              'CCTV', 'Power Backup'
            ]
          });
        }
        setSettingsLoading(false);
      } else {
        setSettingsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // One-time cleanup for removed fields
  useEffect(() => {
    const cleanupUnusedFields = async () => {
      const ref = doc(db, 'settings', 'global');
      await updateDoc(ref, {
        metaDescription: deleteField(),
        metaKeywords: deleteField(),
        ogImage: deleteField(),
        twitterHandle: deleteField(),
        vercelUrl: deleteField(),
      }).catch(err => console.log('Cleanup already done or not needed:', err));
    };
    cleanupUnusedFields();
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

  // Property Type specific methods (new approach)
  const addPropertyType = async (name, customImageUrl = null, filters = [], extendedData = {}) => {
    const trimmed = name?.trim();
    if (!trimmed) return;
    const slug = extendedData.slug || trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check if ID or name exists
    const exists = propertyTypes.some(pt => pt.id.toLowerCase() === slug || pt.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;

    await setDoc(doc(db, 'propertyTypes', slug), { 
      name: trimmed, 
      slug,
      isDefault: false, 
      image: customImageUrl, 
      filters, 
      category: extendedData.category || 'residential',
      subTypes: extendedData.subTypes || [],
      icon: extendedData.icon || 'Building2',
      isActive: extendedData.isActive !== false,
      order: propertyTypes.length,
      createdAt: new Date() 
    });
    
    // Auto-enable visibility for back-compatibility
    if (extendedData.isActive !== false) {
      const updatedVis = { ...(siteSettings.visibility || {}), [trimmed]: true };
      await updateSiteSettings({ visibility: updatedVis });
    }
  };

  const updatePropertyType = async (id, data) => {
    const targetType = propertyTypes.find(p => p.id === id);

    // If name changed, batch-migrate all properties using old name to new name
    if (targetType && data.name && data.name !== targetType.name) {
      const oldName = targetType.name;
      const newName = data.name;
      const q = query(collection(db, 'properties'), where('category', '==', oldName));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.update(doc(db, 'properties', d.id), { category: newName }));
        await batch.commit();
      }
      // Also migrate siteSettings visibility key
      if (siteSettings.visibility && siteSettings.visibility.hasOwnProperty(oldName)) {
        const updatedVis = { ...(siteSettings.visibility) };
        updatedVis[newName] = updatedVis[oldName];
        delete updatedVis[oldName];
        await updateSiteSettings({ visibility: updatedVis });
      }
    }

    // If isActive changed, sync visibility
    if (data.hasOwnProperty('isActive') && targetType) {
      const nameKey = data.name || targetType.name;
      const updatedVis = { ...(siteSettings.visibility || {}) };
      updatedVis[nameKey] = data.isActive;
      await updateSiteSettings({ visibility: updatedVis });
    }

    await updateDoc(doc(db, 'propertyTypes', id), data);
  };

  
  const removePropertyType = async (id) => {
    await deleteDoc(doc(db, 'propertyTypes', id));
  };

  const reorderPropertyTypes = async (currentIndex, direction) => {
    if (direction === 'up' && currentIndex > 0) {
      const currentId = propertyTypes[currentIndex].id;
      const prevId = propertyTypes[currentIndex - 1].id;
      
      const batch = writeBatch(db);
      batch.update(doc(db, 'propertyTypes', currentId), { order: currentIndex - 1 });
      batch.update(doc(db, 'propertyTypes', prevId), { order: currentIndex });
      await batch.commit();
    } else if (direction === 'down' && currentIndex < propertyTypes.length - 1) {
      const currentId = propertyTypes[currentIndex].id;
      const nextId = propertyTypes[currentIndex + 1].id;
      
      const batch = writeBatch(db);
      batch.update(doc(db, 'propertyTypes', currentId), { order: currentIndex + 1 });
      batch.update(doc(db, 'propertyTypes', nextId), { order: currentIndex });
      await batch.commit();
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
        reviews,
        siteSettings, updateSiteSettings, settingsLoading,
        customCategories, addCustomCategory, deleteCustomCategory,
        propertyTypes, addPropertyType, updatePropertyType, removePropertyType, reorderPropertyTypes,
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
