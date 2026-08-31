import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Shield, Lock, Mail, AlertTriangle, ArrowRight, Sparkles, ShieldAlert, MapPin, Users } from 'lucide-react';

import { GoogleLoginButton } from '../../components/GoogleLoginButton';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { document.title = 'Sign In — Safar Setu'; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (res.success) navigate(redirect);
    else setErrorMsg(res.message || 'Login failed. Please check credentials.');
  };

  const fillDemo = (role: UserRole) => {
    if (role === 'TOURIST') { setEmail('tourist@safetour.app'); setPassword('password123'); }
    else { setEmail('admin@safetour.app'); setPassword('password123'); }
  };

  const highlights = [
    { icon: ShieldAlert, text: 'One-touch SOS to authorities' },
    { icon: MapPin, text: 'Live safety zone maps' },
    { icon: Users, text: 'ICE emergency contacts' },
  ];

  return (
    <div className="auth-page">

      {/* ── Left Panel (Branding) ── */}
      <div className="auth-panel-left">
        {/* Background decor */}
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: '-10%', right: '-15%',
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(229,62,62,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: '5%', left: '-10%',
            width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
        </div>

        <div className="auth-panel-left-content">
          <div className="navbar-brand" style={{ marginBottom: '2.5rem' }}>
            <div className="navbar-brand-icon">
              <Shield size={20} color="#fff" />
            </div>
            <span className="navbar-brand-text" style={{ color: 'white' }}>Safar Setu</span>
          </div>

          <h2 className="auth-panel-tagline">
            Your safety guardian<br />across India
          </h2>

          <p className="auth-panel-desc">
            Emergency SOS, real-time maps, and crowd-sourced
            incident intelligence — right in your pocket.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {highlights.map(h => {
              const Icon = h.icon;
              return (
                <div key={h.text} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--r-lg)',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={16} color="white" />
                  </div>
                  <span style={{ fontSize: '0.9375rem', color: 'var(--navy-300)' }}>{h.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="auth-panel-right">
        <div className="auth-card">

          {/* Back to home */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '2rem', textDecoration: 'none' }}>
            ← Back to home
          </Link>

          <div className="auth-logo">
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-lg)', background: 'var(--navy-900)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#fff" />
            </div>
          </div>

          <h1 className="auth-card-title">Welcome back</h1>
          <p className="auth-card-subtitle" style={{ marginBottom: '2rem' }}>
            Sign in to access your safety dashboard
          </p>

          {errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="login-form">
            <div>
              <label className="label" htmlFor="login-email">Email Address</label>
              <div className="input-group">
                <Mail className="input-icon" size={15} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input input-with-icon"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <div className="input-group">
                <Lock className="input-icon" size={15} />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input input-with-icon"
                />
              </div>
            </div>
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting}
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-divider" style={{ margin: '1.25rem 0 1rem' }}>
            <span>Or continue with Google</span>
          </div>

          <GoogleLoginButton role="TOURIST" text="continue_with" onError={(err) => setErrorMsg(err)} />

          <div className="auth-divider" style={{ margin: '1.25rem 0' }}>
            <span>Demo accounts</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              id="demo-tourist-btn"
              onClick={() => fillDemo('TOURIST')}
              className="auth-demo-btn"
              style={{ flex: 1 }}
            >
              <Sparkles size={13} color="var(--amber-500)" />
              Tourist Demo
            </button>
          </div>

          <p className="auth-footer-link" style={{ marginTop: '1.5rem' }}>
            Don't have an account?{' '}
            <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
