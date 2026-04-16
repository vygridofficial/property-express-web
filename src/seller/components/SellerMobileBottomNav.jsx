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
          onClick={() => navigate('/agreements/list')}
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
      </nav>
    </>
  );
}
