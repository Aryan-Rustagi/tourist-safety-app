import React, { useState, useEffect } from 'react';
import { useAlerts } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Radio, AlertTriangle, X, MapPin } from 'lucide-react';

export const SOSButton: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { myActiveAlert, triggerSOS, cancelAlert } = useAlerts();

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string>('Detecting current GPS location...');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [customMsg, setCustomMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setAddress(
            `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
          );
          setIsLocating(false);
        },
        (error) => {
          console.warn('Geolocation error or permission denied:', error.message);
          setCoords({ latitude: 26.9124, longitude: 75.7873 });
          setAddress('Jaipur (Fallback GPS)');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setCoords({ latitude: 26.9124, longitude: 75.7873 });
      setAddress('Jaipur (Fallback GPS)');
      setIsLocating(false);
    }
  };

  const handleStartSOS = () => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/dashboard';
      return;
    }
    setShowConfirmModal(true);
  };

  const executeSOSDispatch = async () => {
    setIsSubmitting(true);
    const activeCoords = coords || { latitude: 26.9124, longitude: 75.7873 };

    await triggerSOS({
      latitude: activeCoords.latitude,
      longitude: activeCoords.longitude,
      address,
      message: customMsg || 'EMERGENCY SOS: Tourist in distress! Immediate rescue required.',
    });

    setIsSubmitting(false);
    setShowConfirmModal(false);
  };

  const handleCancelSOS = async () => {
    if (myActiveAlert) {
      await cancelAlert(myActiveAlert._id);
    }
  };

  return (
    <div className="sos-container">
      {myActiveAlert ? (
        <div className="sos-active-panel">
          <div className="flex items-center justify-center gap-sm text-rose mb-md">
            <Radio size={24} className="animate-spin" />
            <span className="font-bold text-lg">SOS BEACON ACTIVE</span>
          </div>

          <p className="text-sm text-secondary mb-md">
            Emergency distress signal transmitted to Police and Rescue Command Center. Responders are tracking your location.
          </p>

          <div className="location-box text-xs text-secondary mb-md">
            <div>
              Status: <span className="text-rose font-semibold">{myActiveAlert.status}</span>
            </div>
            <div>
              GPS:{' '}
                <span className="text-gray-900">
                {myActiveAlert.latitude.toFixed(4)}, {myActiveAlert.longitude.toFixed(4)}
              </span>
            </div>
            {myActiveAlert.acknowledgedBy && (
              <div className="text-emerald font-medium mt-xs">✓ Acknowledged by Rescue Dispatch</div>
            )}
          </div>

          <button type="button" onClick={handleCancelSOS} className="btn btn-secondary btn-block">
            <X size={16} />
            Cancel False Alarm
          </button>
        </div>
      ) : (
        <div className="relative flex flex-col items-center">
          <button type="button" onClick={handleStartSOS} disabled={isSubmitting} className="sos-btn">
            <ShieldAlert size={72} />
            <span className="sos-btn-text">SOS</span>
            <span className="sos-btn-sub">One-Touch Rescue</span>
          </button>

          <div className="sos-location-badge">
            <MapPin size={14} color="#fb7185" />
            <span>{isLocating ? 'Acquiring GPS...' : address}</span>
            <button type="button" onClick={fetchCurrentLocation} className="btn btn-ghost btn-sm">
              Refresh
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="icon-box icon-box-md icon-box-rose">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3>Confirm Emergency SOS</h3>
                <p className="text-xs text-muted">Broadcast distress signal to emergency rescue units</p>
              </div>
            </div>

            <label className="label">Optional Emergency Note</label>
            <input
              type="text"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder="e.g. Lost in market, medical emergency, injured..."
              className="input"
            />
            <div className="location-box text-xs text-secondary mt-md">
              GPS Broadcast: {address}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowConfirmModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="button" onClick={executeSOSDispatch} disabled={isSubmitting} className="btn btn-danger flex-1">
                {isSubmitting ? 'Dispatching...' : 'Transmit SOS Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
