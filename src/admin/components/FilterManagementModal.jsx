import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { FILTER_TAXONOMY } from '../../data/filterTaxonomy';
import styles from '../styles/admin.module.css';

export default function FilterManagementModal({ isOpen, onClose, categoryName }) {
  const { siteSettings, updateCategoryTaxonomy } = useAdmin();
  const [filters, setFilters] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError] = useState('');
  
  // New Filter Form State
  const [newFilter, setNewFilter] = useState({
    label: '',
    key: '',
    type: 'dropdown',
    options: ''
  });

  useEffect(() => {
    if (isOpen && categoryName) {
      // Load from DB if exists, otherwise from static taxonomy
      const dbTaxonomy = siteSettings.taxonomy?.[categoryName]?.subFilters;
      const staticTaxonomy = FILTER_TAXONOMY[categoryName]?.subFilters || [];
      setFilters(dbTaxonomy || staticTaxonomy);
      setIsAdding(false);
      setEditingIndex(null);
      setError('');
    }
  }, [isOpen, categoryName, siteSettings.taxonomy]);

  if (!isOpen) return null;

  const handleSave = async (updatedFilters) => {
    try {
      await updateCategoryTaxonomy(categoryName, updatedFilters);
      setFilters(updatedFilters);
      setIsAdding(false);
      setEditingIndex(null);
      setError('');
    } catch (err) {
      setError('Failed to save filters. Please try again.');
    }
  };

  const onAddFilter = () => {
    if (!newFilter.label.trim()) {
      setError('Filter label is required.');
      return;
    }
    
    // Auto-generate key from label if not provided
    const key = newFilter.key.trim() || newFilter.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    const optionsArray = newFilter.options
      ? newFilter.options.split(',').map(o => o.trim()).filter(Boolean)
      : [];

    const filterItem = {
      label: newFilter.label.trim(),
      key,
      type: newFilter.type,
      options: optionsArray
    };

    const newFilters = [...filters, filterItem];
    handleSave(newFilters);
    setNewFilter({ label: '', key: '', type: 'dropdown', options: '' });
  };

  const onDeleteFilter = (index) => {
    if (window.confirm('Are you sure you want to delete this filter? This will remove it from the frontend search.')) {
      const newFilters = filters.filter((_, i) => i !== index);
      handleSave(newFilters);
    }
  };

  const startEdit = (index) => {
    const f = filters[index];
    setEditingIndex(index);
    setNewFilter({
      label: f.label,
      key: f.key,
      type: f.type,
      options: f.options?.join(', ') || ''
    });
    setIsAdding(true);
  };

  const onUpdateFilter = () => {
    const key = newFilter.key.trim() || newFilter.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const optionsArray = newFilter.options
      ? newFilter.options.split(',').map(o => o.trim()).filter(Boolean)
      : [];

    const updated = {
      label: newFilter.label.trim(),
      key,
      type: newFilter.type,
      options: optionsArray
    };

    const newFilters = [...filters];
    newFilters[editingIndex] = updated;
    handleSave(newFilters);
    setNewFilter({ label: '', key: '', type: 'dropdown', options: '' });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        style={{ 
          position: 'relative', 
          background: 'var(--admin-glass-solid)', 
          backdropFilter: 'blur(16px)',
          width: '100%', 
          maxWidth: '600px', 
          borderRadius: '24px', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          border: '1px solid var(--admin-glass-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--admin-stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text-main)' }}>Manage Filters: {categoryName}</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 500 }}>Customize search attributes for this property type</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--admin-text-main)'} onMouseLeave={e => e.target.style.color = 'var(--admin-text-muted)'}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: 'rgba(237, 27, 36, 0.1)', color: '#ed1b24', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* New/Edit Filter Form */}
          {isAdding ? (
            <div style={{ background: 'var(--admin-glass-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--admin-stroke)', marginBottom: '2rem' }}>
              <h4 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700 }}>{editingIndex !== null ? 'Edit Filter Attribute' : 'Add New Filter Attribute'}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Attribute Name (Label)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Facing Direction"
                    value={newFilter.label}
                    onChange={e => setNewFilter(prev => ({ ...prev, label: e.target.value }))}
                    style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--admin-stroke)', background: 'var(--admin-surface)', color: 'var(--admin-text-main)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Database Key (Slug)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. facing_direction"
                      value={newFilter.key}
                      onChange={e => setNewFilter(prev => ({ ...prev, key: e.target.value }))}
                      style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--admin-stroke)', background: 'var(--admin-surface)', color: 'var(--admin-text-main)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Input Type</label>
                    <select 
                      value={newFilter.type}
                      onChange={e => setNewFilter(prev => ({ ...prev, type: e.target.value }))}
                      style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--admin-stroke)', background: 'var(--admin-surface)', color: 'var(--admin-text-main)' }}
                    >
                      <option value="dropdown">Dropdown Selection</option>
                      <option value="checkbox">Toggle / Checkbox</option>
                      <option value="text">Free Text Search</option>
                    </select>
                  </div>
                </div>

                {newFilter.type === 'dropdown' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Options (Comma separated)</label>
                    <textarea 
                      placeholder="e.g. East, West, North, South"
                      value={newFilter.options}
                      onChange={e => setNewFilter(prev => ({ ...prev, options: e.target.value }))}
                      style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--admin-stroke)', background: 'var(--admin-surface)', color: 'var(--admin-text-main)', minHeight: '80px', fontFamily: 'inherit' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    onClick={editingIndex !== null ? onUpdateFilter : onAddFilter}
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', background: '#ed1b24', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Check size={18} /> {editingIndex !== null ? 'Update Filter' : 'Save Filter'}
                  </button>
                  <button 
                    onClick={() => { setIsAdding(false); setEditingIndex(null); }}
                    style={{ padding: '0.8rem 1.2rem', borderRadius: '10px', background: 'transparent', color: 'var(--admin-text-main)', border: '1px solid var(--admin-stroke)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: 'var(--admin-glass-bg)', border: '1px dashed var(--admin-stroke)', color: 'var(--admin-text-main)', fontWeight: 600, cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Plus size={20} /> Add New Filter Attribute
            </button>
          )}

          {/* Filter List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, textAlign: 'left', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Current Attributes</h5>
            {filters.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-muted)', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px dashed var(--admin-stroke)' }}>
                No custom filters defined for this category.
              </div>
            ) : (
              filters.map((f, i) => (
                <div key={f.key || i} style={{ padding: '1rem', background: 'var(--admin-surface)', borderRadius: '16px', border: '1px solid var(--admin-stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--admin-text-main)' }}>{f.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span style={{ textTransform: 'uppercase' }}>{f.type}</span>
                      <span>•</span>
                      <span>Key: {f.key}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => startEdit(i)}
                      style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', color: 'var(--admin-text-main)', border: 'none', cursor: 'pointer' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDeleteFilter(i)}
                      style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(237, 27, 36, 0.1)', color: '#ed1b24', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--admin-stroke)', textAlign: 'right', background: 'var(--admin-glass-bg)' }}>
          <button 
            onClick={onClose}
            style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', background: 'var(--admin-text-main)', color: 'var(--admin-surface)', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
            onMouseDown={e => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={e => e.target.style.transform = 'scale(1)'}
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
