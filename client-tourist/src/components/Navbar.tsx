import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import {
  ShieldAlert,
  Shield,
  MapPin,
  FileWarning,
  Users,
  LogOut,
  LogIn,
  Menu,
  X,
  Info,
  LayoutDashboard,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { myActiveAlert } = useAlerts();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isCurrent = (path: string) => location.pathname === path;
  const close = () => setMenuOpen(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
    { to: '/zones', label: 'Safety Zones', icon: <MapPin size={14} color="#10B981" /> },
    { to: '/report', label: 'Report', icon: <FileWarning size={14} color="#F59E0B" /> },
    { to: '/contacts', label: 'ICE Contacts', icon: <Users size={14} color="#0EA5E9" /> },
    { to: '/about', label: 'About', icon: <Info size={14} /> },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* ── Brand ── */}
        <Link to="/" className="navbar-brand" onClick={close}>
          <div className="navbar-brand-icon">
            <Shield size={20} color="#fff" />
          </div>
          <span className="navbar-brand-text">Safar Setu</span>
          <span className="navbar-portal-badge badge badge-rose">Tourist</span>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <nav aria-label="Main navigation">
          <ul className="navbar-links">
            {navLinks.map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`nav-link${isCurrent(link.to) ? ' active' : ''}`}
                >
                  {link.icon && link.icon}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Right Actions ── */}
        <div className="navbar-actions">

          {myActiveAlert && (
            <span className="badge badge-rose">
              <ShieldAlert size={12} />
              SOS Active
            </span>
          )}

          {isAuthenticated && user ? (
            <>
              <div className="navbar-user">
                <div className="navbar-user-name">{user.name}</div>
                <div className="navbar-user-role">{user.role}</div>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="icon-btn"
                type="button"
                id="navbar-logout-btn"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <div className="navbar-desktop-cta">
              <button
                type="button"
                id="navbar-signin-btn"
                onClick={() => navigate('/login')}
                className="btn btn-ghost btn-sm"
              >
                <LogIn size={15} />
                Sign In
              </button>
              <button
                type="button"
                id="navbar-register-btn"
                onClick={() => navigate('/register')}
                className="btn btn-primary btn-sm"
              >
                Get Started
              </button>
            </div>
          )}

          <button
            type="button"
            className="mobile-menu-btn"
            aria-label="Toggle menu"
            id="navbar-menu-btn"
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Nav ── */}
      <div className={`mobile-nav${menuOpen ? ' open' : ''}`} role="navigation" aria-label="Mobile navigation">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link${isCurrent(link.to) ? ' active' : ''}`}
            onClick={close}
          >
            {link.icon && link.icon}
            {link.label}
          </Link>
        ))}

        {!isAuthenticated && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <Link to="/login" className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={close}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={close}>
              Get Started
            </Link>
          </div>
        )}

        {isAuthenticated && user && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <div>
              <div className="font-semibold text-sm">{user.name}</div>
              <div className="text-xs text-brand font-bold uppercase tracking-wide">{user.role}</div>
            </div>
            <button onClick={() => { logout(); close(); }} className="btn btn-outline btn-sm" type="button">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
