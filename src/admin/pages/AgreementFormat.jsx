import React from 'react';
import { motion } from 'framer-motion';
import AgreementTemplateTab from '../components/AgreementTemplateTab';

export default function AgreementFormat() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}
    >
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--admin-text-main)', margin: '0 0 0.25rem' }}>
          Agreement Format
        </h1>
        <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>
          Manage your document templates and map placeholders to seller information.
        </p>
      </header>

      <AgreementTemplateTab />
    </motion.div>
  );
}
