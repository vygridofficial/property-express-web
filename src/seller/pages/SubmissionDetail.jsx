import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Building,
  DollarSign,
  Maximize2,
  Phone,
  Mail,
  User,
  Download,
  Image as ImageIcon,
  FileSignature
} from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import styles from '../styles/Dashboard.module.css';
import Skeleton from 'react-loading-skeleton';

const statusConfig = {
  pending:  { icon: Clock,         label: 'Pending Review',  bg: '#fff7ed', color: '#f59e0b', badge: '#fef3c7', text: '#92400e' },
  approved: { icon: CheckCircle2,  label: 'Approved',        bg: '#ecfdf5', color: '#10b981', badge: '#d1fae5', text: '#065f46' },
  rejected: { icon: XCircle,       label: 'Rejected',        bg: '#fef2f2', color: '#ef4444', badge: '#fee2e2', text: '#b91c1c' },
};

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(237,27,36,0.06)', color: '#ed1b24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <Icon size={16} />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{value}</div>
      </div>
    </div>
  );
}

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { submissions, loading } = useSeller();

  const sub = submissions.find(s => s.id === id);

  if (!loading && !sub) {
    return (
      <div className={styles.dashboardWrapper}>
        <div className={styles.empty} style={{ paddingTop: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Submission not found.</p>
          <button onClick={() => navigate('/agreements/signed')} style={{ marginTop: '1rem', background: '#ed1b24', color: 'white', padding: '0.75rem 1.5rem', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Back to History
          </button>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[sub?.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className={styles.dashboardWrapper}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => navigate('/agreements/signed')} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'white', border: '1px solid #e2e8f0', 
              padding: '8px 16px', borderRadius: '12px', cursor: 'pointer',
              color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <ChevronLeft size={18} />
            Back to History
          </button>
        </div>
        {loading ? <Skeleton height={40} width={250} /> : <h1>Submission Detail</h1>}
      </header>

      {loading ? (
        <div style={{ background: 'white', borderRadius: 20, padding: '2rem' }}>
          <Skeleton count={8} height={25} style={{ marginBottom: '1rem' }} />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Property Details Card */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-main)', fontSize: '1.25rem' }}>Property Details</h3>
              <span style={{ 
                display: 'inline-flex', alignItems: 'center', gap: 6, 
                padding: '6px 14px', borderRadius: 20, 
                background: cfg.badge, color: cfg.text, 
                fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' 
              }}>
                <StatusIcon size={14} /> {cfg.label}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <DetailRow icon={Building} label="Property Type" value={sub.propertyType} />
              <DetailRow icon={MapPin} label="Location" value={sub.location} />
              <DetailRow icon={DollarSign} label="Expected Price" value={sub.price ? `₹ ${Number(sub.price).toLocaleString('en-IN')}` : null} />
              <DetailRow icon={Maximize2} label="Area" value={sub.area ? `${sub.area} sq.ft` : null} />
              <DetailRow icon={Calendar} label="Submitted On" value={sub.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <DetailRow icon={Building} label="Configuration" value={sub.configuration} />
            </div>

            {sub.address && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Full Address</div>
                <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.6, fontSize: '1rem' }}>{sub.address}</p>
              </div>
            )}

            {sub.description && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Description</div>
                <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.7, fontSize: '1rem' }}>{sub.description}</p>
              </div>
            )}
          </div>

          {/* Seller Info Card */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '1.25rem' }}>Seller Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <DetailRow icon={User} label="Name" value={sub.sellerName} />
              <DetailRow icon={Mail} label="Email" value={sub.sellerEmail} />
              <DetailRow icon={Phone} label="Phone" value={sub.sellerPhone || sub.phone} />
            </div>
          </div>

          {/* Images Card */}
          {sub.images && sub.images.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 1.5rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={20} /> Property Photos
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {sub.images.map((url, i) => (
                  <img key={i} src={url} alt={`Property ${i + 1}`} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' }} />
                ))}
              </div>
            </div>
          )}

          {/* Signature + Actions */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileSignature size={20} /> Signature & Actions
            </h3>
            {sub.sellerSignature && typeof sub.sellerSignature === 'string' && sub.sellerSignature.startsWith('data:') && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Your Signature</div>
                <div style={{ display: 'inline-block', border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc', padding: '16px' }}>
                  <img src={sub.sellerSignature} alt="Seller Signature" style={{ height: 80, display: 'block' }} />
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {sub.status === 'approved' && (
                <button
                  onClick={async () => {
                    const { generateAgreementPDF } = await import('../../utils/generateAgreementPDF');
                    await generateAgreementPDF(sub, sub.adminSignature, true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: '#3b82f6', color: 'white', padding: '1rem 2rem', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', boxShadow: '0 8px 24px rgba(59,130,246,0.25)' }}
                >
                  <Download size={20} /> Download Agreement PDF
                </button>
              )}
              
              {sub.status === 'rejected' && sub.rejectionReason && (
                <div style={{ flex: 1, padding: '1.5rem', background: '#fef2f2', borderRadius: 16, border: '1px solid #fecaca' }}>
                  <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <XCircle size={20} /> Rejection Reason
                  </div>
                  <p style={{ margin: 0, color: '#7f1d1d', lineHeight: 1.6, fontSize: '1rem', fontWeight: 500 }}>{sub.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
