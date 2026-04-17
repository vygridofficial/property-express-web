import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A ultra-premium, cinematic preview modal for the Agreement.
 * Displays the document in a smartphone frame with zoom controls.
 */
const AgreementPreviewModal = ({ isOpen, onClose, htmlContent, title, onDownload, isDownloading }) => {
  const [scale, setScale] = useState(0.8);
  const scrollRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Reset scale when opening
  useEffect(() => {
    if (isOpen) setScale(0.85);
  }, [isOpen]);

  if (!isOpen) return null;

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4));
  const resetZoom = () => setScale(0.85);

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '1000px', height: '94vh',
            background: 'var(--admin-glass-bg)',
            border: '1px solid var(--admin-glass-border)',
            borderRadius: '28px', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.25rem 2rem', borderBottom: '1px solid var(--admin-glass-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(255,255,255,0.03)', zIndex: 10
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                Document Preview
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                {title || 'Generated Draft'} • {Math.round(scale * 100)}%
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Zoom Controls */}
              <div style={{ 
                display: 'flex', background: 'rgba(0,0,0,0.2)', 
                borderRadius: '10px', padding: '0.25rem', gap: '0.25rem',
                marginRight: '1rem' 
              }}>
                <button onClick={zoomOut} style={zoomBtnStyle} title="Zoom Out"><ZoomOut size={16} /></button>
                <button onClick={resetZoom} style={zoomBtnStyle} title="Fit to Frame"><Maximize2 size={16} /></button>
                <button onClick={zoomIn} style={zoomBtnStyle} title="Zoom In"><ZoomIn size={16} /></button>
              </div>

              <button
                onClick={onDownload}
                disabled={isDownloading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.7rem 1.5rem', borderRadius: '12px',
                  background: '#ed1b24', color: 'white', border: 'none',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(237,27,36,0.25)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isDownloading ? 'Processing...' : 'Download PDF'}
              </button>
              
              <button
                onClick={onClose}
                style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-glass-border)',
                  color: 'var(--admin-text-muted)', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ed1b24'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-text-muted)'}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ 
            flex: 1, overflow: 'hidden', padding: '2rem', 
            background: 'var(--admin-bg, #f3f4f6)', display: 'flex', justifyContent: 'center',
            alignItems: 'flex-start', position: 'relative'
          }}>
            
            <div 
              ref={scrollRef}
              style={{ 
                width: '100%', maxWidth: '800px', height: '100%',
                background: 'white', borderRadius: '8px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                overflowY: 'auto', overflowX: 'auto',
                padding: '2rem 3rem'
              }}
            >
              <div 
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  width: '100%',
                  minHeight: '100%',
                  transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  background: 'white',
                  color: '#334155',
                  fontFamily: 'serif'
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const zoomBtnStyle = {
  width: '32px', height: '32px', border: 'none', background: 'transparent',
  color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', borderRadius: '6px', transition: 'background 0.2s',
  outline: 'none'
};

export default AgreementPreviewModal;
