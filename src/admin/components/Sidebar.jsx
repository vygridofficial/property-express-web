import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, MessageSquare, Star, Settings, Link as LinkIcon, ChevronLeft, ChevronRight, LogOut, Building2, Trash2, FileSignature, History } from 'lucide-react';
import { FlatIcon, VillaIcon, PlotIcon, WarehouseIcon } from './icons/PropertyIcons';
import { useAdmin } from '../context/AdminContext';
import styles from '../styles/admin.module.css';
import logo from '../../assets/logo.png';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { sections, logout, propertyTypes, properties } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin'); // Assuming /admin redirects to login naturally when unauthenticated
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <div style={{ position: 'relative' }}>
      <NavLink 
        to={to} 
        end={to === '/admin'}
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: collapsed ? '0.65rem 0' : '0.65rem 1.5rem', justifyContent: collapsed ? 'center' : 'flex-start' }}
        title={collapsed ? label : ''}
      >
        <Icon size={18} style={{ minWidth: 18 }} />
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{opacity:0, width:0}} animate={{opacity:1, width:'auto'}} exit={{opacity:0, width:0}} style={{ marginLeft: '0.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </NavLink>
    </div>
  );

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarBrand}>
        <img src={logo} alt="Property Express" className={styles.logoFull} />
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div className={styles.navGroup}>
          {!collapsed && <div className={styles.navLabel}>Main</div>}
          <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
        </div>

        <div className={styles.navGroup}>
          {!collapsed && <div className={styles.navLabel}>Properties</div>}
          <NavItem to="/admin/properties" icon={WarehouseIcon} label="All Properties" />
          <AnimatePresence mode="popLayout">
            {propertyTypes.map((cat) => {
              if (sections[cat.name] === false) return null;
              if (cat.name === 'Uncategorized') return null; // We handle it explicitly if properties exist

              const low = cat.name.toLowerCase();
              let Icon = Building2;
              let path = `/admin/properties/${low}`;
              
              if (low === 'apartment' || low === 'apartments' || low === 'flat') { Icon = FlatIcon; path = '/admin/properties/apartments'; }
              else if (low === 'villa') { Icon = VillaIcon; path = '/admin/properties/villas'; }
              else if (low === 'plot') { Icon = PlotIcon; path = '/admin/properties/plots'; }
              else if (low === 'commercial') { Icon = WarehouseIcon; path = '/admin/properties/commercial'; }

              return (
                <motion.div key={cat.id} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <NavItem to={path} icon={Icon} label={cat.name} />
                </motion.div>
              );
            })}

            {/* Uncategorized (Fix for Point 11) */}
            {properties.some(p => p.category === 'Uncategorized') && (
              <motion.div key="uncategorized-nav" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <NavItem to="/admin/properties/uncategorized" icon={WarehouseIcon} label="Uncategorized" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.navGroup}>
          {!collapsed && <div className={styles.navLabel}>Management</div>}
          <NavItem to="/admin/submissions" icon={FileSignature} label="Pending Approvals" />
          <NavItem to="/admin/sellers-history" icon={History} label="Sellers History" />
          <NavItem to="/admin/inquiries" icon={MessageSquare} label="Enquiries" />
          <AnimatePresence mode="popLayout">
            {sections.showReviews !== false && (
              <motion.div key="review-nav" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <NavItem to="/admin/reviews" icon={Star} label="Reviews" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.navGroup}>
          {!collapsed && <div className={styles.navLabel}>Settings</div>}
          {/* Contact & Social is always visible — it's a core admin page */}
          <NavItem to="/admin/contact-social" icon={LinkIcon} label="Contact & Social" />
          <NavItem to="/admin/settings" icon={Settings} label="Site Settings" />
        </div>
      </nav>

      {/* Bottom Actions Profile/Logout */}
      <div style={{ 
        padding: '1rem 1.25rem', 
        borderTop: '1px solid rgba(0,0,0,0.08)', 
        display: 'flex', 
        flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: collapsed ? '1rem' : '0'
      }}>
        <button onClick={() => setCollapsed(!collapsed)} className={styles.iconBtn} style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.5rem' }}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <button 
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--admin-text-muted)',
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: 'Outfit, sans-serif',
            transition: 'color 0.2s ease',
            padding: 0
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ed1b24'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--admin-text-muted)'; }}
        >
          {collapsed ? (
             <LogOut size={18} style={{ color: 'inherit' }} />
          ) : (
            <>
              <LogOut size={18} style={{ color: 'inherit' }} />
              <span style={{ color: 'inherit' }}>Logout</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
