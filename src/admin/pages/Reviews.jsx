import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, X, Search, MessageSquare, Trash2 } from 'lucide-react';
import { getAllReviews, updateReview, deleteReview } from '../../services/reviewService';
import styles from '../styles/admin.module.css';

export default function Reviews() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const filterParam = queryParams.get('filter');

  const { reviews, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState(filterParam ? filterParam.charAt(0).toUpperCase() + filterParam.slice(1) : 'Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');

  const updateStatus = async (id, newStatus) => {
    try {
      await updateReview(id, { status: newStatus });
    } catch (error) {
      console.error('Error updating review status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(id);
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const term = searchTerm.toLowerCase();
    const name = r.name || '';
    const text = r.text || '';
    const matchSearch = name.toLowerCase().includes(term) || text.toLowerCase().includes(term);
    const matchTab = r.status === activeTab;
    
    let matchRating = true;
    if (ratingFilter === '5') matchRating = r.rating === 5;
    if (ratingFilter === '4') matchRating = r.rating === 4;
    if (ratingFilter === '3') matchRating = r.rating <= 3;

    return matchSearch && matchTab && matchRating;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', overflowX: 'hidden', boxSizing: 'border-box', padding: '0 16px', width: '100%' }}>
      
      {/* Filters Bar */}
      <div className={styles.glassCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box', minWidth: 0 }}>

        {/* Tabs Row — full width, wraps on mobile */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.4)', padding: '0.25rem', borderRadius: 40, border: '1px solid var(--admin-stroke)', overflowX: 'auto', flexShrink: 0, width: '100%', boxSizing: 'border-box', scrollbarWidth: 'none', minWidth: 0 }}>
          {['Pending', 'Approved', 'Rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setLoading(true); }}
              style={{
                flex: 1, whiteSpace: 'nowrap', padding: '0.6rem 1.25rem', borderRadius: 30, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s ease',
                background: activeTab === tab ? '#18181a' : 'transparent', color: activeTab === tab ? '#fff' : 'var(--admin-text-muted)'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search + Filter Row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
          <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Search reviews..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: 40, paddingLeft: '2.5rem', paddingRight: '2rem', fontSize: '0.85rem', boxSizing: 'border-box', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontFamily: 'Outfit, sans-serif', color: 'var(--admin-text-main)' }}
            />
            {searchTerm && <X size={14} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--admin-text-muted)' }} />}
          </div>

          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
            style={{ width: '100%', height: 40, padding: '0 0.75rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600, fontSize: '0.85rem', color: 'var(--admin-text-main)', fontFamily: 'Outfit, sans-serif', boxSizing: 'border-box' }}
          >
            <option value="All">All Stars</option>
            <option value="5">⭐⭐⭐⭐⭐</option>
            <option value="4">⭐⭐⭐⭐</option>
            <option value="3">⭐⭐⭐ and below</option>
          </select>
        </div>
      </div>


      {/* Review Cards Grid */}
      <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
        <AnimatePresence mode="popLayout">
          {loading ? (
             [...Array(3)].map((_, idx) => (
                <motion.div key={`skel-${idx}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ height: 200, borderRadius: 20, background: 'rgba(0,0,0,0.06)', animation: 'shimmer 2s infinite' }} />
             ))
          ) : filteredReviews.length === 0 ? (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontWeight: 300 }}>
              <MessageSquare size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
              <p>No {activeTab.toLowerCase()} reviews found matching your criteria.</p>
            </motion.div>
          ) : (
            filteredReviews.map((review, i) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={styles.glassCard}
                style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', overflow: 'hidden', minWidth: 0 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '0.5rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.name}</h3>
                    <div style={{ display: 'flex', gap: '2px', marginTop: '0.5rem' }}>
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={14} fill={idx < review.rating ? '#18181a' : 'transparent'} color={idx < review.rating ? '#18181a' : 'var(--admin-stroke)'} />
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', flexShrink: 0 }}>
                    {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : review.date}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--admin-text-body)', fontWeight: 300, flex: 1, wordBreak: 'break-word' }}>
                  "{review.text}"
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--admin-stroke)', paddingTop: '1.5rem' }}>
                  {activeTab !== 'Approved' && (
                    <button onClick={() => updateStatus(review.id, 'Approved')} className="btn" style={{ flex: 1, minWidth: 0, background: 'transparent', border: '1px solid var(--admin-text-main)', color: 'var(--admin-text-main)', fontSize: '0.85rem', padding: '0.6rem 0.5rem' }}>
                      <Check size={14} style={{ marginRight: '0.35rem' }} /> Approve
                    </button>
                  )}
                  {activeTab !== 'Rejected' && (
                    <button onClick={() => updateStatus(review.id, 'Rejected')} className="btn" style={{ flex: 1, minWidth: 0, background: 'transparent', borderColor: '#ed1b24', color: '#ed1b24', fontSize: '0.85rem', padding: '0.6rem 0.5rem' }}>
                      <X size={14} style={{ marginRight: '0.35rem' }} /> Reject
                    </button>
                  )}
                  <button onClick={() => handleDelete(review.id)} className="btn" style={{ background: 'transparent', border: '1px solid var(--admin-stroke)', padding: '0.5rem', borderRadius: 8 }}>
                    <Trash2 size={14} color="var(--admin-text-muted)" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
