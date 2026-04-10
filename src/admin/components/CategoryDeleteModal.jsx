import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, MoveRight } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import styles from '../styles/admin.module.css';

export default function CategoryDeleteModal() {
  const { deleteModalConfig, closeDeleteModal, deleteCustomCategory, customCategories, properties } = useAdmin();
  const [action, setAction] = useState('delete'); // 'delete' or 'move'
  const [destCat, setDestCat] = useState('Flat');

  if (!deleteModalConfig.isOpen) return null;

  const targetCategory = deleteModalConfig.category;
  const propCount = properties.filter(p => p.category.toLowerCase() === targetCategory.toLowerCase()).length;
  
  const allDestinations = ['Flat', 'Villa', 'Warehouse', 'Plot', ...customCategories.filter(c => c.toLowerCase() !== targetCategory.toLowerCase())];

  const handleConfirm = () => {
    deleteCustomCategory(targetCategory, action, action === 'move' ? destCat : '');
    closeDeleteModal();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={closeDeleteModal} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className={styles.glassCard}
        style={{ position: 'relative', width: '100%', maxWidth: 400, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Outfit' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Delete Category</h3>
          <button onClick={closeDeleteModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}><X size={20} /></button>
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--admin-text-body)', lineHeight: 1.5, margin: 0 }}>
          You are deleting <strong style={{ color: '#ed1b24' }}>{targetCategory}</strong>. This category currently has <strong>{propCount}</strong> properties. What would you like to do with them?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', padding: '1rem', border: `1px solid ${action === 'delete' ? '#ed1b24' : 'var(--admin-stroke)'}`, borderRadius: 12, background: action === 'delete' ? 'rgba(237,27,36,0.05)' : 'transparent', transition: 'all 0.2s' }}>
            <input type="radio" name="deleteAction" value="delete" checked={action === 'delete'} onChange={() => setAction('delete')} style={{ marginTop: 4 }} />
            <div>
              <div style={{ fontWeight: 600, color: action === 'delete' ? '#ed1b24' : 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={16} /> Delete all properties
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem' }}>Permanently remove {propCount} properties.</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', padding: '1rem', border: `1px solid ${action === 'move' ? 'var(--admin-text-main)' : 'var(--admin-stroke)'}`, borderRadius: 12, background: action === 'move' ? 'rgba(0,0,0,0.02)' : 'transparent', transition: 'all 0.2s' }}>
            <input type="radio" name="deleteAction" value="move" checked={action === 'move'} onChange={() => setAction('move')} style={{ marginTop: 4 }} />
            <div style={{ width: '100%' }}>
              <div style={{ fontWeight: 600, color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MoveRight size={16} /> Move to another type
              </div>
              {action === 'move' && (
                <div style={{ marginTop: '0.75rem' }} onClick={e => e.stopPropagation()}>
                  <select 
                    value={destCat} 
                    onChange={e => setDestCat(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', outline: 'none', background: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit', fontWeight: 600 }}
                  >
                    {allDestinations.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button onClick={closeDeleteModal} style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: '1px solid var(--admin-stroke)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', color: 'var(--admin-text-main)' }}>Cancel</button>
          <button onClick={handleConfirm} style={{ flex: 1, padding: '0.85rem', background: '#ed1b24', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', color: 'white' }}>Confirm</button>
        </div>
      </motion.div>
    </div>
  );
}
