import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Loader2,
  PhoneCall,
  Copy,
  Check,
  Radio,
  ShieldAlert,
  Send,
  X,
  MapPinOff,
  MapPin,
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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'acquired' | 'failed' | 'idle'>('idle');
  const [simulating, setSimulating] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const getSmsUri = (phone: string, message: string) => {
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    return `sms:${phone}${separator}body=${encodeURIComponent(message)}`;
  };

  const generateSOS = (lat: number | null, lng: number | null, isLocationAcquired: boolean) => {
    const userId = user?.id || user?.blockchainId?.substring(0, 24) || '65f2a1b00000000000000001';
    
    let message: string;
    if (isLocationAcquired && lat !== null && lng !== null) {
      message = `ID:${userId}|LAT:${lat.toFixed(6)}|LNG:${lng.toFixed(6)}|SOS`;
      setCoords({ lat, lng });
      setGpsStatus('acquired');
    } else {
      // Explicitly mark coordinates as unavailable - NEVER spoof hardcoded city coordinates
      message = `ID:${userId}|LAT:0.000000|LNG:0.000000|LOC:UNAVAILABLE|SOS`;
      setCoords(null);
      setGpsStatus('failed');
    }

    setSmsPayload(message);

    // Trigger SMS URI scheme
    const smsUri = getSmsUri(phoneNumber, message);
    try {
      const link = document.createElement('a');
      link.href = smsUri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.log('Native SMS URI trigger handled via modal fallback');
    }

    setLoading(false);
    setShowModal(true);
  };

  const handleSendSOS = () => {
    setLoading(true);
    setSimulatedSuccess(false);
    setSimulationError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          generateSOS(position.coords.latitude, position.coords.longitude, true);
        },
        (err) => {
          console.warn('Geolocation failed or permission denied, flagging location as unavailable:', err.message);
          // Pass null coordinates so SOS is never blocked, but location is explicitly marked unavailable
          generateSOS(null, null, false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    } else {
      generateSOS(null, null, false);
    }
  };

  const handleCopyPayload = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(smsPayload);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = smsPayload;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy payload to clipboard:', err);
    }
  };

  const handleSimulateGatewayWebhook = async () => {
    try {
      setSimulating(true);
      setSimulationError(null);
      await api.post('/sms-webhook', {
        from: user?.phone || '+919876543210',
        body: smsPayload,
      });
      setSimulatedSuccess(true);
    } catch (err: any) {
      console.error('Failed to trigger SMS webhook simulation:', err);
      setSimulationError(err.response?.data?.message || err.message || 'Failed to simulate GSM webhook');
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-modal-title"
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
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
                  <h3 id="emergency-modal-title" style={{ fontSize: '1.125rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    Offline Emergency SOS Dispatched
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>2G GSM Cellular Fallback Channel</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* GPS Warning Banner if GPS Lock Failed */}
            {gpsStatus === 'failed' && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '0.75rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                color: '#fcd34d',
                fontSize: '0.75rem',
                lineHeight: 1.4,
              }}>
                <MapPinOff size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', color: '#fbbf24', fontWeight: 700 }}>
                    GPS Lock Unavailable
                  </strong>
                  Location was not acquired. Distress signal is encoded with <code>LOC:UNAVAILABLE</code> so authorities do not dispatch to false coordinates. Cellular towers will perform emergency triangulation.
                </div>
              </div>
            )}

            {/* GPS Success Banner if GPS Lock Acquired */}
            {gpsStatus === 'acquired' && coords && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '0.75rem',
                padding: '0.625rem 0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#6ee7b7',
                fontSize: '0.75rem',
              }}>
                <MapPin size={16} style={{ color: '#34d399', flexShrink: 0 }} />
                <span>
                  <strong>GPS Satellite Lock Active:</strong> High-precision coordinates ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}) attached to distress signal.
                </span>
              </div>
            )}

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

              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>
                  GPS:{' '}
                  {coords ? (
                    <span style={{ color: '#34d399', fontWeight: 700 }}>
                      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </span>
                  ) : (
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                      UNAVAILABLE (0.0000, 0.0000)
                    </span>
                  )}
                </span>
                <span>Recipient: {phoneNumber}</span>
              </div>
            </div>

            {/* Action 1: Mobile Native SMS Link */}
            <a
              href={getSmsUri(phoneNumber, smsPayload)}
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm border transition-all mb-3"
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

            {simulationError && (
              <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.75rem', textAlign: 'center', marginBottom: '1rem', fontWeight: 600 }}>
                ⚠️ Webhook Simulation Failed: {simulationError}
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
