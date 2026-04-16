import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Calendar,
  Home,
  Building,
  MapPin
} from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import styles from '../styles/Dashboard.module.css';
import Skeleton from 'react-loading-skeleton';

const statusConfig = {
  pending:  { icon: Clock,         bg: '#fff7ed', color: '#f59e0b', badge: '#fef3c7', text: '#92400e' },
  approved: { icon: CheckCircle2,  bg: '#ecfdf5', color: '#10b981', badge: '#d1fae5', text: '#065f46' },
  rejected: { icon: XCircle,       bg: '#fef2f2', color: '#ef4444', badge: '#fee2e2', text: '#b91c1c' },
};

export default function SigningHistory() {
  const navigate = useNavigate();
  const { submissions, loading } = useSeller();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className={styles.dashboardWrapper}>
      <header className={styles.header}>
        <h1>Signing History</h1>
      </header>
      {loading ? (
        <div className={styles.agreementsGrid} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{
              background: 'rgba(255,255,255,0.45)',
              borderRadius: 18,
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              border: '1px solid rgba(255,255,255,0.6)'
            }}>
              <Skeleton circle height={48} width={48} />
              <div style={{ flex: 1 }}>
                <Skeleton width="40%" height={20} />
                <Skeleton width="25%" height={14} style={{ marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.mainCard}>
          <div className={styles.content}>
            {submissions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.empty}>
                <Home size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>No submissions found yet.</p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {submissions.map(sub => {
                  const cfg = statusConfig[sub.status] || statusConfig.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.div
                      key={sub.id}
                      variants={itemVariants}
                      layout
                      onClick={() => navigate(`/agreements/signed/${sub.id}`)}
                      style={{
                        background: 'var(--glass-bg, rgba(255,255,255,0.45))',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid var(--glass-border, rgba(255,255,255,0.6))',
                        borderRadius: 18,
                        padding: '1.25rem 1.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.25s ease',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                      }}
                      whileHover={{ translateY: -3, boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}
                    >
                      {/* Status icon */}
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <StatusIcon size={22} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sub.propertyTitle || 'Unnamed Property'}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.35rem' }}>
                          {sub.propertyType && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <Building size={13} /> {sub.propertyType}
                            </span>
                          )}
                          {sub.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <MapPin size={13} /> {sub.location}
                            </span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#94a3b8' }}>
                            <Calendar size={13} /> {sub.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                          </span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                        background: cfg.badge, color: cfg.text, textTransform: 'capitalize', flexShrink: 0
                      }}>
                        {sub.status}
                      </span>

                      <ChevronRight size={18} color="#cbd5e1" />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
