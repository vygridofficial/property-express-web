import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EnquirySuccessPopup = ({ isOpen, onClose, message = "Your enquiry has been submitted successfully!", subMessage = "Our team will get back to you shortly." }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.96 }}
          transition={{ duration: 0.3 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.75)',
            borderRadius: 24,
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
            width: '100%',
            maxWidth: 420,
            padding: '2.5rem',
            fontFamily: 'Outfit, sans-serif',
            position: 'relative',
            textAlign: 'center'
          }}
        >
          {/* Close Button (top right) */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', color: '#444'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ed1b24'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = '#444'; }}
          >
            <X size={18} />
          </button>

          {/* Success Icon */}
          <div style={{ 
            width: 64, height: 64, borderRadius: '50%', 
            background: '#18181a', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 1.5rem' 
          }}>
            <CheckCircle size={32} color="white" />
          </div>

          <h3 style={{ 
            fontSize: '1.5rem', fontWeight: 800, 
            letterSpacing: '-0.04em', marginBottom: '0.5rem',
            color: '#18181a'
          }}>
            {message}
          </h3>
          <p style={{ 
            color: '#555', fontWeight: 300, 
            lineHeight: 1.6, marginBottom: '2rem' 
          }}>
            {subMessage}
          </p>

          {/* Action Buttons */}
          <button
            onClick={() => {
              onClose();
              navigate('/');
            }}
            style={{
              width: '100%', padding: '1rem', 
              background: '#18181a', color: 'white', 
              border: 'none', borderRadius: 14, 
              fontWeight: 700, fontFamily: 'Outfit', 
              fontSize: '1rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: '0.75rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.18)', 
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.24)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.18)'; }}
          >
            <Home size={18} /> Go to Home
          </button>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default EnquirySuccessPopup;
