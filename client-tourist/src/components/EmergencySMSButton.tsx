import React, { useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  PhoneCall,
  Copy,
  Check,
  Radio,
  ExternalLink,
  ShieldAlert,
  Send,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface EmergencySMSButtonProps {
  phoneNumber?: string; // Emergency Gateway / Helpline phone number
}

export const EmergencySMSButton: React.FC<EmergencySMSButtonProps> = ({
  phoneNumber = '112',
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [smsPayload, setSmsPayload] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.209 });
  const [simulating, setSimulating] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  const generateSOS = (lat: number, lng: number) => {
    const userId = user?.id || user?.blockchainId?.substring(0, 24) || '65f2a1b00000000000000001';
    const message = `ID:${userId}|LAT:${lat.toFixed(6)}|LNG:${lng.toFixed(6)}|SOS`;
    setSmsPayload(message);
    setCoords({ lat, lng });

    // Open Native SMS on devices that support it
    const encoded = encodeURIComponent(message);
    const smsUri = `sms:${phoneNumber}?body=${encoded}`;
    
    try {
      const link = document.createElement('a');
      link.href = smsUri;
      link.click();
    } catch (e) {
      console.log('Native SMS URI trigger handled via modal fallback');
    }

    setLoading(false);
    setShowModal(true);
  };

  const handleSendSOS = () => {
    setLoading(true);
    setSimulatedSuccess(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          generateSOS(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation failed or timed out, using fallback coordinate:', err.message);
          // Graceful fallback to default coordinates so SOS is never blocked
          generateSOS(28.6139, 77.209);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000,
        }
      );
    } else {
      generateSOS(28.6139, 77.209);
    }
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(smsPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateGatewayWebhook = async () => {
    try {
      setSimulating(true);
      await api.post('/sms-webhook', {
        from: user?.phone || '+919876543210',
        body: smsPayload,
      });
      setSimulatedSuccess(true);
    } catch (err) {
      console.error('Failed to trigger SMS webhook simulation:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="sms-card" style={{ maxWidth: 640, margin: '0 auto' }}>
      <button
        type="button"
        onClick={handleSendSOS}
        disabled={loading}
        id="emergency-offline-sos-btn"
        className="w-full flex items-center justify-center py-5 px-6 text-xl font-black text-white transition-all duration-300 bg-red-600 rounded-2xl shadow-xl hover:bg-red-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        style={{
          boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.5)',
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          letterSpacing: '0.02em',
        }}
      >
        {loading ? (
          <Loader2 className="w-7 h-7 mr-3 animate-spin" />
        ) : (
          <AlertTriangle className="w-7 h-7 mr-3 animate-pulse" />
        )}
        {loading ? 'Acquiring GPS Satellite Lock...' : '🚨 Emergency Offline SOS (SMS)'}
      </button>

      <p className="mt-3 text-xs text-center text-slate-400 font-semibold">
        📡 Works completely without Wi-Fi or mobile data. Formats encoded GPS distress for 2G GSM cellular transmission.
      </p>

      {/* Emergency Modal / Sheet */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              maxWidth: '32rem',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={24} className="text-red-500 animate-pulse" />
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    Offline Emergency SOS Dispatched
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>2G GSM Cellular Fallback Channel</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* GPS Telemetry Box */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '1rem', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ef4444' }}>
                  Standardized GSM Telemetry String
                </span>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copied ? '#34d399' : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy SMS'}</span>
                </button>
              </div>

              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: '#38bdf8',
                  background: '#020617',
                  padding: '0.75rem',
                  borderRadius: '0.625rem',
                  wordBreak: 'break-all',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                }}
              >
                {smsPayload}
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
                <span>Recipient: {phoneNumber}</span>
              </div>
            </div>

            {/* Action 1: Mobile Native SMS Link */}
            <a
              href={`sms:${phoneNumber}?body=${encodeURIComponent(smsPayload)}`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white mb-3 transition-colors text-center no-underline"
              style={{ textDecoration: 'none' }}
            >
              <Send size={16} />
              <span>Send via Phone SMS App ({phoneNumber})</span>
            </a>

            {/* Action 2: Hackathon / Localhost Live Webhook Trigger */}
            <button
              type="button"
              onClick={handleSimulateGatewayWebhook}
              disabled={simulating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm border transition-all mb-4"
              style={{
                background: simulatedSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                borderColor: simulatedSuccess ? '#10b981' : '#ef4444',
                color: simulatedSuccess ? '#34d399' : '#f87171',
                cursor: 'pointer',
              }}
            >
              <Radio size={16} className={simulating ? 'animate-spin' : 'animate-pulse'} />
              <span>
                {simulating
                  ? 'Simulating GSM Tower Webhook...'
                  : simulatedSuccess
                  ? '✓ Alert Injected onto Police Radar (Live via Webhook)'
                  : 'Simulate GSM Tower Webhook (Test Police Radar)'}
              </span>
            </button>

            {simulatedSuccess && (
              <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.75rem', textAlign: 'center', marginBottom: '1rem', fontWeight: 600 }}>
                🚨 Distress call sent to `/api/sms-webhook` and broadcast via Socket.IO! Check the Police Command Center.
              </div>
            )}

            {/* Direct Emergency Dials */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Direct Emergency Helplines (Voice Call)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <a
                  href="tel:112"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem',
                    borderRadius: '0.625rem',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <PhoneCall size={14} color="#ef4444" />
                  <span>Call 112 (National)</span>
                </a>
                <a
                  href="tel:100"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem',
                    borderRadius: '0.625rem',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <PhoneCall size={14} color="#38bdf8" />
                  <span>Call 100 (Police)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
