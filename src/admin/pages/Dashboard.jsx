import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ArrowRight } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { getAllProperties } from '../../services/propertyService';
import { getAllInquiries } from '../../services/inquiryService';
import { getAllReviews } from '../../services/reviewService';
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
  const { isDark, properties, reviews } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);
  
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalInquiries: 0,
    totalReviews: 0,
    pendingReviews: 0,
    propertyTypes: 0
  });

  const [pieData, setPieData] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [properties, reviews]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const inqs = await getAllInquiries();

      // Category breakdown for Pie Chart
      const categories = ['Apartment', 'Villa', 'Plot', 'Commercial'];
      const uniqueTypes = [...new Set(properties.map(p => p.category).filter(Boolean))];

      const pie = categories.map(cat => ({
        name: cat,
        value: properties.filter(p => p.category?.toLowerCase() === cat.toLowerCase() || p.category?.toLowerCase().includes(cat.toLowerCase().slice(0, -1))).length
      })).filter(item => item.value > 0);
      
      setPieData(pie.length > 0 ? pie : [{ name: 'No Data', value: 1 }]);

      setStats({
        totalProperties: properties.length,
        totalInquiries: inqs.length,
        totalReviews: reviews.length,
        pendingReviews: reviews.filter(r => r.status?.toLowerCase() === 'pending').length,
        propertyTypes: uniqueTypes.length
      });

      setRecentInquiries(inqs.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#18181a', '#555555', '#888888', '#bbbbbb'];

  const barData = [
    { name: 'Oct', inquiries: 42 },
    { name: 'Nov', inquiries: 55 },
    { name: 'Dec', inquiries: 38 },
    { name: 'Jan', inquiries: 65 },
    { name: 'Feb', inquiries: 80 },
    { name: 'Mar', inquiries: 110, highlight: true },
  ];

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
        <StatCard title="Page Views" value={45200} icon="👁️" to="/admin/settings" />
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
          </motion.div>
        </>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
