import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, FileWarning, Users } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/zones', label: 'Zones', icon: MapPin },
  { to: '/report', label: 'Report', icon: FileWarning },
  { to: '/contacts', label: 'ICE', icon: Users },
];

export const BottomNav: React.FC = () => {
  const { pathname } = useLocation();
  const visible = ['/dashboard', '/zones', '/report', '/contacts'].includes(pathname);
  if (!visible) return null;

  return (
    <nav className="bottom-nav" aria-label="Tourist mobile navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`bottom-nav-link${active ? ' active' : ''}`}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
