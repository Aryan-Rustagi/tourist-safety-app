import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import {
  Shield,
  LayoutDashboard,
  Bell,
  Layers,
  MapPin,
  FileWarning,
  LogOut,
  Radio,
  ExternalLink,
  X,
  UserCheck,
  Users,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { activeAlerts } = useAlerts();
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrent = (path: string) => location.pathname === path;

  const handleNav = (hashOrPath: string) => {
    onClose();
    if (hashOrPath.startsWith('#')) {
      if (location.pathname !== '/') {
        navigate('/' + hashOrPath);
      } else {
        const el = document.querySelector(hashOrPath);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header Branding */}
        <div className="admin-sidebar-header">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3" onClick={onClose}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-900/30 flex-shrink-0">
                <Shield size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base tracking-tight">Safar Setu</span>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-red-600 text-white tracking-widest">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Command Center</p>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              className="admin-sidebar-close-btn"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Live Dispatch Connection Badge */}
          <div className="mt-4 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-300">Live Radar Online</span>
            </div>
            <Radio size={14} className="text-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="admin-sidebar-nav">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Core Operations
          </div>

          <Link
            to="/"
            className={`admin-nav-item ${isCurrent('/') ? 'active' : ''}`}
            onClick={() => handleNav('/')}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={18} className="admin-nav-icon" />
              <span>Command Overview</span>
            </div>
          </Link>

          <a
            href="/#alerts"
            className="admin-nav-item"
            onClick={(e) => {
              e.preventDefault();
              handleNav('#alerts');
            }}
          >
            <div className="flex items-center gap-3">
              <Bell size={18} className="admin-nav-icon text-rose-400" />
              <span>Live SOS Distress</span>
            </div>
            {activeAlerts.length > 0 ? (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse">
                {activeAlerts.length} Active
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">0 calls</span>
            )}
          </a>

          <a
            href="/#incidents"
            className="admin-nav-item"
            onClick={(e) => {
              e.preventDefault();
              handleNav('#incidents');
            }}
          >
            <div className="flex items-center gap-3">
              <FileWarning size={18} className="admin-nav-icon text-amber-400" />
              <span>Incident Verification</span>
            </div>
          </a>

          <a
            href="/#map"
            className="admin-nav-item"
            onClick={(e) => {
              e.preventDefault();
              handleNav('#map');
            }}
          >
            <div className="flex items-center gap-3">
              <MapPin size={18} className="admin-nav-icon text-sky-400" />
              <span>Tactical Map</span>
            </div>
          </a>

          <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Perimeter Control
          </div>

          <Link
            to="/zones"
            className={`admin-nav-item ${isCurrent('/zones') ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="flex items-center gap-3">
              <Layers size={18} className="admin-nav-icon text-purple-400" />
              <span>Safety Zones</span>
            </div>
          </Link>

          <Link
            to="/tourists"
            className={`admin-nav-item ${isCurrent('/tourists') ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="flex items-center gap-3">
              <UserCheck size={18} className="admin-nav-icon text-blue-400" />
              <span>Tourists & KYC</span>
            </div>
          </Link>



          {/* Quick Stats Pill */}
          <div className="mt-auto px-3 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Emergency Dispatch</span>
              <span className="font-mono text-emerald-400 font-bold">112 / 100</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Tourist Police Response Portal
            </div>
          </div>
        </nav>

        {/* User Footer Profile */}
        <div className="admin-sidebar-footer">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-sm flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user?.name || 'Administrator'}</div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <UserCheck size={11} />
                  <span>{user?.role || 'ADMIN'}</span>
                </div>
              </div>
            </div>


          </div>
        </div>
      </aside>
    </>
  );
};
