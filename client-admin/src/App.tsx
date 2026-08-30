import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { Footer } from './components/Footer';
import { useAuth } from './context/AuthContext';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSafetyZones } from './pages/admin/AdminSafetyZones';
import { AdminTourists } from './pages/admin/AdminTourists';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { LayoutWrapper } from './components/LayoutWrapper';

import { AdminLayout } from './components/AdminLayout';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'TOURIST' | 'ADMIN'>;
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-300">Authenticating Command Center session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  return (
    <Routes>
      {/* Authenticated Admin Views wrapped in modern Left Sidebar AdminLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/zones"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
              <AdminSafetyZones />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tourists"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
              <AdminTourists />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Auth Views */}
      <Route
        path="/login"
        element={
          isAdmin ? (
            <Navigate to="/" replace />
          ) : (
            <div className="app-wrapper flex items-center justify-center min-h-screen bg-slate-950 p-4">
              <Login />
            </div>
          )
        }
      />
      <Route
        path="/register"
        element={
          isAdmin ? (
            <Navigate to="/" replace />
          ) : (
            <div className="app-wrapper flex items-center justify-center min-h-screen bg-slate-950 p-4">
              <Register />
            </div>
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
