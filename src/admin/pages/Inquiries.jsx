import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronUp, X, MessageSquare, Trash2 } from 'lucide-react';
import { getAllInquiries, updateInquiry, deleteInquiry } from '../../services/inquiryService';
import styles from '../styles/admin.module.css';

export default function Inquiries() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const expandedIdParam = queryParams.get('expanded');

  const [inquiries, setInquiries] = useState([]);
  const [expandedRow, setExpandedRow] = useState(expandedIdParam);
  const [loading, setLoading] = useState(true);

  // Filters
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
    switch(s) {
      case 'new': return { background: 'rgba(24,24,26,0.1)', color: '#18181a' };
      case 'responded': return { background: 'rgba(46,204,113,0.1)', color: '#2ecc71' };
      case 'closed': return { background: 'rgba(85,85,85,0.1)', color: '#555555' };
      default: return { background: 'rgba(0,0,0,0.05)', color: '#888' };
    }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Bar Actions */}
      <div className={styles.glassCard} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          <input 
            type="text" placeholder="Search enquiries..." 
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }} 
          />
          {searchTerm && <X size={16} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--admin-text-muted)' }} />}
        </div>
        
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600 }}>
          <option value="All">Category: All</option>
          <option value="Flat">Flats</option>
          <option value="Plot">Plots</option>
          <option value="Warehouse">Warehouses</option>
          <option value="Villa">Villas</option>
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600 }}>
          <option value="All">Status: All</option>
          <option value="New">New</option>
          <option value="Responded">Responded</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Main Table Card */}
      <div className={styles.glassCard}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...Array(4)].map((_, idx) => <div key={idx} style={{ height: 60, borderRadius: 12, background: 'rgba(0,0,0,0.06)', animation: 'shimmer 2s infinite' }} />)}
          </div>
        ) : filteredInqs.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontWeight: 300 }}>
            <MessageSquare size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
            <p>No enquiries match your filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <motion.table variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-stroke)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Name</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Phone</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Property</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Category</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Date</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}></th>
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
                        background: expandedRow === inq.id ? 'rgba(0,0,0,0.04)' : (i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'),
                        borderLeft: inq.status === 'New' ? '2px solid #ed1b24' : '2px solid transparent', // Highlight unread
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{inq.name}</td>
                      <td style={{ padding: '1rem', fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>{inq.phone}</td>
                      <td style={{ padding: '1rem', fontWeight: 400 }}>{inq.propertyTitle || inq.property}</td>
                      <td style={{ padding: '1rem', fontWeight: 300, color: 'var(--admin-text-muted)' }}>{inq.category}</td>
                      <td style={{ padding: '1rem', fontWeight: 300, color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString() : inq.date}
                      </td>
                      <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                        <select 
                          value={inq.status} 
                          onChange={(e) => {
                            if (e.target.value === 'responded') markResponded(inq.id);
                            else if (e.target.value === 'closed') markClosed(inq.id);
                            else updateInquiry(inq.id, { status: e.target.value });
                          }}
                          style={{
                            padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', 
                            letterSpacing: '0.05em', border: 'none', outline: 'none', cursor: 'pointer', appearance: 'none',
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
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(inq.id); }} className={styles.iconBtn} style={{ color: 'var(--admin-text-muted)' }}>
                            <Trash2 size={16} />
                          </button>
                          <button className={styles.iconBtn}>
                            {expandedRow === inq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    {/* Expandable row */}
                    <AnimatePresence>
                      {expandedRow === inq.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ background: 'rgba(0,0,0,0.04)', borderLeft: inq.status === 'New' ? '2px solid #ed1b24' : '2px solid transparent' }}
                        >
                          <td colSpan="7" style={{ padding: 0, borderBottom: '1px solid var(--admin-stroke)' }}>
                            <div style={{ padding: '0 2rem 2rem 2rem' }}>
                              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem' }}>Message</h4>
                              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--admin-text-body)', background: 'rgba(255,255,255,0.4)', padding: '1.25rem', borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
                                "{inq.message}"
                              </p>
                              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button className="btn" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', background: '#25D366', color: 'white', border: 'none', fontWeight: 600 }}>Reply on WhatsApp</button>
                                <button className="btn" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', background: '#18181a', color: 'white', border: 'none', fontWeight: 600 }}>Reply via Email</button>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
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
