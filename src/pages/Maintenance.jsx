import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Maintenance({ message }) {
  const currentYear = new Date().getFullYear();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--color-bg)',
      textAlign: 'center',
      fontFamily: 'inherit'
    }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img 
            src={logo} 
            alt="Property Express" 
            style={{ height: '70px', marginBottom: '4rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }} 
          />
        </motion.div>

        {/* Maintenance Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ 
            width: '100px', 
            height: '100px', 
            background: 'var(--color-primary)', 
            color: 'white', 
            borderRadius: '28px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 2.5rem auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}
        >
          <motion.div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Settings size={52} />
          </motion.div>
        </motion.div>

        {/* Text Content */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ 
            fontSize: '3.5rem', 
            fontWeight: 700, 
            color: 'var(--color-primary)', 
            marginBottom: '2rem',
            letterSpacing: '-0.04em'
          }}
        >
          We'll Be Back Soon!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ 
            fontSize: '1.4rem', 
            lineHeight: 1.6, 
            color: 'var(--color-text-light)', 
            marginBottom: '5rem' 
          }}
        >
          {message || "Our site is currently undergoing scheduled maintenance. We'll be back shortly with a better experience."}
        </motion.p>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          style={{ 
            fontSize: '1rem', 
            color: 'var(--admin-text-muted)', 
            borderTop: '1px solid var(--color-border)', 
            paddingTop: '3rem' 
          }}
        >
          &copy; {currentYear} Property Express. All Rights Reserved.
        </motion.div>
      </div>
    </div>
  );
}
