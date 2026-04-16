import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle2, Home, Plus, Calendar, Download,
  Filter, Search, Trash2, AlertTriangle, X
} from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import styles from '../styles/Dashboard.module.css';
import Skeleton from 'react-loading-skeleton';

/* ── Confirm Delete Modal ── */
function ConfirmModal({ title, onConfirm, onCancel, isDeleting }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{
          background: 'var(--glass-bg)', borderRadius: 20, padding: '2rem',
          maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--stroke)'
        }}
      >
        <div style={{ width: 52, height: 52, background: 'rgba(239, 68, 68, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <AlertTriangle size={26} color="#ef4444" />
        </div>
        <h3 style={{ textAlign: 'center', margin: '0 0 0.5rem', fontSize: '1.15rem', color: 'var(--text-main)' }}>Delete Property?</h3>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '0 0 1.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Are you sure you want to permanently delete <strong>"{title}"</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '0.85rem', background: 'transparent', color: 'var(--text-main)', borderRadius: 12, border: '1px solid var(--stroke)', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{ flex: 1, padding: '0.85rem', background: '#ef4444', color: 'white', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer', opacity: isDeleting ? 0.6 : 1 }}
          >
            {isDeleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { submissions, loading, deleteMySubmission } = useSeller();

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, title}
  const [isDeleting, setIsDeleting]     = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
  };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  /* Real-time filter: status + search */
  const filtered = submissions.filter(s => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.propertyTitle || '').toLowerCase().includes(q) ||
      (s.location || '').toLowerCase().includes(q) ||
      (s.propertyType || '').toLowerCase().includes(q) ||
      (s.sellerName || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMySubmission(deleteTarget.id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className={styles.dashboardWrapper}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
      </header>
      <div>
        {/* Confirm Modal */}
        <AnimatePresence>
          {deleteTarget && (
            <ConfirmModal
              title={deleteTarget.title}
              onConfirm={handleDelete}
              onCancel={() => setDeleteTarget(null)}
              isDeleting={isDeleting}
            />
          )}
        </AnimatePresence>

        {/* ── Stats row ── */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}><Home size={20} /></div>
            <div className={styles.statInfo}>
              <label>Properties Submitted</label>
              {loading ? <Skeleton width={40} /> : <span>{submissions.length}</span>}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}><Clock size={20} /></div>
            <div className={styles.statInfo}>
              <label>Pending Approval</label>
              {loading ? <Skeleton width={40} /> : <span>{submissions.filter(s => s.status === 'pending').length}</span>}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}><CheckCircle2 size={20} /></div>
            <div className={styles.statInfo}>
              <label>Approved Listings</label>
              {loading ? <Skeleton width={40} /> : <span>{submissions.filter(s => s.status === 'approved').length}</span>}
            </div>
          </div>
        </div>

        {/* ── Main card ── */}
        <div className={styles.mainCard}>

          {/* Tab header + filters */}
          <div className={styles.tabsRow} style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem 1rem', fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
              My Properties
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
              {/* Search bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', border: '1px solid var(--stroke)', borderRadius: 30, padding: '0.5rem 1.2rem' }}>
                <Search size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search properties…"
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', color: 'var(--text-main)', width: 170 }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className={styles.filterRow}>
                <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`${styles.filterPill} ${statusFilter === f.key ? styles.filterPillActive : ''}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={styles.content}>
            <AnimatePresence mode="wait">
              {loading ? (
                <div className={styles.agreementsGrid}>
                  {[1, 2, 3].map(n => (
                    <div key={n} className={styles.agreementCard} style={{ opacity: 0.6 }}>
                      <div className={styles.cardHeader}>
                        <Skeleton circle height={40} width={40} />
                        <div style={{ flex: 1, marginLeft: '1rem' }}>
                          <Skeleton width="60%" height={20} />
                          <Skeleton width="40%" height={14} style={{ marginTop: 4 }} />
                        </div>
                      </div>
                      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--stroke)', paddingTop: '1rem' }}>
                        <Skeleton height={32} borderRadius={8} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  key={`${statusFilter}-${search}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={styles.agreementsGrid}
                >
                  {filtered.length > 0 && filtered.map(sub => (
                    <motion.div key={sub.id} variants={itemVariants} layout className={styles.agreementCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.iconWrapper} style={{
                          background: sub.status === 'approved' ? 'rgba(16, 185, 129, 0.12)' : sub.status === 'rejected' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color:      sub.status === 'approved' ? '#10b981' : sub.status === 'rejected' ? '#ef4444' : '#f59e0b'
                        }}>
                          {sub.status === 'approved' ? <CheckCircle2 /> : <Clock />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.propertyTitle || 'Unnamed Property'}</h3>
                          <span className={styles.dateLabel}>
                            <Calendar size={13} style={{ marginRight: 4 }} />
                            {sub.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                          </span>
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                          background: sub.status === 'approved' ? 'rgba(16, 185, 129, 0.12)' : sub.status === 'rejected' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color:      sub.status === 'approved' ? '#10b981' : sub.status === 'rejected' ? '#ef4444' : '#f59e0b',
                          textTransform: 'uppercase'
                        }}>
                          {sub.status}
                        </span>
                      </div>

                      {/* Footer: download + delete */}
                      <div className={styles.cardFooter} style={{ borderTop: '1px solid var(--stroke)', paddingTop: '0.85rem', marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {sub.status === 'approved' ? (
                          <button
                            onClick={async () => {
                              const { generateAgreementPDF } = await import('../../utils/generateAgreementPDF');
                              await generateAgreementPDF(sub, sub.adminSignature, true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3b82f6', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '0.85rem' }}
                          >
                            <Download size={15} /> Download Agreement
                          </button>
                        ) : <div />}

                        <button
                          onClick={() => setDeleteTarget({ id: sub.id, title: sub.propertyTitle || 'Unnamed Property' })}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.35rem 0.85rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'Outfit, sans-serif' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {filtered.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.empty}>
                      <Home size={48} color="var(--stroke)" style={{ marginBottom: '1rem' }} />
                      <p style={{ color: 'var(--text-muted)' }}>
                        {search
                          ? `No properties match "${search}".`
                          : statusFilter === 'all'
                            ? "You haven't listed any properties yet."
                            : `No ${statusFilter} properties found.`}
                      </p>
                      {!search && statusFilter === 'all' && (
                        <button
                          onClick={() => navigate('/agreements/list')}
                          style={{ marginTop: '1rem', background: '#ed1b24', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          List Your First Property
                        </button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
