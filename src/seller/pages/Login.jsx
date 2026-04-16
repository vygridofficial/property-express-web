import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import logo from '../../assets/logo.png';
import styles from '../styles/seller.module.css';
import Skeleton from 'react-loading-skeleton';

export default function SellerLogin() {
  const { loginWithGoogle, authError } = useSeller();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const safeGoogleLogin = async () => {
    setIsSubmitting(true);
    setLocalError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLocalError("Sign-in popup was closed before finishing. Please try again.");
      } else {
        setLocalError(err.message || 'An error occurred during sign-in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--canvas-bg, linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%))',
      padding: '2rem',
      transition: 'background 0.4s ease'
    }}>
      {isSubmitting ? (
        <Skeleton height={40} width={200} />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: 'calc(2rem + 2vw)',
            borderRadius: '32px',
            boxShadow: 'none',
            maxWidth: '430px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.5))',
            color: 'var(--text-main)'
          }}
        >
          <img src={logo} alt="Property Express" style={{ height: '42px', marginBottom: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem', fontFamily: 'Outfit, sans-serif' }}>Seller Portal Access</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '0.95rem' }}>Securely log in to review, manage, and sign your property agreements.</p>

          <button 
            type="button"
            onClick={safeGoogleLogin}
            disabled={isSubmitting}
            style={{ 
              width: '100%', padding: '1.1rem', borderRadius: '16px', 
              background: 'var(--glass-solid, white)', 
              border: '1px solid var(--glass-border, #e2e8f0)', 
              color: 'var(--text-main)', fontWeight: 700, fontSize: '1.05rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer',
              transition: 'all 0.2s', opacity: isSubmitting ? 0.7 : 1,
              fontFamily: 'Outfit, sans-serif',
              boxShadow: 'none'
            }}
            onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.borderColor = '#ed1b24')}
            onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.borderColor = 'var(--glass-border)')}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
          <p style={{ margin: '1.5rem 0 0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Only authorized sellers can access this portal.</p>

          {(localError || authError) && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.875rem', marginTop: '1.5rem', background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
              {localError || authError}
            </motion.p>
          )}
        </motion.div>
      )}
    </div>
  );
}
