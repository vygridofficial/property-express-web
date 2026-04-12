import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrolled } from '../../hooks/useScrolled';
import styles from './Navbar.module.css';
import logo from '../../assets/logo.png';

export default function Navbar() {
  const isScrolled = useScrolled();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={`container flex-between ${styles.navContainer}`}>
          <Link to="/" className={styles.logo} onClick={() => setIsMobileMenuOpen(false)}>
            <img src={logo} alt="Property Express" className={styles.logoImg} />
          </Link>

          <button
            className={styles.mobileToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>

          <nav className={styles.navLinks}>
            <NavLink to="/" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>Home</NavLink>
            <NavLink to="/properties" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>Properties</NavLink>
            <NavLink to="/about" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>About Us</NavLink>
            <NavLink to="/contact" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>Contact</NavLink>
          </nav>

          <div className="desktop-only" style={{ display: 'none' }}>
            <Link to="/contact" className="btn btn-primary">Book a Visit</Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</NavLink>
            <NavLink to="/properties" onClick={() => setIsMobileMenuOpen(false)}>Properties</NavLink>
            <NavLink to="/about" onClick={() => setIsMobileMenuOpen(false)}>About Us</NavLink>
            <NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</NavLink>
            <Link to="/contact" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsMobileMenuOpen(false)}>Book a Visit</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
