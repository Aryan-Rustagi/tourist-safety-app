import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { Shield, LayoutDashboard, Bell, Users, Layers, LogOut, LogIn, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { activeAlerts } = useAlerts();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isCurrent = (path: string) => location.pathname === path;
  const close = () => setMenuOpen(false);

  const links =
    isAuthenticated && user?.role === 'ADMIN' ? (
      <>
        <Link to="/" className={`nav-link${isCurrent('/') ? ' active' : ''}`} onClick={close}>
          <LayoutDashboard size={16} />
          Dashboard
          {activeAlerts.length > 0 && <span className="nav-count">{activeAlerts.length}</span>}
        </Link>
        <a href="/#alerts" className="nav-link" onClick={close}>
          <Bell size={16} />
          Alerts
          {activeAlerts.length > 0 && <span className="nav-count">{activeAlerts.length}</span>}
        </a>
        <a href="/#tourists" className="nav-link" onClick={close}>
          <Users size={16} />
          Tourists
        </a>
        <Link to="/zones" className={`nav-link${isCurrent('/zones') ? ' active' : ''}`} onClick={close}>
          <Layers size={16} />
          Zones
        </Link>
      </>
    ) : null;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={close}>
          <div className="navbar-brand-icon">
            <Shield size={22} color="#fff" />
          </div>
          <span className="navbar-brand-text">Safar Setu</span>
          <span className="navbar-portal-badge badge badge-rose">Admin</span>
        </Link>

        <nav>
          <ul className="navbar-links">{links}</ul>
        </nav>

        <div className="navbar-actions">
          {isAuthenticated && user ? (
            <>
              <div className="navbar-user">
                <div className="navbar-user-name">{user.name}</div>
                <div className="navbar-user-role">{user.role}</div>
              </div>
              <button type="button" onClick={logout} title="Sign out" className="icon-btn">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div className="navbar-desktop-cta flex items-center gap-sm">
              <button type="button" onClick={() => navigate('/login')} className="btn btn-ghost btn-sm">
                <LogIn size={16} />
                Sign In
              </button>
              <button type="button" onClick={() => navigate('/register')} className="btn btn-primary btn-sm">
                Get Started
              </button>
            </div>
          )}
          <button type="button" className="mobile-menu-btn" aria-label="Toggle menu" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      <div className={`mobile-nav${menuOpen ? ' open' : ''}`}>
        {links}
        {!isAuthenticated && (
          <div className="flex gap-sm mt-sm">
            <Link to="/login" className="btn btn-secondary btn-sm flex-1" onClick={close}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm flex-1" onClick={close}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
