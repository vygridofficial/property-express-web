import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const submitLead = async (formData) => {
  try {
    const docRef = await addDoc(collection(db, 'leads'), {
      ...formData,
      status: 'new',
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Lead submission failed:', error);
    throw error;
  }
};
