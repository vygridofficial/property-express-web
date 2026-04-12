import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { submitLead } from '../services/leadService';
import { getSiteSettings } from '../services/propertyService';
import { revealVariants, revealViewport } from '../hooks/useScrollReveal';
import SEO from '../components/common/SEO';
import { formatSocialUrl, formatSocialDisplay } from '../utils/social';
import EnquirySuccessPopup from '../components/common/EnquirySuccessPopup';
import styles from './Contact.module.css';

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

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle');

  // ── Fetch live contact & social data from Firebase ──
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSiteSettings().then(data => {
      if (data) setSettings(data);
    });
  }, []);

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

  // Build contact items dynamically from Firebase settings, with fallbacks
  const phone = settings?.primaryPhone || '';
  const whatsapp = settings?.whatsappBusiness || settings?.primaryPhone || '';
  const email = settings?.supportEmail || '';
  const address = settings?.officeAddress || '';
  const instagramUrl = settings?.instagramUrl || '';
  const facebookUrl = settings?.facebookUrl || '';
  const whatsappClean = whatsapp.replace(/\D/g, '');

  const contactItems = [
    address && {
      icon: <MapPin size={22} />,
      label: 'Office Location',
      value: address,
      href: settings?.googleMapsEmbed || null,
    },
    phone && {
      icon: <Phone size={22} />,
      label: 'Phone',
      value: phone,
      href: `tel:${phone.replace(/\s/g, '')}`,
    },
    whatsapp && {
      icon: <MessageCircle size={22} />,
      label: 'WhatsApp',
      value: whatsapp,
      href: `https://wa.me/${whatsappClean}`,
    },
    email && {
      icon: <Mail size={22} />,
      label: 'Email',
      value: email,
      href: `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`,
    },
    instagramUrl && {
      icon: <InstagramIcon size={22} />,
      label: 'Instagram',
      value: formatSocialDisplay(instagramUrl, 'instagram'),
      href: formatSocialUrl(instagramUrl, 'instagram'),
    },
    facebookUrl && {
      icon: <FacebookIcon size={22} />,
      label: 'Facebook',
      value: "Property Express",
      href: formatSocialUrl(facebookUrl, 'facebook'),
    },
  ].filter(Boolean); // Remove items with no data

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.pageWrap}
    >
      <SEO 
        title="Contact Us"
        description="Get in touch with Property Express. Whether you're looking to buy, rent, or have questions about luxury real estate, our team is here to help."
        url="/contact"
        schemaData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "mainEntity": {
            "@type": "RealEstateAgent",
            "name": "Property Express",
            "image": "https://propertyexpress-mu.vercel.app/logo.png",
            "telephone": settings?.primaryPhone || "+919876543210",
            "email": settings?.supportEmail || "contact@property-express.com",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": settings?.officeAddress || "Trivandrum",
              "addressCountry": "IN"
            }
          }
        }}
      />
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
                {contactItems.length === 0 ? (
                  // Loading skeleton while Firebase data loads
                  [...Array(4)].map((_, i) => (
                    <div key={i} className={styles.contactItem} style={{ opacity: 0.4 }}>
                      <div className={styles.iconWrap} style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '50%', width: 44, height: 44 }} />
                      <div className={styles.contactItemText}>
                        <span className={styles.contactLabel} style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 4, display: 'block', height: 12, width: 80 }} />
                        <span className={styles.contactValue} style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 4, display: 'block', height: 16, width: 160, marginTop: 6 }} />
                      </div>
                    </div>
                  ))
                ) : (
                  contactItems.map((item, i) => (
                    <div key={i} className={styles.contactItem}>
                      {item.href ? (
                        <a 
                          href={item.href} 
                          className={styles.iconWrap}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={item.label}
                        >
                          {item.icon}
                        </a>
                      ) : (
                        <div className={styles.iconWrap}>{item.icon}</div>
                      )}
                      <div className={styles.contactItemText}>
                        <span className={styles.contactLabel}>{item.label}</span>
                        {item.href ? (
                          <a
                            href={item.href}
                            className={styles.contactValue}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <span className={styles.contactValue} style={{ whiteSpace: 'pre-line' }}>{item.value}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
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
                  <input type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
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
                {status === 'error'   && <p style={{ color: 'red',   marginTop: '1rem', textAlign: 'center' }}>Something went wrong. Please try again.</p>}
              </form>
            </motion.div>

          </div>
        </div>
      </section>

      <EnquirySuccessPopup 
        isOpen={status === 'success'} 
        onClose={() => setStatus('idle')}
      />
    </motion.div>
  );
}
