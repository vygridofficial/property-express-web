import { db } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

const REVIEWS_COLLECTION = 'reviews';

export const getAllReviews = async () => {
  const snapshot = await getDocs(collection(db, REVIEWS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addReview = async (review) => {
  const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
    ...review,
    createdAt: serverTimestamp(),
    status: review.status || 'Pending',
  });
  return { id: docRef.id };
};

export const updateReview = async (id, updates) => {
  const reviewRef = doc(db, REVIEWS_COLLECTION, id);
  await updateDoc(reviewRef, updates);
};

export const deleteReview = async (id) => {
  const reviewRef = doc(db, REVIEWS_COLLECTION, id);
  await deleteDoc(reviewRef);
};

export const getReviewById = async (id) => {
  const reviewRef = doc(db, REVIEWS_COLLECTION, id);
  const reviewSnap = await getDoc(reviewRef);
  if (reviewSnap.exists()) {
    return { id: reviewSnap.id, ...reviewSnap.data() };
  }
  return null;
};
