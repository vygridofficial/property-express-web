import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { getSiteSettings } from '../../services/propertyService';
import { formatSocialUrl } from '../../utils/social';
import styles from './Footer.module.css';
import logo from '../../assets/logo.png';

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <path d="M17.5 6.5h.01" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSiteSettings().then(data => {
      if (data) setSettings(data);
    });
  }, []);

  const phone = settings?.primaryPhone || '';
  const email = settings?.supportEmail || '';
  const address = settings?.officeAddress || '';
  const facebookUrl = settings?.facebookUrl || '';
  const instagramUrl = settings?.instagramUrl || '';

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <Link to="/" className={styles.logo}>
              <img src={logo} alt={settings?.siteName || "Property Express"} className={styles.logoImg} />
            </Link>
            <p className={styles.footerDesc}>
              {settings?.metaDescription || "Premium real estate agency providing verified, high-quality properties with exceptional customer service and expert market insight."}
            </p>
            <div className={`flex ${styles.socialLinks}`}>
              {facebookUrl && (
                <a href={formatSocialUrl(facebookUrl, 'facebook')} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <FacebookIcon />
                </a>
              )}
              {instagramUrl && (
                <a href={formatSocialUrl(instagramUrl, 'instagram')} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <InstagramIcon />
                </a>
              )}
              {/* Keeping a default X icon as a placeholder unless there's a field for it */}
              <a href="https://twitter.com/propertyexpress" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                <XIcon />
              </a>
            </div>
          </div>

          <div className={styles.footerCol}>
            <h4>Quick Links</h4>
            <div className={`${styles.footerLinks} ${styles.quickLinks}`}>
              <Link to="/">Home</Link>
              <Link to="/properties">Properties</Link>
              <Link to="/about">About Us</Link>
              {settings?.visibility?.showContactForm !== false && (
                <Link to="/contact">Contact</Link>
              )}
            </div>
          </div>

          <div className={styles.footerCol}>
            <h4>Categories</h4>
            <div className={`${styles.footerLinks} ${styles.catLinks}`}>
              <Link to="/properties?category=Villa">Luxury Villas</Link>
              <Link to="/properties?category=Apartment">City Apartments</Link>
              <Link to="/properties?category=Commercial">Commercial Space</Link>
              <Link to="/properties?category=Plot">Lands &amp; Plots</Link>
            </div>
          </div>

          <div className={styles.footerCol}>
            <h4>Contact Info</h4>
            <div className={styles.footerLinks}>
              {address && (
                <a
                  href={settings?.googleMapsEmbed || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactItem}
                >
                  <MapPin size={18} />
                  <span>{address}</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, '')}`} className={styles.contactItem}>
                  <Phone size={18} />
                  <span>{phone}</span>
                </a>
              )}
              {email && (
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactItem}
                >
                  <Mail size={18} />
                  <span>{email}</span>
                </a>
              )}
              {/* Fallback values if nothing set yet */}
              {!address && !phone && !email && (
                <span className={styles.contactItem} style={{ color: 'var(--text-muted)' }}>
                  Contact details not yet configured.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} {settings?.siteName || "Property Express"}. All Rights Reserved. | Designed and Developed by <a href="https://vygrid.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}>Vygrid</a></p>
        </div>
      </div>
    </footer>
  );
}
