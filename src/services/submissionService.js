import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp, 
  orderBy
} from 'firebase/firestore';
import { uploadToCloudinary, uploadPropertyImages } from '../utils/cloudinary';

/**
 * Upload multiple property images to Cloudinary (Alias for consistency)
 */
export const uploadSubmissionImages = async (files) => {
  return await uploadPropertyImages(files);
};

/**
 * Create a new property submission (Seller Flow)
 */
export const createPropertySubmission = async (submissionData, imageFiles, sellerSignatureStr) => {
  // 1. Upload Images to Cloudinary
  let imageUrls = [];
  if (imageFiles && imageFiles.length > 0) {
    imageUrls = await uploadSubmissionImages(imageFiles);
  }

  // 2. Add to Firestore Submissions Collection
  const submissionRef = await addDoc(collection(db, 'property_submissions'), {
    ...submissionData,
    images: imageUrls,
    sellerSignature: sellerSignatureStr, // Base64 string
    status: 'pending', // pending, approved, rejected
    createdAt: serverTimestamp(),
  });

  return submissionRef.id;
};

/**
 * Fetch all pending submissions (Admin Portal)
 */
export const getPendingSubmissions = async () => {
  const q = query(
    collection(db, 'property_submissions'), 
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  results.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
  return results;
};

/**
 * Reject a submission (Admin Portal)
 */
export const rejectSubmission = async (submissionId, reason) => {
  await updateDoc(doc(db, 'property_submissions', submissionId), {
    status: 'rejected',
    rejectionReason: reason,
    updatedAt: serverTimestamp()
  });
};

/**
 * Approve a submission (Admin Portal)
 */
export const approveSubmission = async (submissionId, adminSignature) => {
  const submissionRef = doc(db, 'property_submissions', submissionId);
  const submissionSnap = await getDoc(submissionRef);
  
  if (!submissionSnap.exists()) {
    throw new Error("Submission not found");
  }

  const submissionData = submissionSnap.data();

  // 1. Mark submission as approved
  await updateDoc(submissionRef, {
    status: 'approved',
    adminSignature,
    updatedAt: serverTimestamp()
  });

  // 3. Move data to Public `properties` collection so it becomes visible on the website
  const propertyRef = await addDoc(collection(db, 'properties'), {
    title: submissionData.propertyTitle || 'Property Listing',
    category: submissionData.propertyType || '',
    price: submissionData.price || 0,
    numericPrice: Number(submissionData.price),
    location: submissionData.location || '',
    district: submissionData.district || '',
    address: submissionData.address || '',
    description: submissionData.description || '',
    area: submissionData.area || '',
    bedrooms: submissionData.bedrooms || '',
    bathrooms: submissionData.bathrooms || '',
    images: submissionData.images || [],
    features: submissionData.features || [],
    sellerName: submissionData.sellerName,
    sellerEmail: submissionData.sellerEmail,
    sellerPhone: submissionData.sellerPhone,
    status: 'live',
    isFeatured: false, // Default not featured
    createdAt: serverTimestamp()
  });

  return propertyRef.id;
};

/**
 * Get Submissions specifically by Seller Auth Email
 */
export const getMySubmissions = async (email) => {
  if (!email) return [];
  const q = query(
    collection(db, 'property_submissions'),
    where('sellerEmail', '==', email)
  );
  const snap = await getDocs(q);
  let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  results.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  return results;
};

/**
 * Get ALL submissions — for the Admin "Sellers History" tab
 */
export const getAllSubmissions = async () => {
  const snap = await getDocs(collection(db, 'property_submissions'));
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  return results;
};

/**
 * Permanently delete a submission from Firestore
 */
export const deleteSubmission = async (submissionId) => {
  await deleteDoc(doc(db, 'property_submissions', submissionId));
};


