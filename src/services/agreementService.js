import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Create a new agreement with a secure token
 */
export const createAgreement = async (agreementData) => {
  const token = crypto.randomUUID();
  const docRef = await addDoc(collection(db, 'seller_agreements'), {
    ...agreementData,
    status: 'pending',
    secureToken: token,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
  });
  return { id: docRef.id, token };
};

/**
 * Fetch agreement by token (Seller Login)
 */
// Get agreements for a specific seller by email or phone
export const getAgreementsForSeller = async (email, phone) => {
  const agreementsRef = collection(db, 'agreements');
  const results = [];

  // Query by Email if provided
  if (email) {
    const qEmail = query(agreementsRef, where('sellerEmail', '==', email));
    const snapEmail = await getDocs(qEmail);
    snapEmail.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
  }

  // Query by Phone if provided (and not already found)
  if (phone) {
    const qPhone = query(agreementsRef, where('sellerPhone', '==', phone));
    const snapPhone = await getDocs(qPhone);
    snapPhone.forEach(doc => {
      if (!results.find(r => r.id === doc.id)) {
        results.push({ id: doc.id, ...doc.data() });
      }
    });
  }

  return results.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
};

export const getAgreementByToken = async (token) => {
  const q = query(collection(db, 'seller_agreements'), where('secureToken', '==', token));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

/**
 * Fetch all agreements for a seller phone (Dashboard)
 */
export const getSellerAgreementsByPhone = async (phone) => {
  const q = query(collection(db, 'seller_agreements'), where('sellerPhone', '==', phone));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Generate OTP for an agreement
 */
export const generateAgreementOTP = async (agreementId) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await updateDoc(doc(db, 'seller_agreements', agreementId), {
    activeOTP: otp,
    otpCreatedAt: serverTimestamp()
  });
  return otp;
};

/**
 * Finalize Agreement
 */
export const finalizeAgreement = async (agreementId, signatureData) => {
  await updateDoc(doc(db, 'seller_agreements', agreementId), {
    status: 'signed',
    signatureData, // Base64 or URL
    signedAt: serverTimestamp(),
    activeOTP: null // Clear OTP after success
  });
};
