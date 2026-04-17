import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { submitLead } from '../services/leadService';
import { getSiteSettings } from '../services/propertyService';
import { revealVariants, revealViewport } from '../hooks/useScrollReveal';
import SEO from '../components/common/SEO';
import { formatSocialUrl, formatSocialDisplay } from '../utils/social';
import EnquirySuccessPopup from '../components/common/EnquirySuccessPopup';
import PhoneInput from '../components/common/PhoneInput';
import styles from './Contact.module.css';
import { isValidEmail, isValidPhone } from '../utils/validation';

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

const WhatsAppIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color === "currentColor" ? "currentColor" : color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', phoneCountryCode: '+91', message: '' });
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});

  // ── Fetch live contact & social data from Firebase ──
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSiteSettings().then(data => {
      if (data) setSettings(data);
    });
  }, []);

  const validate = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !isValidPhone(formData.phone, formData.phoneCountryCode)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setStatus('submitting');
    try {
      const submitData = {
        ...formData,
        phone: formData.phone ? formData.phoneCountryCode + formData.phone : '',
      };
      await submitLead(submitData);
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', phoneCountryCode: '+91', message: '' });
      setErrors({});
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
      icon: <WhatsAppIcon size={22} />,
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
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    className={errors.name ? 'field-error' : ''}
                    required 
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="contact-phone">Phone Number</label>
                  <PhoneInput
                    id="contact-phone"
                    value={formData.phone}
                    countryCode={formData.phoneCountryCode}
                    onChange={(phone, code) => setFormData({ ...formData, phone, phoneCountryCode: code })}
                    placeholder="Enter phone number"
                    error={errors.phone}
                    theme="light"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    className={errors.email ? 'field-error' : ''}
                    required 
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>Message</label>
                  <textarea 
                    rows={5} 
                    value={formData.message} 
                    onChange={e => setFormData({ ...formData, message: e.target.value })} 
                    className={errors.message ? 'field-error' : ''}
                    required
                  ></textarea>
                  {errors.message && <span className="error-message">{errors.message}</span>}
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
