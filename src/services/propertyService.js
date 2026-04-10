import { db } from '../firebase';
import { collection, getDocs, getDoc, query, where, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

const PROPERTIES_COLLECTION = 'properties';

export const getFeaturedProperties = async (includeInactive = false) => {
  let q = query(collection(db, PROPERTIES_COLLECTION), where("isFeatured", "==", true));
  if (!includeInactive) {
    q = query(q, where("status", "==", "Active"));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getSiteSettings = async () => {
  const docSnap = await getDoc(doc(db, 'settings', 'global'));
  if (docSnap.exists()) return docSnap.data();
  return null;
};

export const getAllProperties = async (filters = {}, includeInactive = false) => {
  const snapshot = await getDocs(collection(db, PROPERTIES_COLLECTION));
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (!includeInactive) {
    results = results.filter(p => p.status === "Active");
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
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

export const addProperty = async (propertyData) => {
  return await addDoc(collection(db, PROPERTIES_COLLECTION), propertyData);
};

export const updateProperty = async (id, data) => {
  const docRef = doc(db, PROPERTIES_COLLECTION, id);
  return await updateDoc(docRef, data);
};

export const deleteProperty = async (id) => {
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
  const synonyms = CATEGORY_SYNONYMS[normalizedCategory] || [normalizedCategory];
  
  // Use 'in' query to fetch all synonym matches in one go
  let q = query(
    collection(db, PROPERTIES_COLLECTION), 
    where("category", "in", synonyms)
  );

  if (!includeInactive) {
    q = query(q, where("status", "==", "Active"));
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
        const matchesStatus = includeInactive || p.status === "Active";
        return matchesCat && matchesStatus;
      });
  }

  return results;
};
