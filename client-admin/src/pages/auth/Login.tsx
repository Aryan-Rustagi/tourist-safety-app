import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate(redirect);
    } else {
      setErrorMsg(res.message || 'Login failed. Please check credentials.');
    }
  };

  // Quick preset loader for test credentials
  const fillDemoAccount = () => {
    setEmail('admin@safetour.app');
    setPassword('password123');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <Shield size={22} color="#fff" />
          </div>
          <h1>Welcome Back</h1>
          <p className="page-desc">
            Sign in to access your safety dashboard and emergency channels
          </p>
        </div>

        <div className="card">
          {errorMsg && (
            <div className="alert alert-error">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <label className="label">
                Email Address
              </label>
              <div className="input-group">
                <Mail className="input-icon" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="input input-with-icon"
                />
              </div>
            </div>

            <div>
              <label className="label">
                Password
              </label>
              <div className="input-group">
                <Lock className="input-icon" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input input-with-icon"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-block"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="demo-section" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              id="demo-admin-btn"
              onClick={fillDemoAccount}
              className="btn btn-secondary btn-sm btn-block"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Sparkles size={14} color="#fbbf24" />
              <span>Demo</span>
            </button>
          </div>
        </div>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
