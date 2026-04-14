import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { Check, Trash2, X, AlertCircle, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import styles from '../styles/admin.module.css';

const ToggleRow = ({ label, checked, onToggle }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--admin-stroke)' }}>
    <span style={{ fontWeight: 500 }}>{label}</span>
    <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 28 }}>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onToggle} 
        style={{ opacity: 0, width: 0, height: 0 }} 
      />
      <span style={{ 
        position: 'absolute', cursor: 'pointer', inset: 0, 
        background: checked ? '#18181a' : 'rgba(0,0,0,0.1)', 
        borderRadius: 34, transition: '0.4s' 
      }}>
        <span style={{ 
          position: 'absolute', height: 20, width: 20, left: 4, bottom: 4, 
          background: 'white', borderRadius: '50%', transition: '0.4s',
          transform: checked ? 'translateX(22px)' : 'translateX(0)'
        }}></span>
      </span>
    </label>
  </div>
);

const DEFAULT_IMAGES = {
  Villa: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  Apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  Commercial: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  Plot: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
};

export default function Settings() {
  const { siteSettings, updateSiteSettings, properties, propertyTypes = [], removePropertyType, updatePropertyType, reorderPropertyTypes } = useAdmin();
  
  // Local drafted state for dirty checking
  const [draft, setDraft] = useState(siteSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [toastConfig, setToastConfig] = useState({ isOpen: false, message: '', type: 'success' });
  const [deleteData, setDeleteData] = useState(null); // Used for confirmation modal
  const [editData, setEditData] = useState(null);
  const [subTypeInput, setSubTypeInput] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editImage, setEditImage] = useState(null); // base64 preview or null = unchanged

  const uploadToCloudinary = async (base64) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dm9tmagpg';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'property_express';
    const uploadData = new FormData();
    uploadData.append('file', base64);
    uploadData.append('upload_preset', uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: uploadData });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error('Cloudinary upload failed');
  };

  const triggerToast = (message, type = 'success') => {
    setToastConfig({ isOpen: true, message, type });
    setTimeout(() => setToastConfig(prev => ({ ...prev, isOpen: false })), 3000);
  };

  const initiateDelete = (name) => {
    // Check if property type is assigned to existing properties (case-insensitive)
    const isInUse = properties.some(p => p.category?.toLowerCase() === name.toLowerCase());
    if (isInUse) {
      triggerToast(`Cannot delete '${name}' — it is assigned to existing listings.`, 'error');
      return;
    }
    setDeleteData({ name });
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    try {
      await removePropertyType(deleteData.name);
      setDeleteData(null);
      triggerToast(`Property type '${deleteData.name}' deleted`, 'success');
    } catch (err) {
      triggerToast('Failed to delete property type', 'error');
    }
  };

  useEffect(() => {
    setDraft(siteSettings);
  }, [siteSettings]);

  useEffect(() => {
    const dirty = Object.keys(siteSettings).some(k => siteSettings[k] !== draft[k]);
    setIsDirty(dirty);
  }, [draft, siteSettings]);

  const handleToggle = (key) => {
    setDraft(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (key, value) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSiteSettings(draft);
      triggerToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.1}} style={{ maxWidth: 800, position: 'relative' }}>
      <div className={styles.glassCard} style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>General Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Site Name (Browser Tab)</label>
            <input 
              type="text" 
              value={draft.siteName} 
              onChange={(e) => handleInputChange('siteName', e.target.value)}
              style={{ width: '100%', maxWidth: 400 }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Tagline (Meta Description)</label>
            <input 
              type="text" 
              value={draft.tagline} 
              onChange={(e) => handleInputChange('tagline', e.target.value)}
              style={{ width: '100%', maxWidth: 400 }} 
            />
          </div>

          <div style={{ marginTop: '0.5rem', padding: '1.5rem 0', borderTop: '1px solid var(--admin-stroke)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Hero Section</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Hero Title</label>
                <input 
                  type="text" 
                  value={draft.heroTitle || ''} 
                  onChange={(e) => handleInputChange('heroTitle', e.target.value)}
                  style={{ width: '100%', maxWidth: 600 }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Hero Description</label>
                <textarea 
                  rows={2} 
                  value={draft.heroDescription || ''} 
                  onChange={(e) => handleInputChange('heroDescription', e.target.value)}
                  style={{ width: '100%', maxWidth: 600, resize: 'none' }}
                ></textarea>
              </div>
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--admin-stroke)', margin: '0.5rem 0' }} />
          <div>
            <ToggleRow 
              label="Maintenance Mode" 
              checked={draft.maintenanceMode === true} 
              onToggle={() => handleToggle('maintenanceMode')} 
            />
            {draft.maintenanceMode && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Maintenance Message</label>
                <textarea 
                  rows={3} 
                  value={draft.maintenanceMessage || ''} 
                  onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                  placeholder="Enter custom maintenance message..."
                  style={{ width: '100%', maxWidth: 600, resize: 'none' }}
                ></textarea>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.glassCard} style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Property Types Management</h3>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>View, manage visibility, and delete property types. Default types cannot be permanently deleted.</p>
        
        <div>
          {/* Property Types mapped from database */}
          {propertyTypes.map((cat, index) => (
            <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--admin-stroke)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 500, fontSize: '1.05rem', color: 'var(--admin-text-main)' }}>{cat.name}</span>
                {cat.isDefault && (
                  <span style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--admin-text-muted)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 12, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Default</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>Visible</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                    <input 
                      type="checkbox" 
                      checked={draft.visibility?.[cat.name] !== false} 
                      onChange={() => {
                        const newVis = { ...(draft.visibility || {}) };
                        newVis[cat.name] = draft.visibility?.[cat.name] === false;
                        setDraft(prev => ({ ...prev, visibility: newVis }));
                      }} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ 
                      position: 'absolute', cursor: 'pointer', inset: 0, 
                      background: draft.visibility?.[cat.name] !== false ? '#18181a' : 'rgba(0,0,0,0.1)', 
                      borderRadius: 34, transition: '0.4s' 
                    }}>
                      <span style={{ 
                        position: 'absolute', height: 16, width: 16, left: 4, bottom: 4, 
                        background: 'white', borderRadius: '50%', transition: '0.4s',
                        transform: draft.visibility?.[cat.name] !== false ? 'translateX(20px)' : 'translateX(0)'
                      }}></span>
                    </span>
                  </label>
                </div>
                
                                <button
                  onClick={() => {
                    setEditData({
                      id: cat.id,
                      name: cat.name || '',
                      slug: cat.slug || cat.id || '',
                      category: cat.category || 'residential',
                      icon: cat.icon || 'Building2',
                      isActive: cat.isActive !== false,
                      subTypes: cat.subTypes || [],
                      image: cat.image || null,
                      isDefault: cat.isDefault
                    });
                    setSubTypeInput('');
                    setEditImage(null);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: 8, transition: 'background 0.2s', marginRight: '0.25rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  title={'Edit'}
                >
                  <Edit2 size={18} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginRight: '0.25rem' }}>
                  <button 
                    onClick={() => reorderPropertyTypes(index, 'up')}
                    disabled={index === 0}
                    style={{ background: 'transparent', border: 'none', padding: '2px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1, color: 'var(--admin-text-main)' }}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    onClick={() => reorderPropertyTypes(index, 'down')}
                    disabled={index === propertyTypes.length - 1}
                    style={{ background: 'transparent', border: 'none', padding: '2px', cursor: index === propertyTypes.length - 1 ? 'not-allowed' : 'pointer', opacity: index === propertyTypes.length - 1 ? 0.3 : 1, color: 'var(--admin-text-main)' }}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <button
                  onClick={() => initiateDelete(cat.name)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: 8, transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(229,57,53,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  title={`Delete ${cat.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {propertyTypes.length === 0 && (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Syncing property types from database...</p>
          )}
        </div>
      </div>

      <div className={styles.glassCard} style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>Company Achievements</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Properties Sold (K+)</label>
            <input 
              type="text" 
              value={draft.achievementsPropertiesSold ?? '1.2'} 
              onChange={(e) => handleInputChange('achievementsPropertiesSold', e.target.value)}
              style={{ width: '100%', maxWidth: 400 }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Client Satisfaction (/5)</label>
            <input 
              type="text" 
              value={draft.achievementsClientSatisfaction ?? '4.9'} 
              onChange={(e) => handleInputChange('achievementsClientSatisfaction', e.target.value)}
              style={{ width: '100%', maxWidth: 400 }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Verified Listings (%)</label>
            <input 
              type="text" 
              value={draft.achievementsVerifiedListings ?? '100'} 
              onChange={(e) => handleInputChange('achievementsVerifiedListings', e.target.value)}
              style={{ width: '100%', maxWidth: 400 }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Expert Consultants (+)</label>
            <input 
              type="text" 
              value={draft.achievementsExpertConsultants ?? '50'} 
              onChange={(e) => handleInputChange('achievementsExpertConsultants', e.target.value)}
              style={{ width: '100%', maxWidth: 400 }} 
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDirty && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }}
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', position: 'sticky', bottom: '2rem' }}
          >
            <button className="btn" onClick={handleSave} style={{ background: '#ed1b24', color: 'white', border: 'none', fontWeight: 700, padding: '1rem 3rem', boxShadow: '0 8px 30px rgba(237,27,36,0.3)' }}>
              Save Settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastConfig.isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            style={{
              position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
              background: 'var(--admin-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: toastConfig.type === 'error' ? '1px solid rgba(237,27,36,0.3)' : '1px solid var(--admin-glass-border)',
              padding: '1rem 1.5rem', borderRadius: 16, display: 'flex', alignItems: 'center', gap: '0.75rem', 
              fontWeight: 600, boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ background: toastConfig.type === 'error' ? 'rgba(237,27,36,0.1)' : '#2ecc71', color: toastConfig.type === 'error' ? '#ed1b24' : 'white', borderRadius: '50%', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {toastConfig.type === 'error' ? <AlertCircle size={16} /> : <Check size={14} />}
            </div>
            <span style={{ color: toastConfig.type === 'error' ? '#ed1b24' : 'var(--admin-text-main)' }}>{toastConfig.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

            {/* Edit Confirmation Modal */}
      <AnimatePresence>
        {editData && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }} onClick={() => setEditData(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={styles.glassCard}
              style={{ position: 'relative', width: '100%', maxWidth: 500, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'Outfit', maxHeight: '90vh', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Edit Property Type</h3>
                <button onClick={() => { setEditData(null); setEditImage(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}><X size={20} /></button>
              </div>



              {/* Cover Image Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cover Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {/* Preview: new selection OR existing */}
                  <div style={{ width: 80, height: 56, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--admin-stroke)', flexShrink: 0, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editImage
                      ? <img src={editImage} alt="New preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (editData.image || (editData.isDefault && DEFAULT_IMAGES[editData.name]))
                        ? <img src={editData.image || DEFAULT_IMAGES[editData.name]} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', textAlign: 'center', padding: '0.25rem' }}>No Image</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="editImageInput" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: '#1565C0', color: 'white', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      {editImage ? 'Change Image' : 'Upload Image'}
                    </label>
                    <input 
                      id="editImageInput"
                      type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          const reader = new FileReader();
                          reader.onload = ev => setEditImage(ev.target.result);
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                    />
                    {editImage && (
                      <button onClick={() => setEditImage(null)} style={{ display: 'block', marginTop: '0.4rem', background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
                        ✕ Remove new selection
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Name *</label>
                <input 
                  type="text" value={editData.name} 
                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'transparent', outline: 'none' }}
                />
              </div>


              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Category *</label>
                <select 
                  value={editData.category} 
                  onChange={e => setEditData({ ...editData, category: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'transparent', outline: 'none' }}
                >
                  <option value="residential">Residential Properties</option>
                  <option value="commercial">Commercial Properties</option>
                  <option value="industrial">Industrial Properties</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sub-types (Press Enter/Comma to add)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {editData.subTypes.map(st => (
                    <span key={st} style={{ background: '#18181a', color: 'white', padding: '0.25rem 0.5rem', borderRadius: 16, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {st}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => setEditData({ ...editData, subTypes: editData.subTypes.filter(s => s !== st) })} />
                    </span>
                  ))}
                </div>
                <input 
                  type="text" value={subTypeInput} placeholder="e.g. 1BHK, 2BHK"
                  onChange={e => {
                    const val = e.target.value;
                    if (val.endsWith(',')) {
                      const newT = val.slice(0, -1).trim();
                      if (newT && !editData.subTypes.includes(newT)) setEditData({ ...editData, subTypes: [...editData.subTypes, newT] });
                      setSubTypeInput('');
                    } else setSubTypeInput(val);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const newT = subTypeInput.trim();
                      if (newT && !editData.subTypes.includes(newT)) setEditData({ ...editData, subTypes: [...editData.subTypes, newT] });
                      setSubTypeInput('');
                    }
                  }}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'transparent', outline: 'none' }}
                />
              </div>


              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active</span>
                <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 28 }}>
                  <input type="checkbox" checked={editData.isActive} onChange={e => setEditData({ ...editData, isActive: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: editData.isActive ? '#18181a' : 'rgba(0,0,0,0.1)', borderRadius: 34, transition: '0.4s' }}>
                    <span style={{ position: 'absolute', height: 20, width: 20, left: 4, bottom: 4, background: 'white', borderRadius: '50%', transition: '0.4s', transform: editData.isActive ? 'translateX(22px)' : 'translateX(0)' }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setEditData(null)} disabled={isSavingEdit}
                  style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: '1px solid var(--admin-stroke)', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: 'var(--admin-text-main)', fontFamily: 'Outfit', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editData.name.trim()) {
                      triggerToast('Name is required.', 'error');
                      return;
                    }
                    setIsSavingEdit(true);
                    try {
                      // Save subTypeInput leftover
                      let finalSubTypes = [...editData.subTypes];
                      if (subTypeInput.trim() && !finalSubTypes.includes(subTypeInput.trim())) {
                        finalSubTypes.push(subTypeInput.trim());
                      }
                      let finalImageUrl = editData.image || null;
                      if (editImage) {
                        finalImageUrl = await uploadToCloudinary(editImage);
                      }
                      const payload = {
                        name: editData.name.trim(),
                        category: editData.category,
                        subTypes: finalSubTypes,
                        icon: editData.icon.trim(),
                        isActive: editData.isActive,
                        ...(finalImageUrl !== undefined && { image: finalImageUrl })
                      };
                      await updatePropertyType(editData.id, payload);
                      triggerToast('Property type updated successfully.');
                      setEditData(null);
                    } catch (err) {
                      console.error(err);
                      triggerToast('Failed to update property type.', 'error');
                    } finally {
                      setIsSavingEdit(false);
                    }
                  }}
                  disabled={isSavingEdit || !editData.name.trim()}
                  style={{ flex: 1, padding: '0.85rem', background: '#1565C0', border: 'none', borderRadius: 10, fontWeight: 700, cursor: isSavingEdit ? 'wait' : 'pointer', color: 'white', fontFamily: 'Outfit', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (!editData.name.trim() || isSavingEdit) ? 0.5 : 1 }}
                >
                  {isSavingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteData && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }} onClick={() => setDeleteData(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={styles.glassCard}
              style={{ position: 'relative', width: '100%', maxWidth: 420, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Outfit' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Delete Property Type</h3>
                <button onClick={() => setDeleteData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}><X size={20} /></button>
              </div>

              <div style={{ background: 'rgba(237,27,36,0.06)', border: '1px solid rgba(237,27,36,0.15)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--admin-text-body)', lineHeight: 1.6, margin: 0 }}>
                  Are you sure you want to delete '<strong>{deleteData.name}</strong>'? This action cannot be undone.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setDeleteData(null)}
                  style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: '1px solid var(--admin-stroke)', borderRadius: 10, fontWeight: 600, cursor: 'pointer', color: 'var(--admin-text-main)', fontFamily: 'Outfit', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  style={{ flex: 1, padding: '0.85rem', background: '#E53935', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: 'white', fontFamily: 'Outfit', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
