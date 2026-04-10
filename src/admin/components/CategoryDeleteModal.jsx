import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, MoveRight } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import styles from '../styles/admin.module.css';

export default function CategoryDeleteModal() {
  const { deleteModalConfig, closeDeleteModal, deleteCustomCategory, customCategories, properties } = useAdmin();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!deleteModalConfig.isOpen) return null;

  const targetCategory = deleteModalConfig.category;
  // Count properties that belong to this category (case-insensitive)
  const propCount = properties.filter(p =>
    p.category?.toLowerCase() === targetCategory.toLowerCase()
  ).length;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      // deleteCustomCategory now always migrates properties to Uncategorized
      await deleteCustomCategory(targetCategory);
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }} onClick={closeDeleteModal} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className={styles.glassCard}
        style={{ position: 'relative', width: '100%', maxWidth: 420, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Outfit' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Delete Category</h3>
          <button onClick={closeDeleteModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Warning */}
        <div style={{ background: 'rgba(237,27,36,0.06)', border: '1px solid rgba(237,27,36,0.15)', borderRadius: 12, padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--admin-text-body)', lineHeight: 1.6, margin: 0 }}>
            You are deleting the <strong style={{ color: '#ed1b24' }}>{targetCategory}</strong> category.
            {propCount > 0 ? (
              <span>
                {' '}The <strong>{propCount}</strong> propert{propCount === 1 ? 'y' : 'ies'} in this category will
                automatically be moved to <strong>Uncategorized</strong>.
              </span>
            ) : (
              ' This category has no properties and will be removed cleanly.'
            )}
          </p>
        </div>

        {/* Info box */}
        <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '0.875rem 1rem', border: '1px solid var(--admin-stroke)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <MoveRight size={16} style={{ color: 'var(--admin-text-muted)', marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: 0, lineHeight: 1.5 }}>
            An <strong>Uncategorized</strong> tab will automatically appear in your admin sidebar to manage migrated properties. No data will be lost.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={closeDeleteModal}
            disabled={isDeleting}
            style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: '1px solid var(--admin-stroke)', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: 'var(--admin-text-main)', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{
              flex: 1, padding: '0.85rem', background: '#ed1b24', border: 'none', borderRadius: 10,
              fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer', color: 'white',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', opacity: isDeleting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            {isDeleting ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Deleting...
              </>
            ) : (
              <><Trash2 size={16} /> Delete</>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </div>
  );
}
