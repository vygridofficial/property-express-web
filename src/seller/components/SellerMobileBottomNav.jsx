import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  History,
  HelpCircle,
  Plus,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import logo from '../../assets/logo.png';
import styles from '../styles/seller.module.css';

export default function SellerMobileBottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { logout } = useSeller();
  const navigate = useNavigate();

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
  };

  const mainItems = [
    { to: '/agreements',        icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/agreements/signed', icon: History,          label: 'History'              },
    { to: '/agreements/help',   icon: HelpCircle,       label: 'Help'                 },
  ];

  return (
    <>
      {/* ── Bottom Tab Bar ── */}
      <nav className={styles.mobileBottomNav}>
        {mainItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Sell CTA */}
        <button
          className={styles.mobileNavItem}
          onClick={() => { setDrawerOpen(false); navigate('/agreements/list'); }}
          style={{ color: '#ed1b24' }}
        >
          <span style={{
            background: '#ed1b24', color: 'white', borderRadius: '50%',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(237,27,36,0.35)'
          }}>
            <Plus size={20} />
          </span>
          <span>Sell</span>
        </button>

        {/* Menu button */}
        <button className={styles.mobileNavItem} onClick={() => setDrawerOpen(true)}>
          <Menu size={22} />
          <span>Menu</span>
        </button>
      </nav>

      {/* ── Slide-up Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className={styles.mobileDrawerOverlay}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className={styles.mobileDrawer}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <img src={logo} alt="Property Express" style={{ height: 28, objectFit: 'contain' }} />
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={22} />
                </button>
              </div>

              {/* Nav links inside drawer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                {[...mainItems].map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `${styles.drawerNavItem} ${isActive ? styles.drawerNavItemActive : ''}`
                    }
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </NavLink>
                ))}
                <button
                  onClick={() => { setDrawerOpen(false); navigate('/agreements/list'); }}
                  className={styles.drawerNavItem}
                  style={{ color: '#ed1b24', fontWeight: 700 }}
                >
                  <Plus size={20} />
                  <span>Sell Your Property</span>
                </button>
              </div>

              {/* Logout */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.25rem' }}>
                <button
                  onClick={handleLogout}
                  className={styles.drawerNavItem}
                  style={{ color: '#ef4444', width: '100%' }}
                >
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
