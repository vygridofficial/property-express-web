import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Shield,
  DollarSign
} from 'lucide-react';
import styles from '../styles/Dashboard.module.css';
import Skeleton from 'react-loading-skeleton';

const faqs = [
  {
    q: 'How do I list my property on Property Express?',
    a: 'Click "Sell Your Property" from your dashboard, fill in the property details form, accept the terms, provide your digital signature, and submit. Our admin team reviews it within 2–3 business days.'
  },
  {
    q: 'How long does the approval process take?',
    a: 'After submission, the admin team reviews your property listing within 2–3 business days. You will see the status update in your dashboard under "My Properties".'
  },
  {
    q: 'Can I edit my property listing after it has been submitted?',
    a: 'Once submitted, the listing cannot be edited directly. If you need to make changes, please contact us through the platform so the admin team can update it on your behalf.'
  },
  {
    q: 'What happens after my property is approved?',
    a: 'Once approved, the admin counter-signs the agreement, your property goes live on the platform for potential buyers to see, and you can download the signed PDF agreement from your dashboard.'
  },
  {
    q: 'How is my payment and commission handled?',
    a: 'Property Express charges a standard platform commission only upon a successful property closing. No upfront fees are required. Commission details are outlined in the agreement you sign during submission.'
  },
  {
    q: 'What is the exclusivity period?',
    a: 'When you list a property, you agree to list it exclusively on Property Express for a minimum of 30 days pending admin approval. This helps us give your listing maximum visibility.'
  },
  {
    q: 'Can I list multiple properties?',
    a: 'Yes! You can list as many properties as you own. Each submission goes through the same review process individually.'
  },
  {
    q: 'My submission was rejected. What should I do?',
    a: 'The admin team will provide a reason for rejection. Review the reason, correct the issue (e.g., inaccurate details, unsatisfactory photos), and submit a new listing.'
  },
];

const termsLinks = [
  {
    id: 'accuracy',
    icon: Shield,
    title: 'Accuracy of Information',
    desc: 'Your obligations regarding the truthfulness and correctness of submitted property data.',
    color: '#3b82f6',
    bg: '#eff6ff'
  },
  {
    id: 'exclusivity',
    icon: FileText,
    title: 'Platform Exclusivity',
    desc: 'Terms governing the 30-day exclusivity window for listed properties.',
    color: '#8b5cf6',
    bg: '#f5f3ff'
  },
  {
    id: 'commission',
    icon: DollarSign,
    title: 'Commission Agreement',
    desc: 'How commissions are calculated and collected upon successful property closing.',
    color: '#10b981',
    bg: '#ecfdf5'
  },
];

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: 'var(--glass-bg, rgba(255,255,255,0.45))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.6))',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: open ? '0 8px 28px rgba(0,0,0,0.07)' : '0 2px 10px rgba(0,0,0,0.03)',
        transition: 'box-shadow 0.2s ease'
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          width: '100%', padding: '1.25rem 1.5rem', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left'
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: open ? '#ed1b24' : '#94a3b8', flexShrink: 0, transition: 'color 0.2s' }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 1.5rem 1.25rem', color: 'var(--text-body)', lineHeight: 1.7, borderTop: '1px solid var(--glass-border)' }}>
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TermsModal({ term, onClose }) {
  if (!term) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 24, padding: '2.5rem', maxWidth: 560, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: term.bg, color: term.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <term.icon size={20} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{term.title}</h2>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.7 }}>
            📋 Full terms content will be provided soon. This section will contain the detailed legal text for the <strong>{term.title}</strong> clause.
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '0.9rem', background: '#ed1b24', color: 'white', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function HelpCenter() {
  const [activeTerm, setActiveTerm] = useState(null);

  return (
    <div className={styles.dashboardWrapper}>
      <header className={styles.header}>
        {loading ? <Skeleton height={40} width={200} /> : <h1>Help Center</h1>}
      </header>
      {loading ? (
        <Skeleton count={5} height={30} style={{ marginBottom: '1rem' }} />
      ) : (
        <div>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '1rem' }}>Terms & Conditions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {termsLinks.map(term => (
                <motion.button
                  key={term.id}
                  whileHover={{ translateY: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}
                  onClick={() => setActiveTerm(term)}
                  style={{
                    background: 'var(--glass-bg, rgba(255,255,255,0.45))',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.6))',
                    borderRadius: 18,
                    padding: '1.5rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.2s ease'
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: term.bg, color: term.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <term.icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: 4 }}>{term.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>{term.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: term.color, fontSize: '0.8rem', fontWeight: 600, marginTop: 'auto' }}>
                    <ExternalLink size={13} /> Read Full Terms
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '1rem' }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {faqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
              ))}
            </div>
          </div>

          <AnimatePresence>
            {activeTerm && <TermsModal term={activeTerm} onClose={() => setActiveTerm(null)} />}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
