import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Clock,
  Loader2,
  FileSignature,
  FileText
} from 'lucide-react';
import { getPendingSubmissions, rejectSubmission, approveSubmission } from '../../services/submissionService';
import { generateAgreementPDF } from '../../utils/generateAgreementPDF';
import SignaturePad from '../../seller/components/SignaturePad';
import AgreementTemplateTab from '../components/AgreementTemplateTab';
import styles from '../styles/admin.module.css';

/* ── Shared card style using CSS vars ── */
const glassCard = {
  background: 'var(--admin-glass-bg)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--admin-glass-border)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
};

const infoBlock = {
  background: 'var(--admin-glass-bg)',
  border: '1px solid var(--admin-glass-border)',
  padding: '1.5rem',
  borderRadius: '14px',
};

export default function Approvals() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminSignature, setAdminSignature] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => { fetchSubmissions(); }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await getPendingSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (directAdminSignature = null) => {
    const finalSignature = directAdminSignature || adminSignature;
    setIsProcessing(true);
    try {
      if (actionType === 'reject') {
        await rejectSubmission(selectedSub.id, rejectionReason);
      } else if (actionType === 'approve') {
        if (!finalSignature) {
          alert('Admin signature is required to approve the agreement.');
          setIsProcessing(false);
          return;
        }
        await approveSubmission(selectedSub.id, finalSignature);
      }
      setSubmissions(submissions.filter(s => s.id !== selectedSub.id));
      setSelectedSub(null);
      setActionType(null);
      setAdminSignature(null);
      setRejectionReason('');
    } catch (err) {
      console.error(err);
      alert('An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDetail = () => {
    setSelectedSub(null);
    setActionType(null);
    setAdminSignature(null);
    setRejectionReason('');
  };

  if (loading) return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ height: 36, width: 250, background: 'var(--admin-stroke)', borderRadius: '8px', marginBottom: '0.5rem' }} />
      <div style={{ height: 20, width: 350, background: 'var(--admin-stroke)', borderRadius: '8px', marginBottom: '2rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,1fr) 2fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 130, ...glassCard }} />)}
        </div>
        <div style={{ height: 500, ...glassCard }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--admin-text-main)', margin: '0 0 0.25rem' }}>Pending Approvals</h1>
          <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>Review property listings submitted by sellers.</p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--admin-glass-bg)',
          border: '1px solid var(--admin-glass-border)',
          backdropFilter: 'blur(12px)',
          padding: '0.3rem',
          borderRadius: '12px',
          gap: '0.3rem'
        }}>
          {[{ key: 'list', label: 'Submissions' }, { key: 'format', label: 'Agreement Format' }].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none',
                background: activeTab === tab.key ? '#ed1b24' : 'transparent',
                color:      activeTab === tab.key ? 'white' : 'var(--admin-text-muted)',
                fontWeight: 600, cursor: 'pointer',
                boxShadow:  activeTab === tab.key ? '0 4px 12px rgba(237,27,36,0.3)' : 'none',
                transition: 'all 0.2s',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.9rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      {activeTab === 'format' ? (
        <AgreementTemplateTab />
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', ...glassCard, border: '1px dashed var(--admin-glass-border)' }}>
          <CheckCircle2 size={48} color="#10b981" style={{ marginBottom: '1rem', margin: '0 auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--admin-text-main)', marginTop: '1rem' }}>All caught up!</h3>
          <p style={{ color: 'var(--admin-text-muted)' }}>No pending property submissions.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
          gap: '2rem', alignItems: 'start'
        }}>

          {/* ── List column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
            {submissions.map(sub => (
              <motion.div
                key={sub.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => { setSelectedSub(sub); setActionType(null); }}
                style={{
                  ...glassCard,
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedSub?.id === sub.id
                    ? '0 0 0 2px #ed1b24, 0 4px 20px rgba(237,27,36,0.15)'
                    : '0 4px 12px rgba(0,0,0,0.06)',
                  background: selectedSub?.id === sub.id
                    ? 'rgba(237,27,36,0.06)'
                    : 'var(--admin-glass-bg)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--admin-text-main)' }}>
                    {sub.propertyTitle || 'Unnamed Property'}
                  </h3>
                  <span style={{
                    fontSize: '0.75rem',
                    background: selectedSub?.id === sub.id ? 'rgba(237,27,36,0.15)' : 'rgba(245,158,11,0.15)',
                    color:      selectedSub?.id === sub.id ? '#ed1b24' : '#f59e0b',
                    padding: '3px 8px', borderRadius: '10px', fontWeight: 700
                  }}>NEW</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={13} /> {sub.location}
                </p>
                <div style={{
                  marginTop: '1rem', paddingTop: '1rem',
                  borderTop: `1px solid var(--admin-glass-border)`,
                  display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem'
                }}>
                  <span style={{ color: 'var(--admin-text-muted)' }}>{sub.sellerName}</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text-main)' }}>₹{sub.price}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Detail / Actions panel ── */}
          <div style={{ minWidth: 0 }}>
            <AnimatePresence mode="wait">
              {selectedSub ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ ...glassCard, padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                >
                  {/* Back button */}
                  <button
                    onClick={resetDetail}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      background: 'var(--admin-glass-bg)', border: '1px solid var(--admin-glass-border)',
                      borderRadius: '8px', padding: '0.5rem 1rem', marginBottom: '1.25rem',
                      color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '0.875rem',
                      cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    ← Back to list
                  </button>

                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--admin-text-main)' }}>
                    {selectedSub.propertyTitle}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', color: 'var(--admin-text-muted)', fontSize: '0.88rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {selectedSub.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Building size={14} /> {selectedSub.configuration} ({selectedSub.propertyType})</span>
                    <span>Submitted: {selectedSub.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>

                  {/* Info blocks */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div style={infoBlock}>
                      <h4 style={{ margin: '0 0 1rem', color: 'var(--admin-text-main)' }}>Seller Information</h4>
                      <p style={{ margin: '0 0 0.5rem', color: 'var(--admin-text-body)' }}><strong>Name:</strong> {selectedSub.sellerName}</p>
                      <p style={{ margin: '0 0 0.5rem', color: 'var(--admin-text-body)', wordBreak: 'break-all' }}><strong>Email:</strong> {selectedSub.sellerEmail}</p>
                      <p style={{ margin: '0 0 0.5rem', color: 'var(--admin-text-body)' }}><strong>Phone:</strong> {selectedSub.sellerPhone}</p>
                    </div>
                    <div style={infoBlock}>
                      <h4 style={{ margin: '0 0 1rem', color: 'var(--admin-text-main)' }}>Property Metrics</h4>
                      <p style={{ margin: '0 0 0.5rem', color: 'var(--admin-text-body)' }}><strong>Expected Price:</strong> ₹{selectedSub.price}</p>
                      <p style={{ margin: '0 0 0.5rem', color: 'var(--admin-text-body)' }}><strong>Area:</strong> {selectedSub.area} sq.ft</p>
                      <p style={{ margin: '0 0 0.5rem', color: 'var(--admin-text-body)' }}><strong>Photos:</strong> {selectedSub.images?.length || 0}</p>
                    </div>
                  </div>

                  {/* Images */}
                  {selectedSub.images?.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ margin: '0 0 1rem', color: 'var(--admin-text-main)' }}>Uploaded Property Images</h4>
                      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {selectedSub.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`Property ${idx}`}
                            style={{ height: 130, minWidth: 190, objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--admin-glass-border)', flexShrink: 0 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signature */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ margin: '0 0 1rem', color: 'var(--admin-text-main)' }}>Seller's Signature &amp; Agreement</h4>
                    <div style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.08)', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                      {selectedSub.sellerSignature ? (
                        <>
                          {typeof selectedSub.sellerSignature === 'object' && selectedSub.sellerSignature.type === 'text' ? (
                            <div style={{ height: 80, minWidth: 150, background: 'white', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Dancing Script', cursive", fontSize: '2rem', color: '#1e293b' }}>
                              {selectedSub.sellerSignature.value}
                            </div>
                          ) : (
                            <img src={selectedSub.sellerSignature} alt="Seller Signature"
                              style={{ height: 80, minWidth: 150, objectFit: 'contain', background: 'white', padding: '10px', borderRadius: '8px' }}
                            />
                          )}
                        </>
                      ) : (
                        <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>No signature provided.</p>
                      )}
                      <div>
                        <p style={{ fontWeight: 600, color: '#10b981', margin: '0 0 0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle2 size={15} /> Terms mutually accepted
                        </p>
                        <p style={{ fontSize: '0.82rem', color: '#34d399', margin: 0 }}>This signature is legally binding for the seller.</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!actionType ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={() => setActionType('reject')}
                        style={{ flex: 1, padding: '0.9rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                      >
                        Reject Submission
                      </button>
                      <button
                        onClick={() => setActionType('approve')}
                        style={{ flex: 2, padding: '0.9rem', background: '#10b981', color: 'white', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', fontFamily: 'Outfit, sans-serif' }}
                      >
                        <FileSignature size={17} /> Counter-Sign &amp; Approve
                      </button>
                    </div>
                  ) : (
                    <div style={{ ...infoBlock }}>
                      {actionType === 'reject' ? (
                        <>
                          <h4 style={{ color: '#ef4444', marginBottom: '1rem' }}>Reject Submission</h4>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please provide a reason to the seller..."
                            rows={3}
                            style={{
                              width: '100%', padding: '1rem', borderRadius: '12px',
                              border: '1px solid var(--admin-glass-border)',
                              background: 'var(--admin-glass-bg)',
                              color: 'var(--admin-text-main)',
                              marginBottom: '1rem', fontFamily: 'Outfit, sans-serif',
                              fontSize: '0.9rem', resize: 'vertical', outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <h4 style={{ color: '#10b981', marginBottom: '1rem' }}>Admin Counter-Signature</h4>
                          <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Draw or type your signature below. Confirming it will instantly approve this property.
                          </p>
                          <SignaturePad onSave={(data) => { setAdminSignature(data); handleAction(data); }} />
                        </>
                      )}

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                        <button
                          onClick={() => { setActionType(null); setAdminSignature(null); }}
                          style={{ padding: '0.9rem 1.5rem', background: 'transparent', color: 'var(--admin-text-muted)', fontWeight: 600, border: '1px solid var(--admin-glass-border)', borderRadius: '12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                        >
                          Cancel
                        </button>
                        {actionType === 'reject' && (
                          <button
                            onClick={() => handleAction()}
                            disabled={isProcessing || !rejectionReason}
                            style={{ flex: 1, padding: '0.9rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !rejectionReason ? 0.5 : 1, fontFamily: 'Outfit, sans-serif' }}
                          >
                            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Rejection'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div style={{ ...glassCard, minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)', border: '1px dashed var(--admin-glass-border)', padding: '3rem' }}>
                  <FileText size={56} style={{ marginBottom: '1rem', opacity: 0.35 }} />
                  <p style={{ color: 'var(--admin-text-muted)' }}>Select a submission from the list to review details.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}
    </div>
  );
}
