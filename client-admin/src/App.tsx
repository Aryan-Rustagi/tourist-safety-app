import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSafetyZones } from './pages/admin/AdminSafetyZones';
import { AdminTourists } from './pages/admin/AdminTourists';
import { EmergencyContacts } from './pages/admin/AdminEmergencyContacts';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AdminLayout } from './components/AdminLayout';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'ADMIN'>;
}> = ({ children, allowedRoles = ['ADMIN'] }) => {
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

  if (allowedRoles && user && !allowedRoles.includes(user.role as 'ADMIN')) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Root Command Center Route */}
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
      <Route path="/dashboard" element={<Navigate to="/" replace />} />

      {/* Perimeter & Safety Zones */}
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

      {/* Tourist Accounts & KYC */}
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

      {/* Emergency Contacts Directory */}
      <Route
        path="/contacts"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
              <EmergencyContacts />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/ice" element={<Navigate to="/contacts" replace />} />
      <Route path="/ice-contacts" element={<Navigate to="/contacts" replace />} />
      <Route path="/emergency-contacts" element={<Navigate to="/contacts" replace />} />
      <Route path="/contact" element={<Navigate to="/contacts" replace />} />

      {/* Auth Views */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
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
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <div className="app-wrapper flex items-center justify-center min-h-screen bg-slate-950 p-4">
              <Register />
            </div>
          )
        }
      />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
