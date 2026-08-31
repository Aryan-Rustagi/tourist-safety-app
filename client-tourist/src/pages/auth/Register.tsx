import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Shield, Lock, Mail, User, Phone, AlertTriangle, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';

import { GoogleLoginButton } from '../../components/GoogleLoginButton';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role] = useState<UserRole>('TOURIST');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { document.title = 'Create Account — Safar Setu'; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    setIsSubmitting(true);
    const res = await register(name, email, password, role, phone);
    setIsSubmitting(false);
    if (res.success) navigate('/dashboard');
    else setErrorMsg(res.message || 'Registration failed.');
  };

  const perks = [
    { icon: ShieldCheck, text: 'Instant SOS emergency dispatch' },
    { icon: Zap, text: 'Real-time safety zone alerts' },
    { icon: Globe, text: 'Trusted by SIH 2026' },
  ];

  return (
    <div className="auth-page">

      {/* ── Left Panel ── */}
      <div className="auth-panel-left">
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: '10%', right: '-10%',
            width: 350, height: 350,
            background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', left: '-5%',
            width: 280, height: 280,
            background: 'radial-gradient(circle, rgba(229,62,62,0.1) 0%, transparent 70%)',
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
            Join the safety<br />network today
          </h2>

          <p className="auth-panel-desc">
            Create a free account to access the full tourist
            safety toolkit — SOS, maps, contacts, and AI assistance.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {perks.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--r-lg)',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={16} color="white" />
                  </div>
                  <span style={{ fontSize: '0.9375rem', color: 'var(--navy-300)' }}>{p.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-panel-right">
        <div className="auth-card" style={{ maxWidth: 440 }}>

          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '2rem', textDecoration: 'none' }}>
            ← Back to home
          </Link>

          <div className="auth-logo">
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-lg)', background: 'var(--navy-900)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#fff" />
            </div>
          </div>

          <h1 className="auth-card-title">Create your account</h1>
          <p className="auth-card-subtitle" style={{ marginBottom: '2rem' }}>
            Join the tourist safety and emergency response network
          </p>

          {errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="register-form">
            <div>
              <label className="label" htmlFor="reg-name">Full Name</label>
              <div className="input-group">
                <User className="input-icon" size={15} />
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="input input-with-icon"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="reg-email">Email Address</label>
              <div className="input-group">
                <Mail className="input-icon" size={15} />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input input-with-icon"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label" htmlFor="reg-phone">Phone (Optional)</label>
                <div className="input-group">
                  <Phone className="input-icon" size={15} />
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765…"
                    className="input input-with-icon"
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="reg-password">Password</label>
                <div className="input-group">
                  <Lock className="input-icon" size={15} />
                  <input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    required
                    className="input input-with-icon"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              id="register-submit-btn"
              disabled={isSubmitting}
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Creating Account…' : 'Create Account'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-divider" style={{ margin: '1.25rem 0 1rem' }}>
            <span>Or sign up with Google</span>
          </div>

          <GoogleLoginButton role="TOURIST" text="signup_with" onError={(err) => setErrorMsg(err)} />

          <p className="auth-footer-link" style={{ marginTop: '1.25rem' }}>
            Already have an account?{' '}
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
