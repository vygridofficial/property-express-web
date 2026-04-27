import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { getAgreementsForSeller } from '../../services/agreementService';
import { getMySubmissions, deleteSubmission } from '../../services/submissionService';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const SellerContext = createContext();

export const useSeller = () => useContext(SellerContext);

export const SellerProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sellerTheme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('sellerTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Only auto-login if the user is signed in via Google
      const isGoogleUser = firebaseUser?.providerData.some(p => p.providerId === 'google.com');

      if (firebaseUser && isGoogleUser) {
        setUser(firebaseUser);
        try {
          // Fetch agreements based on Email OR Phone
          const fetchedAgreements = await getAgreementsForSeller(firebaseUser.email, firebaseUser.phoneNumber);
          setAgreements(fetchedAgreements);
          
          const fetchedSubmissions = await getMySubmissions(firebaseUser.email);
          setSubmissions(fetchedSubmissions);
        } catch (err) {
          console.error("Error fetching seller agreements:", err);
        }
      } else {
        // If it's the admin (password provider) or no user, clear the state
        setUser(null);
        setAgreements([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    agreements,
    submissions,
    loading,
    authError,
    isAuthenticated: !!user,
    theme,
    toggleTheme,
    siteSettings,
    loginWithGoogle,
    logout,
    refreshAgreements: async () => {
      if (user) {
        const fetchedAgreements = await getAgreementsForSeller(user.email, user.phoneNumber);
        setAgreements(fetchedAgreements);
        const fetchedSubmissions = await getMySubmissions(user.email);
        setSubmissions(fetchedSubmissions);
      }
    },
    deleteMySubmission: async (id) => {
      await deleteSubmission(id);
      setSubmissions(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <SellerContext.Provider value={value}>
      {children}
    </SellerContext.Provider>
  );
};
