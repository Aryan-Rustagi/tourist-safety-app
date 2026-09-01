import React, { useState, useEffect } from 'react';
import { Menu, Bell, RefreshCw, ShieldAlert, Plus, Search, MapPin, LogOut } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';

interface AdminTopBarProps {
  onToggleSidebar: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  onToggleSidebar,
  onRefresh,
  isRefreshing = false,
}) => {
  const { logout } = useAuth();
  const { activeAlerts } = useAlerts();
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (location.pathname === '/zones') return 'Safety Zone Perimeters';
    return 'Live Command Center';
  };

  return (
    <header className="admin-topbar">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="admin-hamburger-btn"
          aria-label="Open Sidebar Navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Safar Setu Admin</span>
            <span>/</span>
            <span className="text-slate-700 font-bold">{getPageTitle()}</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 leading-none mt-0.5">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Center/Right Operations */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Live Clock IST */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '0.75rem', background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontFamily: 'monospace', color: '#334155' }}>
          <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#10b981' }} className="animate-pulse" />
          <span style={{ fontWeight: 600, color: '#64748b' }}>IST:</span>
          <span style={{ fontWeight: 800, color: '#0f172a' }}>{time || 'Live'}</span>
        </div>

        {/* SOS Alarm Indicator */}
        {activeAlerts.length > 0 && (
          <a
            href="/#alerts"
            onClick={(e) => {
              e.preventDefault();
              if (location.pathname !== '/') {
                navigate('/#alerts');
              } else {
                document.querySelector('#alerts')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '0.75rem', background: '#ef4444', color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)', textDecoration: 'none' }}
            className="animate-bounce"
          >
            <ShieldAlert size={15} />
            <span>{activeAlerts.length} SOS DISTRESS</span>
          </a>
        )}

        {/* Refresh Feed */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', borderRadius: '0.75rem', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            title="Refresh Live Incident & SOS Feed"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} style={{ color: '#dc2626' }} />
            <span>Refresh Feed</span>
          </button>
        )}

        {/* Quick Add Zone Button */}
        <Link
          to="/zones"
          className="admin-btn-dark"
        >
          <Plus size={15} />
          <span>Manage Zones</span>
        </Link>

        {/* Prominent Sign Out Button */}
        <button
          type="button"
          onClick={logout}
          className="admin-btn-logout"
          title="Sign Out of Admin Portal"
          id="admin-topbar-logout-btn"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
