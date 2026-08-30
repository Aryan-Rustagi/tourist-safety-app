import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import {
  ShieldAlert,
  MapPinned,
  FileWarning,
  Radio,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

export const LandingPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState('');

  useEffect(() => {
    document.title = 'SafeTour Guardian — Tourist Safety Platform';
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    const res = await login(loginEmail, loginPassword);
    setLoginSubmitting(false);
    if (res.success) navigate('/dashboard');
    else setLoginError(res.message || 'Login failed. Please check your credentials.');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regPassword.length < 6) { setRegError('Password must be at least 6 characters.'); return; }
    setRegSubmitting(true);
    const res = await register(regName, regEmail, regPassword, 'TOURIST' as UserRole, regPhone);
    setRegSubmitting(false);
    if (res.success) navigate('/dashboard');
    else setRegError(res.message || 'Registration failed.');
  };

  const fillDemo = () => {
    setLoginEmail('tourist@safetour.app');
    setLoginPassword('password123');
  };

  const features = [
    {
      icon: ShieldAlert,
      title: 'One-Touch SOS',
      desc: 'Broadcast GPS & distress to Police & Rescue Command instantly.',
      cls: 'icon-box-rose',
    },
    {
      icon: MapPinned,
      title: 'Safety Maps',
      desc: 'Live maps with geo-boundaries for restricted & high-risk zones.',
      cls: 'icon-box-teal',
    },
    {
      icon: FileWarning,
      title: 'Incident Reports',
      desc: 'Crowd-sourced theft, scam & hazard alerts verified by responders.',
      cls: 'icon-box-amber',
    },
    {
      icon: Radio,
      title: 'Live Dispatch',
      desc: 'Socket.IO command console for authorities to resolve SOS alerts.',
      cls: 'icon-box-sky',
    },
  ];

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{ background: 'var(--bg-page)', padding: '5rem 1.5rem 4rem' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'center',
          }}
            className="landing-hero-grid"
          >
            {/* Left: headline + features */}
            <div>
              <div className="hero-eyebrow">
                <Sparkles size={13} />
                Smart India Hackathon 2026 · Tourist Safety
              </div>

              <h1 className="hero-headline">
                Travel India with a{' '}
                <span className="highlight">guardian</span>{' '}
                on call
              </h1>

              <p style={{
                fontSize: '1.0625rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: '2.5rem',
                maxWidth: 480,
              }}>
                SafeTour Guardian connects tourists to emergency SOS, safety zone maps,
                ICE contacts, and a live police dispatch console — real-time, every time.
              </p>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {[
                  { num: '112', label: 'National Emergency' },
                  { num: '1363', label: 'Tourist Helpline' },
                  { num: '24/7', label: 'Live Monitoring' },
                ].map((s, i, arr) => (
                  <React.Fragment key={s.num}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{s.num}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ width: 1, height: 36, background: 'var(--border)', alignSelf: 'center' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to="/dashboard" className="btn btn-primary btn-lg" id="hero-dashboard-btn">
                  Open Dashboard <ArrowRight size={16} />
                </Link>
                <Link to="/about" className="btn btn-outline btn-lg" id="hero-about-btn">
                  Learn More
                </Link>
              </div>
            </div>

            {/* Right: Auth card */}
            <div className="hero-auth" id="hero-auth-card">
              {/* Tabs */}
              <div className="auth-tabs" role="tablist">
                <button
                  role="tab"
                  className={`auth-tab${activeTab === 'login' ? ' active' : ''}`}
                  onClick={() => { setActiveTab('login'); setLoginError(''); setRegError(''); }}
                  id="tab-login"
                  type="button"
                >
                  Sign In
                </button>
                <button
                  role="tab"
                  className={`auth-tab${activeTab === 'register' ? ' active' : ''}`}
                  onClick={() => { setActiveTab('register'); setLoginError(''); setRegError(''); }}
                  id="tab-register"
                  type="button"
                >
                  Create Account
                </button>
              </div>

              {/* ── Login Form ── */}
              {activeTab === 'login' && (
                <div>
                  {loginError && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                      <AlertTriangle size={14} />
                      <span>{loginError}</span>
                    </div>
                  )}
                  <form className="auth-form" onSubmit={handleLogin} id="login-form">
                    <div>
                      <label className="label" htmlFor="login-email">Email Address</label>
                      <div className="input-group">
                        <Mail className="input-icon" size={15} />
                        <input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
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
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="input input-with-icon"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      id="login-submit-btn"
                      className="btn btn-primary btn-block"
                      disabled={loginSubmitting}
                    >
                      {loginSubmitting ? 'Signing in…' : 'Sign In'}
                      <ArrowRight size={15} />
                    </button>
                  </form>

                  <div className="auth-divider"><span>Or continue with</span></div>

                  <GoogleLoginButton role="TOURIST" text="continue_with" onError={(err) => setLoginError(err)} />

                  <div className="auth-divider">Quick Demo</div>

                  <button
                    type="button"
                    id="demo-fill-btn"
                    className="auth-demo-btn"
                    onClick={fillDemo}
                  >
                    <Sparkles size={14} color="var(--amber-500)" />
                    Fill Tourist Demo Credentials
                  </button>
                </div>
              )}

              {/* ── Register Form ── */}
              {activeTab === 'register' && (
                <div>
                  {regError && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                      <AlertTriangle size={14} />
                      <span>{regError}</span>
                    </div>
                  )}
                  <form className="auth-form" onSubmit={handleRegister} id="register-form">
                    <div>
                      <label className="label" htmlFor="reg-name">Full Name</label>
                      <div className="input-group">
                        <User className="input-icon" size={15} />
                        <input
                          id="reg-name"
                          type="text"
                          value={regName}
                          onChange={e => setRegName(e.target.value)}
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
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
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
                            value={regPhone}
                            onChange={e => setRegPhone(e.target.value)}
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
                            value={regPassword}
                            onChange={e => setRegPassword(e.target.value)}
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
                      className="btn btn-primary btn-block"
                      disabled={regSubmitting}
                    >
                      {regSubmitting ? 'Creating Account…' : 'Create Account'}
                      <ArrowRight size={15} />
                    </button>
                  </form>

                  <div className="auth-divider"><span>Or sign up with</span></div>

                  <GoogleLoginButton role="TOURIST" text="signup_with" onError={(err) => setRegError(err)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section style={{ background: 'var(--bg-white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '4rem 1.5rem' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2.5rem' }}>
            <p className="section-kicker">Capabilities</p>
            <h2>Everything a tourist needs to stay safe</h2>
          </div>
          <div className="feature-grid">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <article key={f.title} className="feature-card">
                  <div className={`feature-icon icon-box icon-box-md ${f.cls}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Emergency Numbers Strip ── */}
      <section style={{ background: 'var(--navy-900)', padding: '3rem 1.5rem' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--red-400)', marginBottom: '0.5rem' }}>Emergency</p>
            <h2 style={{ color: 'white', fontSize: '1.5rem' }}>Key helpline numbers</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', maxWidth: 900, margin: '0 auto' }}>
            {[
              { label: 'National Emergency', num: '112' },
              { label: 'Police', num: '100' },
              { label: 'Women Helpline', num: '1091' },
              { label: 'Ambulance', num: '102' },
              { label: 'Fire', num: '101' },
              { label: 'Tourist Helpline', num: '1363' },
            ].map(e => (
              <a
                key={e.num}
                href={`tel:${e.num}`}
                id={`landing-emergency-${e.num}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1.5rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--r-xl)',
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--red-400)', fontVariantNumeric: 'tabular-nums' }}>{e.num}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--navy-400)' }}>{e.label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tap to Call</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
