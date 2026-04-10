import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowRight, LayoutGrid, ChevronDown, Phone, Mail, Trash2 } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { getAllInquiries, updateInquiry, deleteInquiry } from '../../services/inquiryService';
import styles from '../styles/admin.module.css';

/* ─── Glass Tooltip for Charts ─── */
const GlassTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: isDark ? 'rgba(20, 25, 40, 0.92)' : 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.75)',
      borderRadius: 12,
      padding: '10px 16px',
      fontFamily: 'Outfit',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      animation: 'fadeIn 0.15s ease',
    }}>
      {label && <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--admin-text-main)', marginBottom: 4, marginTop: 0 }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ fontWeight: 300, fontSize: 13, color: 'var(--admin-text-muted)', margin: 0 }}>
          {entry.name}: <strong style={{ color: 'var(--admin-text-main)', fontWeight: 700 }}>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ title, value, icon, to }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      onClick={() => navigate(to)}
      variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
      className={styles.glassCard}
      style={{ borderTop: '4px solid #3f41a5', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
      whileHover={{ y: -4, boxShadow: '0 12px 50px rgba(0,0,0,0.12)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 300, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
          {title}
        </h3>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--admin-text-main)' }}>
        {value.toLocaleString()}
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDark, properties, reviews, customCategories, siteSettings } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [expandedEnquiryId, setExpandedEnquiryId] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalInquiries: 0,
    totalReviews: 0,
    pendingReviews: 0,
    propertyTypes: 0
  });

  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [properties, reviews]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const inqs = await getAllInquiries();

      // Issue 8: Count all unique property types (base 4 + custom)
      const BASE_CATEGORIES = ['Apartment', 'Villa', 'Plot', 'Commercial'];
      const totalPropertyTypes = BASE_CATEGORIES.length + (customCategories?.length || 0);

      // Category breakdown for Pie Chart — include custom categories
      const allCategoryNames = [
        ...BASE_CATEGORIES,
        ...(customCategories || []).map(c => c.name)
      ];
      const pie = allCategoryNames.map(cat => ({
        name: cat,
        value: properties.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length
      })).filter(item => item.value > 0);

      setPieData(pie.length > 0 ? pie : [{ name: 'No Data', value: 1 }]);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const dynamicBarData = [];
      
      for (let i = 5; i >= 0; i--) {
        let d = new Date(currentYear, currentMonth - i, 1);
        dynamicBarData.push({ monthIndex: d.getMonth(), year: d.getFullYear(), name: months[d.getMonth()], inquiries: 0, highlight: i === 0 });
      }
      
      inqs.forEach(inq => {
        let date;
        if (inq.createdAt?.toDate) {
          date = inq.createdAt.toDate();
        } else if (inq.date) {
          date = new Date(inq.date);
        }
        
        if (date && !isNaN(date)) {
          const m = date.getMonth();
          const y = date.getFullYear();
          const target = dynamicBarData.find(l => l.monthIndex === m && l.year === y);
          if (target) {
            target.inquiries += 1;
          }
        }
      });
      setBarData(dynamicBarData);

      setStats({
        totalProperties: properties.length,
        totalInquiries: inqs.length,
        totalReviews: reviews.length,
        pendingReviews: reviews.filter(r => r.status?.toLowerCase() === 'pending').length,
        propertyTypes: totalPropertyTypes
      });

      setRecentInquiries(inqs.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  const markResponded = async (id) => {
    try {
      await updateInquiry(id, { status: 'responded' });
      setRecentInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: 'responded' } : inq));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const markClosed = async (id) => {
    try {
      await updateInquiry(id, { status: 'closed' });
      setRecentInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: 'closed' } : inq));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await deleteInquiry(id);
      setRecentInquiries(prev => prev.filter(inq => inq.id !== id));
    } catch (error) {
      console.error('Error deleting inquiry:', error);
    }
  };

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

  const COLORS = ['#18181a', '#555555', '#888888', '#bbbbbb'];

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    switch(s) {
      case 'new': return { background: 'rgba(237,27,36,0.1)', color: '#ed1b24' };
      case 'responded': return { background: 'rgba(46,204,113,0.1)', color: '#2ecc71' };
      case 'closed': return { background: 'rgba(128,128,128,0.1)', color: 'var(--admin-text-muted)' };
      default: return { background: 'rgba(0,0,0,0.05)', color: '#888' };
    }
  };

  const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const tableVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const rowVariant = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer} initial="hidden" animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}
      >
        <StatCard title="Total Properties" value={stats.totalProperties} icon="🏘️" to="/admin/properties" />
        <StatCard title="Total Enquiries" value={stats.totalInquiries} icon="📩" to="/admin/inquiries" />
        <StatCard title="Property Types" value={stats.propertyTypes} icon="🏷️" to="/admin/settings" />
        <StatCard title="Pending Reviews" value={stats.pendingReviews} icon="⭐" to="/admin/reviews?filter=pending" />
      </motion.div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} className={styles.glassCard} style={{ height: 380 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className={`${styles.chartsGrid} admin-charts-grid`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: '1.5rem' }}>

            {/* Donut / Pie */}
            <motion.div className={styles.glassCard} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--admin-text-main)' }}>Properties by Category</h3>
                <div style={{ flex: 1, minHeight: 300, width: '100%', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="38%"
                      outerRadius="58%"
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`pie-cell-${index}-${entry.name}`}
                          fill={COLORS[index % COLORS.length]}
                          opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<GlassTooltip isDark={isDark} />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  {activeIndex !== null ? (
                    <>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text-main)', lineHeight: 1 }}>{pieData[activeIndex].value}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>{pieData[activeIndex].name}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text-main)', lineHeight: 1 }}>{totalPie}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>Total</div>
                    </>
                  )}
                </div>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginTop: '0.5rem' }}>
                {pieData.map((d, i) => (
                  <div key={`legend-${d.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 300 }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bar Chart */}
            <motion.div className={styles.glassCard} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 }}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--admin-text-main)' }}>Enquiries (Last 6 Months)</h3>
                <div style={{ flex: 1, minHeight: 280, width: '100%' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--admin-text-muted)', fontFamily: 'Outfit', fontSize: 12, fontWeight: 300 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--admin-text-muted)', fontFamily: 'Outfit', fontSize: 12, fontWeight: 300 }} />
                    <Tooltip
                      content={<GlassTooltip isDark={isDark} />}
                      cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', radius: 8 }}
                    />
                    <Bar dataKey="inquiries" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.highlight ? '#ed1b24' : (isDark ? '#444' : '#18181a')} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Recent Inquiries Table */}
          <motion.div className={styles.glassCard} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--admin-text-main)', margin: 0 }}>Recent Enquiries</h3>
              <Link to="/admin/inquiries" style={{ fontWeight: 300, color: 'var(--admin-text-muted)', textDecoration: 'underline', fontSize: '0.9rem' }}>View All</Link>
            </div>
            {isMobile ? (
              /* Mobile Card View (Pill Cards) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentInquiries.map((inq) => {
                  const isExpanded = expandedEnquiryId === inq.id;
                  return (
                    <motion.div
                      key={inq.id}
                      layout
                      onClick={() => setExpandedEnquiryId(isExpanded ? null : inq.id)}
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
                                  onClick={(e) => { e.stopPropagation(); handleDeleteInquiry(inq.id); }}
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
                <motion.table variants={tableVariants} initial="hidden" animate="show" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid var(--admin-stroke)` }}>
                      {['Name', 'Property', 'Phone', 'Date', 'Status'].map((h, idx) => (
                        <th key={`th-${h}-${idx}`} style={{ padding: '1rem', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentInquiries.map((inq, i) => (
                      <motion.tr
                        key={inq.id}
                        variants={rowVariant}
                        onClick={() => navigate(`/admin/inquiries?expanded=${inq.id}`)}
                        style={{ borderBottom: `1px solid var(--admin-stroke)`, background: i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'), cursor: 'pointer' }}
                      >
                        <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--admin-text-body)' }}>{inq.name}</td>
                        <td style={{ padding: '1rem', fontWeight: 300, color: 'var(--admin-text-muted)' }}>{inq.propertyTitle || inq.property}</td>
                        <td style={{ padding: '1rem', fontWeight: 400, color: 'var(--admin-text-body)', fontVariantNumeric: 'tabular-nums' }}>{inq.phone}</td>
                        <td style={{ padding: '1rem', fontWeight: 300, color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString() : inq.date}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', ...getStatusStyle(inq.status) }}>
                            {inq.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </motion.table>
              </div>
            )}
          </motion.div>
        </>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
