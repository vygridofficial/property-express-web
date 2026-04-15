import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, CheckCircle2, XCircle, Clock, MapPin, Building,
  Calendar, Phone, Mail, User, Image as ImageIcon,
  DollarSign, Maximize2, ChevronLeft, ArrowUpRight,
  RefreshCw, Search, Trash2, AlertTriangle, X
} from 'lucide-react';
import { getAllSubmissions, deleteSubmission } from '../../services/submissionService';

const STATUS = {
  approved: { label: 'Accepted', icon: CheckCircle2, color: '#10b981', badge: 'rgba(16,185,129,0.15)', text: '#10b981' },
  rejected: { label: 'Rejected', icon: XCircle,      color: '#ef4444', badge: 'rgba(239,68,68,0.15)',  text: '#ef4444' },
  pending:  { label: 'Pending',  icon: Clock,         color: '#f59e0b', badge: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
};

const glassCard = {
  background: 'var(--admin-glass-bg)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--admin-glass-border)',
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
};

/* ── Confirm Delete Modal ── */
function ConfirmModal({ title, onConfirm, onCancel, isDeleting }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ background: 'var(--admin-glass-solid)', border: '1px solid var(--admin-glass-border)', borderRadius: 20, padding: '2rem', maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
      >
        <div style={{ width: 52, height: 52, background: 'rgba(239,68,68,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <AlertTriangle size={26} color="#ef4444" />
        </div>
        <h3 style={{ textAlign: 'center', margin: '0 0 0.5rem', fontSize: '1.15rem', color: 'var(--admin-text-main)' }}>Delete Property?</h3>
        <p style={{ textAlign: 'center', color: 'var(--admin-text-muted)', margin: '0 0 1.75rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
          Are you sure you want to permanently delete <strong style={{ color: 'var(--admin-text-main)' }}>"{title}"</strong>? This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '0.85rem', background: 'var(--admin-glass-bg)', border: '1px solid var(--admin-glass-border)', color: 'var(--admin-text-muted)', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting} style={{ flex: 1, padding: '0.85rem', background: '#ef4444', color: 'white', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer', opacity: isDeleting ? 0.6 : 1, fontFamily: 'Outfit, sans-serif' }}>
            {isDeleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--admin-stroke)', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <Icon size={15} />
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--admin-text-main)' }}>{value}</div>
      </div>
    </div>
  );
}

export default function SellersHistory() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting]   = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try { setSubmissions(await getAllSubmissions()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSubmission(deleteTarget.id);
      setSubmissions(prev => prev.filter(s => s.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* Real-time search + status filter */
  const filtered = submissions.filter(s => {
    const matchStatus = filter === 'all' || (filter === 'accepted' ? s.status === 'approved' : s.status === 'rejected');
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.propertyTitle  || '').toLowerCase().includes(q) ||
      (s.sellerName     || '').toLowerCase().includes(q) ||
      (s.location       || '').toLowerCase().includes(q) ||
      (s.propertyType   || '').toLowerCase().includes(q) ||
      (s.sellerEmail    || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (loading) return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: 78, ...glassCard, marginBottom: '0.75rem' }} />)}
    </div>
  );

  /* ── Detail view ── */
  if (selected) {
    const cfg = STATUS[selected.status] || STATUS.pending;
    return (
      <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        <AnimatePresence>
          {deleteTarget && <ConfirmModal title={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting} />}
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button onClick={() => setSelected(null)} style={{ background: 'var(--admin-glass-bg)', border: '1px solid var(--admin-glass-border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--admin-text-main)', flexShrink: 0 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--admin-text-main)', margin: 0 }}>
              {selected.propertyTitle || 'Unnamed Property'}
            </h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, padding: '3px 12px', borderRadius: 20, background: cfg.badge, color: cfg.text, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <cfg.icon size={12} /> {cfg.label}
            </span>
          </div>
          <button
            onClick={() => setDeleteTarget({ id: selected.id, title: selected.propertyTitle || 'Unnamed Property' })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Property Details */}
          <div style={{ ...glassCard, padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '1.05rem' }}>🏠 Property Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
              <DetailRow icon={Building}   label="Type"          value={selected.propertyType} />
              <DetailRow icon={MapPin}     label="Location"      value={selected.location} />
              <DetailRow icon={DollarSign} label="Price"         value={selected.price ? `₹ ${Number(selected.price).toLocaleString('en-IN')}` : null} />
              <DetailRow icon={Maximize2}  label="Area"          value={selected.area ? `${selected.area} sq.ft` : null} />
              <DetailRow icon={Building}   label="Configuration" value={selected.configuration} />
              <DetailRow icon={Calendar}   label="Submitted"     value={selected.createdAt?.toDate?.().toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            </div>
            {selected.address && <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--admin-stroke)' }}><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Full Address</div><p style={{ margin: 0, color: 'var(--admin-text-body)', lineHeight: 1.6 }}>{selected.address}</p></div>}
            {selected.description && <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--admin-stroke)' }}><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Description</div><p style={{ margin: 0, color: 'var(--admin-text-body)', lineHeight: 1.7 }}>{selected.description}</p></div>}
          </div>

          {selected.images?.length > 0 && (
            <div style={{ ...glassCard, padding: '2rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ImageIcon size={18} /> Property Images ({selected.images.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                {selected.images.map((url, i) => <img key={i} src={url} alt={`img-${i}`} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--admin-glass-border)' }} />)}
              </div>
            </div>
          )}

          <div style={{ ...glassCard, padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '1.05rem' }}>👤 Seller Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
              <DetailRow icon={User}  label="Name"  value={selected.sellerName} />
              <DetailRow icon={Mail}  label="Email" value={selected.sellerEmail} />
              <DetailRow icon={Phone} label="Phone" value={selected.sellerPhone || selected.phone} />
            </div>
          </div>

          <div style={{ ...glassCard, padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '1.05rem' }}>🕐 Submission Timeline</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
              <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Submitted At</div><div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>{selected.createdAt?.toDate?.().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) || 'Unknown'}</div></div>
              {selected.updatedAt && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Last Updated</div><div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>{selected.updatedAt?.toDate?.().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div></div>}
              <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Status</div><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 14px', borderRadius: 20, background: cfg.badge, color: cfg.text, fontSize: '0.82rem', fontWeight: 700 }}><cfg.icon size={13} /> {cfg.label}</span></div>
            </div>
            {selected.status === 'rejected' && selected.rejectionReason && <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.1)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.25)' }}><div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Rejection Reason</div><p style={{ margin: 0, color: 'var(--admin-text-body)', lineHeight: 1.6 }}>{selected.rejectionReason}</p></div>}
            {selected.sellerSignature && typeof selected.sellerSignature === 'string' && selected.sellerSignature.startsWith('data:') && <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--admin-stroke)' }}><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Seller Signature</div><img src={selected.sellerSignature} alt="Seller Signature" style={{ height: 80, border: '1px solid var(--admin-glass-border)', borderRadius: 10, background: 'white', padding: 8 }} /></div>}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>

      <AnimatePresence>
        {deleteTarget && <ConfirmModal title={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting} />}
      </AnimatePresence>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(237,27,36,0.12)', color: '#ed1b24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={22} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--admin-text-main)', margin: 0 }}>Sellers History</h1>
          </div>
          <p style={{ color: 'var(--admin-text-muted)', margin: 0, marginLeft: 58 }}>All property submissions from the Seller Portal.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--admin-glass-bg)', border: '1px solid var(--admin-glass-border)', borderRadius: 30, padding: '0.5rem 1.2rem' }}>
            <Search size={15} color="var(--admin-text-muted)" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, location…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', color: 'var(--admin-text-main)', width: 190, fontFamily: 'Outfit, sans-serif' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)', display: 'flex', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--admin-glass-bg)', border: '1px solid var(--admin-glass-border)', borderRadius: 12, padding: '0.3rem' }}>
            {[
              { key: 'all',      label: `All (${submissions.length})` },
              { key: 'accepted', label: `Accepted (${submissions.filter(s => s.status === 'approved').length})` },
              { key: 'rejected', label: `Rejected (${submissions.filter(s => s.status === 'rejected').length})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '0.42rem 1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', border: 'none', background: filter === f.key ? '#ed1b24' : 'transparent', color: filter === f.key ? 'white' : 'var(--admin-text-muted)', boxShadow: filter === f.key ? '0 3px 10px rgba(237,27,36,0.28)' : 'none', transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif' }}>
                {f.label}
              </button>
            ))}
          </div>

          <button onClick={fetchAll} title="Refresh" style={{ background: 'var(--admin-glass-bg)', border: '1px solid var(--admin-glass-border)', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--admin-text-muted)' }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Results count */}
      {search && (
        <p style={{ color: 'var(--admin-text-muted)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for <strong style={{ color: 'var(--admin-text-main)' }}>"{search}"</strong>
        </p>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', ...glassCard, border: '1px dashed var(--admin-glass-border)' }}>
          <History size={48} color="var(--admin-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.35 }} />
          <h3 style={{ color: 'var(--admin-text-main)' }}>{search ? `No results for "${search}"` : 'No submissions found'}</h3>
          <p style={{ color: 'var(--admin-text-muted)' }}>{search ? 'Try a different search term.' : `No ${filter === 'all' ? '' : filter} submissions yet.`}</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((sub, idx) => {
            const s = STATUS[sub.status] || STATUS.pending;
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                style={{ ...glassCard, padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                {/* Status icon */}
                <div onClick={() => setSelected(sub)} style={{ width: 42, height: 42, borderRadius: 13, background: s.badge, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                  <s.icon size={19} />
                </div>

                {/* Info */}
                <div onClick={() => setSelected(sub)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '0.98rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                    {sub.propertyTitle || 'Unnamed Property'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {sub.sellerName && <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><User size={11} /> {sub.sellerName}</span>}
                    {sub.location   && <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> {sub.location}</span>}
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={11} /> {sub.createdAt?.toDate?.().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Recent'}</span>
                  </div>
                </div>

                {/* Price */}
                {sub.price && <div style={{ fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '0.93rem', flexShrink: 0 }}>₹ {Number(sub.price).toLocaleString('en-IN')}</div>}

                {/* Status badge */}
                <span style={{ padding: '3px 11px', borderRadius: 20, background: s.badge, color: s.text, fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>{s.label}</span>

                {/* View arrow */}
                <ArrowUpRight size={15} color="var(--admin-text-muted)" style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => setSelected(sub)} />

                {/* Delete */}
                <button
                  onClick={() => setDeleteTarget({ id: sub.id, title: sub.propertyTitle || 'Unnamed Property' })}
                  title="Delete"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
