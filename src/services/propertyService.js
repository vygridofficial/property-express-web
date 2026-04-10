import { db } from '../firebase';
import { collection, getDocs, getDoc, query, where, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

const PROPERTIES_COLLECTION = 'properties';

export const getFeaturedProperties = async () => {
  const q = query(collection(db, PROPERTIES_COLLECTION), where("featured", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllProperties = async (filters = {}) => {
  const snapshot = await getDocs(collection(db, PROPERTIES_COLLECTION));
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

const CATEGORY_SYNONYMS = {
  Apartment: ['Apartment', 'Flat'],
  Flat: ['Flat', 'Apartment'],
  Villa: ['Villa'],
  Commercial: ['Commercial', 'Office'],
  Plot: ['Plot', 'Land']
};

export const getPropertiesByCategory = async (category) => {
  const normalizedCategory = category?.toString().trim() || '';
  const exactQuery = query(collection(db, PROPERTIES_COLLECTION), where("category", "==", normalizedCategory));
  const snapshot = await getDocs(exactQuery);
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (results.length > 0) {
    return results;
  }

  const allProperties = await getAllProperties();
  const synonyms = CATEGORY_SYNONYMS[normalizedCategory] || [normalizedCategory];
  const normalizedSynonyms = synonyms.map(s => s.toLowerCase());

  const filtered = allProperties.filter(p => {
    const categoryValue = (p.category || '').toString().trim().toLowerCase();
    return normalizedSynonyms.includes(categoryValue);
  });

  return filtered;
};
