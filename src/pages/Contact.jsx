import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';

const InstagramIcon = ({ size = 24, color = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ size = 24, color = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);
import { submitLead } from '../services/leadService';
import { revealVariants, revealViewport } from '../hooks/useScrollReveal';
import styles from './Contact.module.css';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await submitLead(formData);
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    }
  };

  const contactItems = [
    {
      icon: <MapPin size={22} />,
      label: 'Office Location',
      value: '123 Business Avenue, Suite 100\nNew York, NY 10001',
      href: null,
    },
    {
      icon: <Phone size={22} />,
      label: 'Phone',
      value: '+1 (555) 123-4567',
      href: 'tel:+15551234567',
    },
    {
      icon: <MessageCircle size={22} />,
      label: 'WhatsApp',
      value: '+1 (555) 123-4567',
      href: 'https://wa.me/15551234567',
    },
    {
      icon: <Mail size={22} />,
      label: 'Email',
      value: 'hello@propertyexpress.com',
      href: 'mailto:hello@propertyexpress.com',
    },
    {
      icon: <InstagramIcon size={22} />,
      label: 'Instagram',
      value: '@propertyexpress',
      href: 'https://instagram.com/propertyexpress',
    },
    {
      icon: <FacebookIcon size={22} />,
      label: 'Facebook',
      value: 'Property Express',
      href: 'https://facebook.com/propertyexpress',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.pageWrap}
    >
      <section className={styles.pageHeader}>
        <div className={`container ${styles.headerContent}`}>
          <h1>Contact Us</h1>
          <p className="subtitle">We're here to help you find your dream home.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.contactLayout}>

            {/* ── Contact Details Panel ─────────────────────────── */}
            <motion.div
              className={styles.detailsPanel}
              variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport}
            >
              <h2 className={styles.sectionHeading}>Get in Touch</h2>
              <p className={styles.detailsIntro}>
                Whether you're looking to buy, rent, or just have a question, our team is ready to assist you.
              </p>

              <div className={styles.contactInfoList}>
                {contactItems.map((item, i) => (
                  <div key={i} className={styles.contactItem}>
                    <div className={styles.iconWrap}>{item.icon}</div>
                    <div className={styles.contactItemText}>
                      <span className={styles.contactLabel}>{item.label}</span>
                      {item.href ? (
                        <a href={item.href} className={styles.contactValue} target="_blank" rel="noopener noreferrer">
                          {item.value}
                        </a>
                      ) : (
                        <span className={styles.contactValue} style={{ whiteSpace: 'pre-line' }}>{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Enquiry Form ────────────────────────────────────── */}
            <motion.div
              className={styles.formContainer}
              variants={revealVariants} initial="hidden" whileInView="visible" viewport={revealViewport} transition={{ delay: 0.15 }}
            >
              <h3 className={styles.formHeading}>Send an Enquiry</h3>
              <form onSubmit={handleSubmit} className={styles.contactForm}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input type="text" placeholder="Your full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Message</label>
                  <textarea rows={5} placeholder="Tell us how we can help..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending…' : 'Submit Enquiry'}
                </button>
                {status === 'success' && <p style={{ color: 'green', marginTop: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Enquiry has been submitted! Our team will contact you shortly.</p>}
                {status === 'error'   && <p style={{ color: 'red',   marginTop: '1rem', textAlign: 'center' }}>Something went wrong. Please try again.</p>}
              </form>
            </motion.div>

          </div>
        </div>
      </section>
    </motion.div>
  );
}
