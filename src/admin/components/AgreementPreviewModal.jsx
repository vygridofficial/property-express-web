import React, { useEffect, useRef } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A ultra-premium, cinematic preview modal for the Agreement.
 * Uses the same HTML merging logic as the PDF generator for 1:1 consistency.
 */
const AgreementPreviewModal = ({ isOpen, onClose, htmlContent, title, onDownload, isDownloading }) => {
  const containerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '900px', height: '90vh',
            background: 'var(--admin-glass-bg)',
            border: '1px solid var(--admin-glass-border)',
            borderRadius: '24px', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.25rem 2rem', borderBottom: '1px solid var(--admin-glass-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                Agreement Preview
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                {title || 'Generated Draft'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onDownload}
                disabled={isDownloading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 1.2rem', borderRadius: '10px',
                  background: '#ed1b24', color: 'white', border: 'none',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(237,27,36,0.2)'
                }}
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Download PDF
              </button>
              <button
                onClick={onClose}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--admin-glass-bg)', border: '1px solid var(--admin-glass-border)',
                  color: 'var(--admin-text-muted)', cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content Area (The "Paper") */}
          <div style={{ 
            flex: 1, overflowY: 'auto', padding: '3rem', 
            background: '#f1f5f9', display: 'flex', justifyContent: 'center' 
          }}>
            <div 
              className="agreement-paper"
              style={{
                width: '100%', maxWidth: '800px', background: 'white',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)', borderRadius: '4px',
                minHeight: '100%', padding: '0px'
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AgreementPreviewModal;
