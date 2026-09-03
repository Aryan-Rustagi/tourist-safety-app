import React, { useEffect, useRef, useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShieldCheck, Phone, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleLoginButtonProps {
  role?: UserRole;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onSuccess?: () => void;
  onError?: (err: string) => void;
}

export const GoogleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  role = 'TOURIST',
  text = 'continue_with',
  onSuccess,
  onError,
}) => {
  const { user, loginWithGoogle, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);

  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promptError, setPromptError] = useState('');

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '72233571523-ni40orspj4s9fc5qdt6q0kpkamg6vp58.apps.googleusercontent.com';

  const handleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      if (onError) onError('No credential received from Google');
      return;
    }

    try {
      const res = await loginWithGoogle(response.credential, role);
      if (res.success) {
        if (res.user && !res.user.phone) {
          setShowPhonePrompt(true);
        } else {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate(role === 'ADMIN' ? '/' : '/dashboard');
          }
        }
      } else {
        if (onError) onError(res.message || 'Google authentication failed');
      }
    } catch (err: any) {
      if (onError) onError(err.message || 'An error occurred during Google sign-in');
    }
  };

  useEffect(() => {
    if (showPhonePrompt) return;

    const initializeGoogle = () => {
      if (!window.google || !buttonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Clear previous buttons if any
        if (buttonRef.current) {
          buttonRef.current.innerHTML = '';
          const parentWidth = buttonRef.current.parentElement?.clientWidth || buttonRef.current.clientWidth || 360;
          const targetWidth = Math.min(Math.max(Math.floor(parentWidth), 240), 400);

          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: text,
            shape: 'rectangular',
            logo_alignment: 'left',
            width: targetWidth,
          });
        }
      } catch (err) {
        console.error('Google Sign-In initialization error:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }
  }, [clientId, role, text, showPhonePrompt]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromptError('');
    const cleaned = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleaned) {
      setPromptError('Please enter a valid phone number');
      return;
    }

    const fullPhone = cleaned.startsWith('+') ? cleaned : `${countryCode}${cleaned}`;
    setIsLoading(true);

    try {
      await api.put('/auth/me', { phone: fullPhone });
      await refreshProfile();
      setShowPhonePrompt(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(role === 'ADMIN' ? '/' : '/dashboard');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update phone number';
      setPromptError(msg);
      if (onError) onError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchGoogleAccount = () => {
    // Reset any temporary state and allow user to pick another Google account
    localStorage.removeItem('tourist_safety_token');
    localStorage.removeItem('tourist_safety_user');
    setShowPhonePrompt(false);
    setPhoneNumber('');
    setPromptError('');
    setTimeout(() => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt();
      }
    }, 100);
  };

  const handleSkip = () => {
    setShowPhonePrompt(false);
    if (onSuccess) {
      onSuccess();
    } else {
      navigate(role === 'ADMIN' ? '/' : '/dashboard');
    }
  };

  if (showPhonePrompt) {
    return (
      <div className="google-phone-prompt-card" id="google-phone-prompt-section">
        {/* Header with Safety Theme */}
        <div className="phone-prompt-header">
          <div className="phone-prompt-icon-badge">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="phone-prompt-title">Emergency Contact Setup</h3>
            <p className="phone-prompt-subtitle">One last step to secure your safety profile</p>
          </div>
        </div>

        {/* Connected Google Account Pill */}
        <div className="phone-prompt-user-pill">
          <GoogleIcon size={16} />
          {user?.avatar ? (
            <img src={user.avatar} alt="Google avatar" />
          ) : null}
          <span className="phone-prompt-user-email">
            {user?.email || 'Google Account Connected'}
          </span>
          <span className="phone-prompt-verified-tag">
            <CheckCircle2 size={12} />
            Verified
          </span>
        </div>

        {/* Prominent Safety Notice */}
        <div className="phone-prompt-safety-note">
          <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--teal-700)' }} />
          <span>
            <strong>Required for Emergency SOS:</strong> Your phone number enables automated SMS broadcasts to rescue teams & your emergency contacts during distress.
          </span>
        </div>

        {promptError && (
          <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}>
            <AlertTriangle size={14} />
            <span>{promptError}</span>
          </div>
        )}

        {/* Phone Input Form */}
        <form onSubmit={handlePhoneSubmit} id="google-phone-form">
          <label className="label" htmlFor="google-phone-input" style={{ marginBottom: '0.35rem' }}>
            Mobile Number (with country code)
          </label>
          <div className="phone-prompt-input-row">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="phone-prompt-country-code"
              aria-label="Country Code"
            >
              <option value="+91">🇮🇳 +91 (IN)</option>
              <option value="+1">🇺🇸 +1 (US)</option>
              <option value="+44">🇬🇧 +44 (UK)</option>
              <option value="+61">🇦🇺 +61 (AU)</option>
              <option value="+971">🇦🇪 +971 (AE)</option>
              <option value="+33">🇫🇷 +33 (FR)</option>
              <option value="+49">🇩🇪 +49 (DE)</option>
              <option value="+81">🇯🇵 +81 (JP)</option>
              <option value="+65">🇸🇬 +65 (SG)</option>
              <option value="+880">🇧🇩 +880 (BD)</option>
              <option value="+977">🇳🇵 +977 (NP)</option>
              <option value="+94">🇱🇰 +94 (LK)</option>
            </select>
            <div className="input-group" style={{ flex: 1 }}>
              <Phone className="input-icon" size={15} />
              <input
                id="google-phone-input"
                type="tel"
                placeholder="98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="input input-with-icon"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            id="google-phone-submit-btn"
            disabled={isLoading}
            className="phone-prompt-submit-btn"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Profile…</span>
              </>
            ) : (
              <>
                <span>Save & Continue to Safety Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Sign In with Google Auth / Change Account Button */}
          <button
            type="button"
            id="switch-google-account-btn"
            onClick={handleSwitchGoogleAccount}
            className="phone-prompt-google-btn"
          >
            <GoogleIcon size={18} />
            <span>Sign in with a different Google account</span>
          </button>

          {/* Skip Link */}
          <button
            type="button"
            id="skip-phone-btn"
            onClick={handleSkip}
            className="phone-prompt-skip-btn"
          >
            Skip for now & continue to dashboard →
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="google-auth-wrapper">
      <div ref={buttonRef} className="google-auth-btn-slot" />
    </div>
  );
};
