import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { ADMIN_HASHED_PASSWORD } from '../auth.config';
import styles from '../styles/admin.module.css';

// We import the actual logo from assets folder
import logo from '../../assets/logo.png';

export default function Login() {
  const { login } = useAdmin();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Hash the input password and compare to env hash
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (hash !== ADMIN_HASHED_PASSWORD) {
      setError('Invalid password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    login();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
      {/* Container glass card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        transition={{ duration: shake ? 0.4 : 0.6, type: shake ? "tween" : "spring" }}
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '3rem 2.5rem',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          background: 'var(--admin-glass-bg)',
          border: '1px solid var(--admin-glass-border)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <img src={logo} alt="Property Express Logomark" style={{ height: 48, marginBottom: '2rem' }} />

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.06em', margin: '0 0 0.5rem' }}>Welcome Back</h1>
          <p style={{ fontWeight: 300, color: 'var(--admin-text-muted)', fontSize: '1rem', margin: 0 }}>Sign in to your admin panel</p>
        </div>

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                paddingRight: '3rem',
                fontSize: '1rem',
                fontWeight: 300,
                background: 'rgba(255,255,255,0.4)',
                border: '1px solid var(--admin-glass-border)',
                borderRadius: 12,
                outline: 'none',
                color: 'var(--admin-text-main)'
              }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--admin-text-muted)'
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            type="submit" 
            style={{
              width: '100%',
              padding: '1rem',
              background: '#ed1b24',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '1rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 24px rgba(237, 27, 36, 0.2)'
            }}
          >
            Sign In
          </button>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  color: '#ed1b24',
                  fontWeight: 400,
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  margin: 0
                }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

        </form>
      </motion.div>
    </div>
  );
}
