import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { Check } from 'lucide-react';
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

export default function Settings() {
  const { siteSettings, updateSiteSettings } = useAdmin();
  
  // Local drafted state for dirty checking
  const [draft, setDraft] = useState(siteSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
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
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Section Visibility</h3>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Toggle which property categories and sections appear on the public website and admin sidebar.</p>
        
        <div>
          {/* Base Categories */}
          {['Apartment', 'Villa', 'Plot', 'Commercial'].map(cat => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--admin-stroke)' }}>
              <span style={{ fontWeight: 500 }}>Show {cat}s</span>
              <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 28 }}>
                <input 
                  type="checkbox" 
                  checked={draft.visibility?.[cat] !== false} 
                  onChange={() => {
                    const newVis = { ...(draft.visibility || {}) };
                    newVis[cat] = draft.visibility?.[cat] === false;
                    setDraft(prev => ({ ...prev, visibility: newVis }));
                  }} 
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{ 
                  position: 'absolute', cursor: 'pointer', inset: 0, 
                  background: draft.visibility?.[cat] !== false ? '#18181a' : 'rgba(0,0,0,0.1)', 
                  borderRadius: 34, transition: '0.4s' 
                }}>
                  <span style={{ 
                    position: 'absolute', height: 20, width: 20, left: 4, bottom: 4, 
                    background: 'white', borderRadius: '50%', transition: '0.4s',
                    transform: draft.visibility?.[cat] !== false ? 'translateX(22px)' : 'translateX(0)'
                  }}></span>
                </span>
              </label>
            </div>
          ))}

          {/* Custom Categories */}
          {(draft.customCategories || []).map(cat => (
            <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--admin-stroke)' }}>
              <span style={{ fontWeight: 500 }}>Show {cat.name}</span>
              <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 28 }}>
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
                    position: 'absolute', height: 20, width: 20, left: 4, bottom: 4, 
                    background: 'white', borderRadius: '50%', transition: '0.4s',
                    transform: draft.visibility?.[cat.name] !== false ? 'translateX(22px)' : 'translateX(0)'
                  }}></span>
                </span>
              </label>
            </div>
          ))}

          {/* Fixed Sections removed as requested */}
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
        {showToast && (
          <motion.div
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            style={{
              position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
              background: 'var(--admin-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--admin-glass-border)', padding: '1rem 1.5rem', borderRadius: 16,
              display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ background: '#2ecc71', color: 'white', borderRadius: '50%', padding: '0.2rem' }}>
              <Check size={14} />
            </div>
            Settings saved
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
