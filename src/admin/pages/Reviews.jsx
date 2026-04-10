import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, X, Search, MessageSquare, Trash2 } from 'lucide-react';
import { updateReview, deleteReview } from '../../services/reviewService';
import { useAdmin } from '../context/AdminContext';
import styles from '../styles/admin.module.css';

export default function Reviews() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const filterParam = queryParams.get('filter');

  const { reviews, loading } = useAdmin();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState(
    filterParam ? filterParam.charAt(0).toUpperCase() + filterParam.slice(1) : 'Pending'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');

  const updateStatus = async (id, newStatus) => {
    try {
      await updateReview(id, { status: newStatus });
      // Real-time listener in context will auto-update the list
    } catch (error) {
      console.error('Error updating review status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(id);
      // Real-time listener will remove it automatically
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', overflowX: 'hidden', boxSizing: 'border-box', width: '100%' }}>

      {/* Filters Bar */}
      <div className={styles.glassCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box', minWidth: 0 }}>

        {/* Status Tabs */}
        <div style={{ 
          display: 'flex', 
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: '0.5rem', 
          background: isMobile ? 'transparent' : 'rgba(255,255,255,0.4)', 
          padding: isMobile ? '0' : '0.25rem', 
          borderRadius: isMobile ? 0 : 40, 
          border: isMobile ? 'none' : '1px solid var(--admin-stroke)', 
          overflowX: isMobile ? 'visible' : 'auto', 
          width: '100%', 
          boxSizing: 'border-box', 
          scrollbarWidth: 'none', 
          minWidth: 0,
          justifyContent: isMobile ? 'center' : 'flex-start'
        }}>
          {['Approved', 'Pending', 'Rejected'].map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: isMobile && tab === 'Rejected' ? '0 1 60%' : (isMobile ? '1 1 45%' : 1),
                whiteSpace: 'nowrap', 
                padding: '0.6rem 1.25rem', 
                borderRadius: 30, 
                border: isMobile ? '1px solid var(--admin-stroke)' : 'none',
                cursor: 'pointer', 
                fontWeight: 600, 
                fontSize: '0.85rem', 
                transition: 'all 0.3s ease',
                fontFamily: 'Outfit, sans-serif',
                background: activeTab === tab ? '#18181a' : (isMobile ? 'var(--admin-glass-bg)' : 'transparent'),
                color: activeTab === tab ? '#fff' : 'var(--admin-text-muted)',
                order: isMobile && tab === 'Rejected' ? 3 : (tab === 'Approved' ? 1 : 2)
              }}
            >
              {tab}
              <span style={{
                marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 700,
                background: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                padding: '1px 7px', borderRadius: 12
              }}>
                {reviews.filter(r => r.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Rating Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Search reviews..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: 40, paddingLeft: '2.5rem', paddingRight: '2rem', fontSize: '0.85rem', boxSizing: 'border-box', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontFamily: 'Outfit, sans-serif', color: 'var(--admin-text-main)' }}
            />
            {searchTerm && <X size={14} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--admin-text-muted)' }} />}
          </div>

          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
            style={{ height: 40, padding: '0 0.75rem', borderRadius: 8, border: '1px solid var(--admin-stroke)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontWeight: 600, fontSize: '0.85rem', color: 'var(--admin-text-main)', fontFamily: 'Outfit, sans-serif' }}
          >
            <option value="All">All Stars</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
            <option value="3">⭐⭐⭐ 3 and below</option>
          </select>
        </div>
      </div>

      {/* Review Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
          {loading ? (
            [...Array(3)].map((_, idx) => (
              <div key={`skel-${idx}`}
                style={{ height: 200, borderRadius: 20, background: 'rgba(0,0,0,0.06)' }} />
            ))
          ) : filteredReviews.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontWeight: 300 }}>
              <MessageSquare size={48} opacity={0.2} style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
              <p>No {activeTab.toLowerCase()} reviews found.</p>
            </div>
          ) : (
            filteredReviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={styles.glassCard}
                style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', overflow: 'hidden', minWidth: 0 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '0.5rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.name}</h3>
                    {review.role && <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', margin: '0.25rem 0 0' }}>{review.role}</p>}
                    <div style={{ display: 'flex', gap: '2px', marginTop: '0.5rem' }}>
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={14}
                          fill={idx < review.rating ? 'currentColor' : 'none'}
                          color={idx < review.rating ? '#f5b027' : 'var(--admin-stroke)'}
                        />
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
                    <button onClick={() => updateStatus(review.id, 'Approved')} className="btn"
                      style={{ flex: 1, minWidth: 0, background: 'transparent', border: '1px solid var(--admin-text-main)', color: 'var(--admin-text-main)', fontSize: '0.85rem', padding: '0.6rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <Check size={14} /> Approve
                    </button>
                  )}
                  {activeTab !== 'Rejected' && (
                    <button onClick={() => updateStatus(review.id, 'Rejected')} className="btn"
                      style={{ flex: 1, minWidth: 0, background: 'transparent', border: '1px solid #ed1b24', color: '#ed1b24', fontSize: '0.85rem', padding: '0.6rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <X size={14} /> Reject
                    </button>
                  )}
                  <button onClick={() => handleDelete(review.id)} className="btn"
                    style={{ background: 'transparent', border: '1px solid var(--admin-stroke)', padding: '0.5rem', borderRadius: 8 }}>
                    <Trash2 size={14} color="var(--admin-text-muted)" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
      </div>

    </div>
  );
}
