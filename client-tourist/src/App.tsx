import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { useAuth } from './context/AuthContext';
import { TouristHome } from './pages/tourist/TouristHome';
import { SafeZones } from './pages/tourist/SafeZones';
import { ReportIncident } from './pages/tourist/ReportIncident';
import { EmergencyContacts } from './pages/tourist/EmergencyContacts';
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { LayoutWrapper } from './components/LayoutWrapper';
import { KycVerificationPage } from './pages/tourist/KycVerificationPage';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'TOURIST' | 'ADMIN'>;
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-text">Authenticating session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <div className="app-wrapper">
      <AlertBanner />
      <Navbar />

      <main className="main-content">
        <LayoutWrapper>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/dashboard" element={<TouristHome />} />
          <Route path="/zones" element={<SafeZones />} />
          <Route path="/report" element={<ReportIncident />} />
          <Route path="/contacts" element={<EmergencyContacts />} />
          <Route path="/ice" element={<Navigate to="/contacts" replace />} />
          <Route path="/ice-contacts" element={<Navigate to="/contacts" replace />} />
          <Route path="/emergency-contacts" element={<Navigate to="/contacts" replace />} />
          <Route path="/contact" element={<Navigate to="/contacts" replace />} />
          <Route
            path="/kyc-verification"
            element={
              <ProtectedRoute allowedRoles={['TOURIST']}>
                <KycVerificationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutWrapper>
      </main>

      <Footer portal="tourist" />
      <BottomNav />
    </div>
  );
};

export default App;
