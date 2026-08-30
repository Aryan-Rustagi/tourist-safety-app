import React, { useEffect, useRef, useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  role = 'ADMIN',
  text = 'continue_with',
  onSuccess,
  onError,
}) => {
  const { loginWithGoogle, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
            navigate('/');
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
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: text,
            shape: 'rectangular',
            logo_alignment: 'left',
            width: buttonRef.current.clientWidth || 320,
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
  }, [clientId, role, text]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setIsLoading(true);
    try {
      await api.put('/auth/me', { phone: phoneNumber });
      await refreshProfile();
      setShowPhonePrompt(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (err) {
      if (onError) onError('Failed to update phone number');
    } finally {
      setIsLoading(false);
    }
  };

  if (showPhonePrompt) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 my-2">
        <h3 className="text-md font-semibold mb-2">Complete your profile</h3>
        <p className="text-xs text-gray-500 mb-4 text-center">Please provide your phone number for safety alerts.</p>
        <form onSubmit={handlePhoneSubmit} className="w-full flex flex-col space-y-3">
          <input
            type="tel"
            placeholder="Phone Number (e.g. +1234567890)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center my-2 min-h-[44px]">
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
};
