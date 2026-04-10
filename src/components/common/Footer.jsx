import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import styles from './Footer.module.css';
import logo from '../../assets/logo.png';

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <path d="M17.5 6.5h.01"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <Link to="/" className={styles.logo}>
              <img src={logo} alt="Property Express" className={styles.logoImg} />
            </Link>
            <p className={styles.footerDesc}>
              Premium real estate agency providing verified, high-quality properties with exceptional customer service and expert market insight.
            </p>
            <div className={`flex ${styles.socialLinks}`}>
              <a href="https://facebook.com/propertyexpress" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FacebookIcon /></a>
              <a href="https://instagram.com/propertyexpress" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon /></a>
              <a href="https://twitter.com/propertyexpress" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"><XIcon /></a>
            </div>
          </div>

          <div className={styles.footerCol}>
            <h4>Quick Links</h4>
            <div className={`${styles.footerLinks} ${styles.quickLinks}`}>
              <Link to="/">Home</Link>
              <Link to="/properties">Properties</Link>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
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
              <a 
                href="https://www.google.com/maps/search/?api=1&query=123+Business+Avenue+Suite+100+New+York+NY+10001" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.contactItem}
              >
                <MapPin size={18} /> 
                <span>123 Business Avenue, Suite 100, New York, NY 10001</span>
              </a>
              <a href="tel:+15551234567" className={styles.contactItem}>
                <Phone size={18} /> 
                <span>+1 (555) 123-4567</span>
              </a>
              <a 
                href="https://mail.google.com/mail/?view=cm&fs=1&to=hello@propertyexpress.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.contactItem}
              >
                <Mail size={18} /> 
                <span>hello@propertyexpress.com</span>
              </a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; 2026 Property Express. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
