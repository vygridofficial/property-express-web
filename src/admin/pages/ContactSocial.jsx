import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MapPin, Link, Check } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import PhoneInput from '../../components/common/PhoneInput';
import styles from '../styles/admin.module.css';

const InputGroup = ({ icon: Icon, label, placeholder, stateKey, value, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <Icon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value || ''} 
        onChange={(e) => onChange(stateKey, e.target.value)}
        style={{ width: '100%', paddingLeft: '2.5rem' }} 
      />
    </div>
  </div>
);

export default function ContactSocial() {
  const { siteSettings, updateSiteSettings } = useAdmin();
  const [draft, setDraft] = useState(siteSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setDraft(siteSettings);
    }
  }, [siteSettings, isDirty]);

  // Derive phone code fields with fallback
  const primaryPhoneCode = draft.primaryPhoneCode || '+91';
  const whatsappCode     = draft.whatsappCode     || '+91';

  useEffect(() => {
    const dirty = Object.keys(siteSettings).some(k => siteSettings[k] !== draft[k]);
    setIsDirty(dirty);
  }, [draft, siteSettings]);

  const handleInputChange = (key, value) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSiteSettings(draft);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (error) {
      console.error('Failed to save contact settings:', error);
    }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.1}} style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
      <div className={styles.glassCard}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '2rem' }}>Contact & Social Information</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Primary Phone */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Primary Phone</label>
            <PhoneInput
              value={draft.primaryPhone || ''}
              countryCode={primaryPhoneCode}
              onChange={(phone, code) => setDraft(prev => ({ ...prev, primaryPhone: phone, primaryPhoneCode: code }))}
              placeholder="Phone number"
            />
          </div>

          {/* WhatsApp Business */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>WhatsApp Business</label>
            <PhoneInput
              value={draft.whatsappBusiness || ''}
              countryCode={whatsappCode}
              onChange={(phone, code) => setDraft(prev => ({ ...prev, whatsappBusiness: phone, whatsappCode: code }))}
              placeholder="WhatsApp number"
            />
          </div>
          <InputGroup icon={Mail} label="Support Email" placeholder="hello@domain.com" stateKey="supportEmail" value={draft.supportEmail} onChange={handleInputChange} />
          
          <div style={{ height: 1, background: 'var(--admin-stroke)', margin: '1rem 0' }}></div>
          
          <InputGroup icon={MapPin} label="Office Address" placeholder="123 Street..." stateKey="officeAddress" value={draft.officeAddress} onChange={handleInputChange} />
          <InputGroup icon={MapPin} label="Google Maps Embed URL" placeholder="https://maps.google.com/..." stateKey="googleMapsEmbed" value={draft.googleMapsEmbed} onChange={handleInputChange} />
          
          <div style={{ height: 1, background: 'var(--admin-stroke)', margin: '1rem 0' }}></div>

          <InputGroup icon={Link} label="Instagram Profile URL" placeholder="https://instagram.com/..." stateKey="instagramUrl" value={draft.instagramUrl} onChange={handleInputChange} />
          <InputGroup icon={Link} label="Facebook Page URL" placeholder="https://facebook.com/..." stateKey="facebookUrl" value={draft.facebookUrl} onChange={handleInputChange} />

          {isDirty && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="btn" 
              onClick={handleSave}
              style={{ width: '100%', background: '#ed1b24', color: 'white', border: 'none', fontWeight: 700, padding: '1rem', marginTop: '1rem', boxShadow: '0 8px 30px rgba(237,27,36,0.3)' }}
            >
              Save Contact Information
            </motion.button>
          )}
        </div>
      </div>

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
            Contact saved
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
