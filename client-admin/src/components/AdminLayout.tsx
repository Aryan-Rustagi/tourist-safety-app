import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { AlertBanner } from './AlertBanner';
import { useAlerts } from '../context/AlertContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  onRefresh,
  isRefreshing = false,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { fetchActiveAlerts } = useAlerts();

  const handleRefresh = () => {
    fetchActiveAlerts();
    if (onRefresh) onRefresh();
  };

  return (
    <div className="admin-root-layout">
      {/* Left Vertical Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Pane */}
      <div className="admin-main-wrapper">
        <AlertBanner />
        <AdminTopBar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <main className="admin-content-body">
          {children}
        </main>
      </div>
    </div>
  );
};
