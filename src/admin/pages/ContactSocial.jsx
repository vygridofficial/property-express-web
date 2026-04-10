import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Link } from 'lucide-react';
import styles from '../styles/admin.module.css';

export default function ContactSocial() {
  const InputGroup = ({ icon: Icon, label, placeholder, defaultValue }) => (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
        <input type="text" placeholder={placeholder} defaultValue={defaultValue} style={{ width: '100%', paddingLeft: '2.5rem' }} />
      </div>
    </div>
  );

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.1}} style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className={styles.glassCard}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '2rem' }}>Contact & Social Information</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <InputGroup icon={Phone} label="Primary Phone" placeholder="+1 (555) 000-0000" defaultValue="+1 (555) 123-4567" />
          <InputGroup icon={Phone} label="WhatsApp Business" placeholder="+1 (555) 000-0000" defaultValue="+1 (555) 123-4567" />
          <InputGroup icon={Mail} label="Support Email" placeholder="hello@domain.com" defaultValue="hello@propertyexpress.com" />
          
          <div style={{ height: 1, background: 'var(--admin-stroke)', margin: '1rem 0' }}></div>
          
          <InputGroup icon={MapPin} label="Office Address" placeholder="123 Street..." defaultValue="123 Business Avenue, Suite 100, New York, NY 10001" />
          <InputGroup icon={MapPin} label="Google Maps Embed URL" placeholder="https://maps.google.com/..." defaultValue="https://www.google.com/maps/embed?..." />
          
          <div style={{ height: 1, background: 'var(--admin-stroke)', margin: '1rem 0' }}></div>

          <InputGroup icon={Link} label="Instagram Profile URL" placeholder="https://instagram.com/..." defaultValue="https://instagram.com/propertyexpress" />
          <InputGroup icon={Link} label="Facebook Page URL" placeholder="https://facebook.com/..." defaultValue="https://facebook.com/propertyexpress" />

          <button className="btn" style={{ width: '100%', background: '#ed1b24', color: 'white', border: 'none', fontWeight: 700, padding: '1rem', marginTop: '1rem' }}>
            Save Contact Information
          </button>
        </div>
      </div>
    </motion.div>
  );
}
