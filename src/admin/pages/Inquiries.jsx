import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, X, MessageSquare, Trash2, Phone, Mail } from 'lucide-react';
import { getAllInquiries, updateInquiry, deleteInquiry } from '../../services/inquiryService';
import { useAdmin } from '../context/AdminContext';
import styles from '../styles/admin.module.css';

export default function Inquiries() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const expandedIdParam = queryParams.get('expanded');

  // Issue 7: siteSettings needed for WhatsApp/Email reply templates
  const { siteSettings } = useAdmin();

  const [inquiries, setInquiries] = useState([]);
  const [expandedRow, setExpandedRow] = useState(expandedIdParam);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const data = await getAllInquiries();
      setInquiries(data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const markResponded = async (id) => {
    try {
      await updateInquiry(id, { status: 'responded' });
      setInquiries(inqs => inqs.map(inq => inq.id === id ? { ...inq, status: 'responded' } : inq));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const markClosed = async (id) => {
    try {
      await updateInquiry(id, { status: 'closed' });
      setInquiries(inqs => inqs.map(inq => inq.id === id ? { ...inq, status: 'closed' } : inq));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await deleteInquiry(id);
      setInquiries(inqs => inqs.filter(inq => inq.id !== id));
    } catch (error) {
      console.error('Error deleting inquiry:', error);
    }
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'new') return { background: 'rgba(237,27,36,0.1)', color: '#ed1b24' };
    if (s === 'responded') return { background: 'rgba(46,204,113,0.1)', color: '#2ecc71' };
    if (s === 'closed') return { background: 'rgba(85,85,85,0.1)', color: '#888' };
    return { background: 'rgba(0,0,0,0.05)', color: '#888' };
  };

  const filteredInqs = inquiries.filter(inq => {
    const term = searchTerm.toLowerCase();
    const name = inq.name || '';
    const phone = inq.phone || '';
    const prop = inq.propertyTitle || inq.property || '';
    const msg = inq.message || '';
    const cat = inq.category || '';

    const matchSearch = name.toLowerCase().includes(term) || phone.includes(term) || prop.toLowerCase().includes(term) || msg.toLowerCase().includes(term);
    const matchStatus = statusFilter === 'All' || inq.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchCategory = categoryFilter === 'All' || cat.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchSearch && matchStatus && matchCategory;
  });

  // Issue 7: Build WhatsApp & Email links with contact data from Firebase siteSettings
  const buildWhatsAppUrl = (inq) => {
    const phone = (inq.phone || '').replace(/[^0-9]/g, '');
    const companyName = siteSettings?.siteName || 'Property Express';
    const message = encodeURIComponent(
      `Hello ${inq.name},\n\nThis is ${companyName} regarding your enquiry about "${inq.propertyTitle || inq.property}".\n\nWe'd love to connect with you and discuss your requirements.`
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  const buildEmailUrl = (inq) => {
    const companyName = siteSettings?.siteName || 'Property Express';
    const subject = encodeURIComponent(`Re: Your Enquiry at ${companyName}`);
    const body = encodeURIComponent(
      `Hello ${inq.name},\n\nThank you for reaching out to ${companyName} regarding "${inq.propertyTitle || inq.property}".\n\nWe'd be happy to assist you further.\n\nBest regards,\n${companyName} Team`
    );
    return `mailto:${inq.email || ''}?subject=${subject}&body=${body}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Top Bar Actions */}
      <div className={styles.glassCard} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          <input
            type="text" placeholder="Search enquiries..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
          {searchTerm && <X size={16} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--admin-text-muted)' }} />}
        </div>

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600, fontFamily: 'Outfit, sans-serif', color: 'var(--admin-text-main)' }}>
          <option value="All">Category: All</option>
          <option value="Apartment">Apartments</option>
          <option value="Villa">Villas</option>
          <option value="Plot">Plots</option>
          <option value="Commercial">Commercial</option>
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600, fontFamily: 'Outfit, sans-serif', color: 'var(--admin-text-main)' }}>
          <option value="All">Status: All</option>
          <option value="new">New</option>
          <option value="responded">Responded</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Main Table / Mobile Cards Card */}
      <div className={styles.glassCard} style={{ padding: isMobile ? '0.75rem' : '1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...Array(4)].map((_, idx) => <div key={idx} style={{ height: 60, borderRadius: 12, background: 'rgba(0,0,0,0.06)' }} />)}
          </div>
        ) : filteredInqs.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontWeight: 300 }}>
            <MessageSquare size={48} opacity={0.2} style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
            <p>No enquiries match your filters.</p>
          </div>
        ) : isMobile ? (
          /* Mobile Card View (Pill Cards) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredInqs.map((inq) => {
              const isExpanded = expandedRow === inq.id;
              return (
                <motion.div
                  key={inq.id}
                  layout
                  onClick={() => setExpandedRow(isExpanded ? null : inq.id)}
                  style={{
                    background: 'var(--admin-glass-bg)',
                    border: '1px solid var(--admin-glass-border)',
                    borderRadius: isExpanded ? 24 : 40,
                    padding: isExpanded ? '1.25rem' : '0.85rem 1.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    overflow: 'hidden',
                    borderLeft: inq.status?.toLowerCase() === 'new' ? '4px solid #ed1b24' : '1px solid var(--admin-glass-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inq.name}</h4>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 500 }}>{inq.phone}</p>
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: '0.5rem', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ marginTop: '1.25rem', borderTop: '1px solid var(--admin-stroke)', paddingTop: '1.25rem' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Property Enquiry For</span>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', fontWeight: 600 }}>{inq.propertyTitle || inq.property}</p>
                          </div>
                          
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Client Message</span>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', lineHeight: 1.6, background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: 12 }}>"{inq.message || 'No message provided.'}"</p>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                             <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Status</span>
                                <div style={{ marginTop: '0.25rem' }} onClick={e => e.stopPropagation()}>
                                  <select
                                    value={inq.status}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === 'responded') markResponded(inq.id);
                                      else if (val === 'closed') markClosed(inq.id);
                                      else updateInquiry(inq.id, { status: val });
                                    }}
                                    style={{
                                      padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.75rem',
                                      fontWeight: 700, textTransform: 'uppercase', border: 'none', outline: 'none', cursor: 'pointer', appearance: 'none',
                                      ...getStatusStyle(inq.status)
                                    }}
                                  >
                                    <option value="new">New</option>
                                    <option value="responded">Responded</option>
                                    <option value="closed">Closed</option>
                                  </select>
                                </div>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Received On</span>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString() : inq.date}</p>
                             </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {inq.phone && (
                                <a
                                  href={buildWhatsAppUrl(inq)}
                                  target="_blank" rel="noopener noreferrer"
                                  onClick={(e) => { e.stopPropagation(); markResponded(inq.id); }}
                                  style={{
                                    flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    padding: '0.75rem', background: '#25D366', color: 'white',
                                    borderRadius: 12, fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none'
                                  }}
                                >
                                  <Phone size={14} /> WhatsApp
                                </a>
                              )}
                              {inq.email && (
                                <a
                                  href={buildEmailUrl(inq)}
                                  onClick={(e) => { e.stopPropagation(); markResponded(inq.id); }}
                                  style={{
                                    flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    padding: '0.75rem', background: '#18181a', color: 'white',
                                    borderRadius: 12, fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none'
                                  }}
                                >
                                  <Mail size={14} /> Email
                                </a>
                              )}
                            </div>
                            <button 
                              className="btn" 
                              style={{ width: '100%', border: '1px solid var(--admin-stroke)', color: '#ed1b24', background: 'transparent', padding: '0.75rem', borderRadius: 12, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                              onClick={(e) => { e.stopPropagation(); handleDelete(inq.id); }}
                            >
                              <Trash2 size={16} /> Delete Inquiry
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <motion.table
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden" animate="show"
              style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-stroke)' }}>
                  {['Name', 'Phone', 'Property', 'Category', 'Date', 'Status', ''].map((h, idx) => (
                    <th key={`th-${idx}`} style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInqs.map((inq, i) => (
                  <React.Fragment key={inq.id}>
                    <motion.tr
                      variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                      onClick={() => setExpandedRow(expandedRow === inq.id ? null : inq.id)}
                      style={{
                        borderBottom: expandedRow === inq.id ? 'none' : '1px solid var(--admin-stroke)',
                        background: expandedRow === inq.id ? 'rgba(0,0,0,0.04)' : (i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'),
                        borderLeft: inq.status?.toLowerCase() === 'new' ? '3px solid #ed1b24' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-main)' }}>{inq.name}</td>
                      <td style={{ padding: '1rem', fontWeight: 400, fontVariantNumeric: 'tabular-nums', color: 'var(--admin-text-body)' }}>{inq.phone}</td>
                      <td style={{ padding: '1rem', fontWeight: 400, color: 'var(--admin-text-body)' }}>{inq.propertyTitle || inq.property}</td>
                      <td style={{ padding: '1rem', fontWeight: 300, color: 'var(--admin-text-muted)' }}>{inq.category}</td>
                      <td style={{ padding: '1rem', fontWeight: 300, color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString() : inq.date}
                      </td>
                      <td style={{ padding: '1rem' }} onClick={e => e.stopPropagation()}>
                        <select
                          value={inq.status}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'responded') markResponded(inq.id);
                            else if (val === 'closed') markClosed(inq.id);
                            else updateInquiry(inq.id, { status: val });
                          }}
                          style={{
                            padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.75rem',
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                            border: 'none', outline: 'none', cursor: 'pointer', appearance: 'none',
                            fontFamily: 'Outfit, sans-serif',
                            ...getStatusStyle(inq.status)
                          }}
                        >
                          <option value="new">New</option>
                          <option value="responded">Responded</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(inq.id); }} className={styles.iconBtn}>
                            <Trash2 size={16} />
                          </button>
                          <button className={styles.iconBtn}>
                            {expandedRow === inq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Expandable row with message + Reply buttons */}
                    {expandedRow === inq.id && (
                      <tr
                        style={{
                          background: 'rgba(0,0,0,0.02)',
                          borderLeft: inq.status?.toLowerCase() === 'new' ? '3px solid #ed1b24' : '3px solid transparent',
                        }}
                      >
                          <td colSpan="7" style={{ padding: 0, borderBottom: '1px solid var(--admin-stroke)' }}>
                            <div style={{ padding: '1.5rem 2rem 2rem' }}>
                              {/* Message */}
                              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
                                Message
                              </h4>
                              <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--admin-text-body)', background: 'rgba(255,255,255,0.4)', padding: '1.25rem', borderRadius: 10, border: '1px solid var(--admin-stroke)', marginBottom: '1.5rem' }}>
                                "{inq.message || 'No message provided.'}"
                              </p>

                              {/* Issue 7: WhatsApp & Email reply buttons */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                                {/* WhatsApp button — uses phone number from enquiry */}
                                {inq.phone && (
                                  <a
                                    href={buildWhatsAppUrl(inq)}
                                    target="_blank" rel="noopener noreferrer"
                                    onClick={() => markResponded(inq.id)}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                      padding: '0.7rem 1.5rem', background: '#25D366', color: 'white',
                                      borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
                                      textDecoration: 'none', border: 'none', cursor: 'pointer',
                                      fontFamily: 'Outfit, sans-serif',
                                    }}
                                  >
                                    <Phone size={16} />
                                    Reply on WhatsApp
                                  </a>
                                )}

                                {/* Email button — uses email from enquiry */}
                                {inq.email && (
                                  <a
                                    href={buildEmailUrl(inq)}
                                    onClick={() => markResponded(inq.id)}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                      padding: '0.7rem 1.5rem', background: '#18181a', color: 'white',
                                      borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
                                      textDecoration: 'none', border: 'none', cursor: 'pointer',
                                      fontFamily: 'Outfit, sans-serif',
                                    }}
                                  >
                                    <Mail size={16} />
                                    Reply via Email
                                  </a>
                                )}

                                {/* If no contact info available */}
                                {!inq.phone && !inq.email && (
                                  <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                                    No contact info available to reply.
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </motion.table>
          </div>
        )}
      </div>
    </div>
  );
}
