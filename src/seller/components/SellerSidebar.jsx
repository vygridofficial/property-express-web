import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  HelpCircle, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard,
  Moon,
  Sun
} from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import styles from '../styles/seller.module.css';
import logo from '../../assets/logo.png';

export default function SellerSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, theme, toggleTheme } = useSeller();

  const NavItem = ({ to, icon: Icon, label, end }) => (
    <NavLink 
      to={to}
      end={end}
      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      style={{ 
        padding: collapsed ? '0.75rem 0' : '0.75rem 1.5rem',
        justifyContent: collapsed ? 'center' : 'flex-start'
      }}
      title={collapsed ? label : ''}
    >
      <Icon size={20} style={{ minWidth: 20 }} />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            style={{ marginLeft: '0.75rem', overflow: 'hidden', whiteSpace: 'nowrap' }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      {/* Logo — hidden when collapsed */}
      <div className={styles.sidebarBrand}>
        <AnimatePresence>
          {!collapsed && (
            <motion.img
              key="logo"
              src={logo}
              alt="Logo"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 140 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.25 }}
              style={{ height: 35, objectFit: 'contain' }}
            />
          )}
        </AnimatePresence>
      </div>

      <nav className={styles.sidebarNav}>
        <div className={styles.navGroup}>
          {!collapsed && <div className={styles.navLabel}>Menu</div>}
          <NavItem to="/agreements" icon={LayoutDashboard} label="Dashboard" end />
          <NavItem to="/agreements/signed" icon={History} label="Signing History" />
        </div>

        <div className={styles.navGroup}>
          {!collapsed && <div className={styles.navLabel}>Support</div>}
          <NavItem to="/agreements/help" icon={HelpCircle} label="Help Center" />
        </div>
      </nav>

      {/* Footer — always visible; stacks vertically when collapsed */}
      <div
        className={styles.sidebarFooter}
        style={{
          flexDirection: 'column',
          alignItems: collapsed ? 'center' : 'stretch',
          gap: '0.75rem'
        }}
      >
        {/* Collapse toggle */}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          style={{ alignSelf: collapsed ? 'center' : 'flex-end' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Logout — always visible; icon-only when collapsed */}
        <button
          onClick={logout}
          className={styles.logoutBtn}
          title="Sign Out"
          style={{
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0.75rem' : '0.75rem 1rem',
          }}
        >
          <LogOut size={18} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </aside>
  );
}
