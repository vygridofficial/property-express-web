import { db } from '../firebase';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  query,
  orderBy
} from 'firebase/firestore';

const INQUIRIES_COLLECTION = 'leads';

export const getAllInquiries = async () => {
  const q = query(collection(db, INQUIRIES_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateInquiry = async (id, updates) => {
  const inquiryRef = doc(db, INQUIRIES_COLLECTION, id);
  await updateDoc(inquiryRef, updates);
};

export const deleteInquiry = async (id) => {
  const inquiryRef = doc(db, INQUIRIES_COLLECTION, id);
  await deleteDoc(inquiryRef);
};

export const getInquiryById = async (id) => {
  const inquiryRef = doc(db, INQUIRIES_COLLECTION, id);
  const inquirySnap = await getDoc(inquiryRef);
  if (inquirySnap.exists()) {
    return { id: inquirySnap.id, ...inquirySnap.data() };
  }
  return null;
};
