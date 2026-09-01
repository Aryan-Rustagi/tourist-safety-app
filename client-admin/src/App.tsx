import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { Footer } from './components/Footer';
import { useAuth } from './context/AuthContext';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSafetyZones } from './pages/admin/AdminSafetyZones';
import { AdminTourists } from './pages/admin/AdminTourists';
import { TouristHome } from './pages/tourist/TouristHome';
import { SafeZones } from './pages/tourist/SafeZones';
import { ReportIncident } from './pages/tourist/ReportIncident';
import { EmergencyContacts } from './pages/tourist/EmergencyContacts';
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
  const isTourist = isAuthenticated && user?.role === 'TOURIST';

  return (
    <Routes>
      {/* Root Path - Dispatches to Admin Dashboard or Tourist Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'TOURIST']}>
            {isAdmin ? (
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            ) : (
              <div className="app-wrapper">
                <Navbar />
                <main className="main-content">
                  <LayoutWrapper>
                    <TouristHome />
                  </LayoutWrapper>
                </main>
                <Footer portal="tourist" />
              </div>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'TOURIST']}>
            {isAdmin ? (
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            ) : (
              <div className="app-wrapper">
                <Navbar />
                <main className="main-content">
                  <LayoutWrapper>
                    <TouristHome />
                  </LayoutWrapper>
                </main>
                <Footer portal="tourist" />
              </div>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute allowedRoles={['TOURIST', 'ADMIN']}>
            <div className="app-wrapper">
              <Navbar />
              <main className="main-content">
                <LayoutWrapper>
                  <ReportIncident />
                </LayoutWrapper>
              </main>
              <Footer portal="tourist" />
            </div>
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
