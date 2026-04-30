import { db } from '../firebase';
import { collection, getDocs, getDoc, query, where, doc, updateDoc, deleteDoc, addDoc, getDocFromServer } from 'firebase/firestore';


const PROPERTIES_COLLECTION = 'properties';

// Simple session-level cache to enable instant back-navigation and reliable scroll restoration
const categoryCache = new Map();

export const getCachedProperties = (category) => {
  const normalized = category?.toString().trim() || '';
  return categoryCache.get(normalized) || null;
};

export const getFeaturedProperties = async (includeInactive = false) => {
  let q = query(collection(db, PROPERTIES_COLLECTION), where("isFeatured", "==", true));
  if (!includeInactive) {
    q = query(q, where("status", "in", ["Active", "live"]));
  }

  const [snapshot, typesSnapshot] = await Promise.all([
    getDocs(q),
    getDocs(collection(db, 'propertyTypes'))
  ]);

  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (!includeInactive) {
    const activeTypes = typesSnapshot.docs.map(d => d.data()).filter(t => t.isActive !== false).map(t => (t.name || '').toLowerCase());
    results = results.filter(p => !p.category || activeTypes.includes(p.category.toLowerCase()) || p.category.toLowerCase() === 'uncategorized');
  }

  return results;
};

export const getSiteSettings = async () => {
  const docSnap = await getDoc(doc(db, 'settings', 'global'));
  if (docSnap.exists()) return docSnap.data();
  return null;
};

export const getPropertyTypes = async () => {
  const snapshot = await getDocs(collection(db, 'propertyTypes'));
  const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return types.sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const getAllProperties = async (filters = {}, includeInactive = false) => {
  const [snapshot, typesSnapshot] = await Promise.all([
    getDocs(collection(db, PROPERTIES_COLLECTION)),
    getDocs(collection(db, 'propertyTypes'))
  ]);

  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (!includeInactive) {
    const activeTypes = typesSnapshot.docs.map(d => d.data()).filter(t => t.isActive !== false).map(t => (t.name || '').toLowerCase());
    results = results.filter(p => (p.status === "Active" || p.status === "live") && (!p.category || activeTypes.includes(p.category.toLowerCase()) || p.category.toLowerCase() === 'uncategorized'));
  }

  if (filters.location && filters.location !== "") {
    results = results.filter(p => p.location === filters.location);
  }
  if (filters.type && filters.type !== "") {
    results = results.filter(p => p.type === filters.type);
  }
  if (filters.priceMax && filters.priceMax !== "") {
    results = results.filter(p => p.price <= Number(filters.priceMax));
  }
  return results;
};

export const getPropertyById = async (id) => {
  const docRef = doc(db, PROPERTIES_COLLECTION, id);
  // Always fetch from server to bypass Firestore's local IndexedDB cache.
  // This ensures admin image/content updates are immediately visible.
  const docSnap = await getDocFromServer(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

export const addProperty = async (propertyData) => {
  categoryCache.clear();
  return await addDoc(collection(db, PROPERTIES_COLLECTION), propertyData);
};

export const updateProperty = async (id, data) => {
  categoryCache.clear();
  const docRef = doc(db, PROPERTIES_COLLECTION, id);
  return await updateDoc(docRef, data);
};

export const deleteProperty = async (id) => {
  categoryCache.clear();
  const docRef = doc(db, PROPERTIES_COLLECTION, id);
  return await deleteDoc(docRef);
};

export const migratePropertiesCategory = async (oldCat, newCat) => {
  const q = query(collection(db, PROPERTIES_COLLECTION), where("category", "==", oldCat));
  const snapshot = await getDocs(q);
  const batch = snapshot.docs.map(d => updateDoc(doc(db, PROPERTIES_COLLECTION, d.id), { category: newCat }));
  await Promise.all(batch);
};

const CATEGORY_SYNONYMS = {
  Apartment: ['Apartment', 'Flat'],
  Flat: ['Flat', 'Apartment'],
  Villa: ['Villa'],
  Commercial: ['Commercial', 'Office'],
  Plot: ['Plot', 'Land']
};

export const getPropertiesByCategory = async (category, includeInactive = false) => {
  const normalizedCategory = category?.toString().trim() || '';

  // Return from cache immediately if available (instant render for back-navigation)
  if (categoryCache.has(normalizedCategory) && !includeInactive) {
    return categoryCache.get(normalizedCategory);
  }

  const synonyms = CATEGORY_SYNONYMS[normalizedCategory] || [normalizedCategory];

  // Use 'in' query to fetch all synonym matches in one go
  let q = query(
    collection(db, PROPERTIES_COLLECTION),
    where("category", "in", synonyms)
  );

  if (!includeInactive) {
    q = query(q, where("status", "in", ["Active", "live"]));
  }

  const snapshot = await getDocs(q);
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Case-insensitive fallback check (rarely needed if data is normalized)
  if (results.length === 0) {
    const allSnapshot = await getDocs(collection(db, PROPERTIES_COLLECTION));
    const normalizedSyns = synonyms.map(s => s.toLowerCase());
    results = allSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => {
        const matchesCat = normalizedSyns.includes((p.category || '').toLowerCase());
        const matchesStatus = includeInactive || p.status === "Active" || p.status === "live";
        return matchesCat && matchesStatus;
      });
  }

  // Cross-check property type visibility
  if (!includeInactive) {
    const typesSnapshot = await getDocs(collection(db, 'propertyTypes'));
    const activeTypes = typesSnapshot.docs.map(d => d.data()).filter(t => t.isActive !== false).map(t => (t.name || '').toLowerCase());

    // Check if the requested category translates to an active type
    const requestedCats = synonyms.map(s => s.toLowerCase());
    const isCategoryActive = requestedCats.some(c => activeTypes.includes(c));

    if (!isCategoryActive) {
      results = [];
    }
  }

  // Cache the results for this session
  if (!includeInactive) {
    categoryCache.set(normalizedCategory, results);
  }

  return results;
};

export const backfillPropertiesAgentDetails = async (agentName, agentPhone) => {
  const snapshot = await getDocs(collection(db, PROPERTIES_COLLECTION));
  const updates = snapshot.docs.map(d =>
    updateDoc(doc(db, PROPERTIES_COLLECTION, d.id), {
      agentName,
      agentPhone
    })
  );
  await Promise.all(updates);
  return snapshot.docs.length;
};
export const searchProperties = (properties, query) => {
  if (!query) return properties;
  const q = query.toLowerCase().trim();
  return properties.filter(p => {
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.district || '').toLowerCase().includes(q)
    );
  });
};
