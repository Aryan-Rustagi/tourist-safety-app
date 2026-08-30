import React, { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, ShieldAlert, X } from 'lucide-react';
import { checkGeofence, GeofenceResponse } from '../services/aiService';

export const AiGeoFenceAlert: React.FC = () => {
  const [alertData, setAlertData] = useState<GeofenceResponse | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performCheck = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const result = await checkGeofence(latitude, longitude);
            
            if (result.is_in_zone) {
              setAlertData(result);
              setIsVisible(true);
            } else {
              setIsVisible(false);
            }
          } catch (err: any) {
            console.error("Geofence check failed", err);
            setError(err.message);
          }
        },
        (err) => console.error("GeoFence GPS Error:", err)
      );
    };

    performCheck();
    const interval = setInterval(performCheck, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !alertData) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-md transition-all duration-500 ease-out">
      <div 
        className="relative overflow-hidden bg-white/95 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_20px_60px_-15px_rgba(239,68,68,0.4)] transform scale-100 opacity-100 transition-all duration-300"
      >
        {/* Animated Glow Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 bg-gray-100/50 hover:bg-gray-100 rounded-full p-2 transition-all duration-200 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center relative z-10 mt-2">
          {/* Icon Container */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-40 animate-pulse" />
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg relative border-4 border-white">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h2 className="text-sm font-black text-red-600 tracking-widest uppercase mb-1">
            Safety Warning
          </h2>
          <h3 className="text-2xl font-extrabold text-gray-900 mb-6 leading-tight">
            You are entering a <span className="text-red-600">High Risk Zone</span>
          </h3>
          
          {/* Details Card */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 w-full mb-8 text-left shadow-inner">
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Detected Area</p>
                <p className="text-gray-800 font-medium">{alertData.zone_name}</p>
              </div>
            </div>
            
            <div className="w-full h-px bg-gray-200 my-3" />
            
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Threat Level</p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <p className="text-red-600 font-bold">{alertData.risk_level}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-8 leading-relaxed px-2">
            Please exercise extreme caution or leave the area immediately. Use the SOS button if you feel unsafe.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button 
              onClick={() => setIsVisible(false)}
              className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 text-sm"
            >
              Acknowledge
            </button>
            <button 
              onClick={() => setIsVisible(false)}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-xl transition-all duration-200 text-sm shadow-[0_8px_20px_-6px_rgba(225,29,72,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(225,29,72,0.6)] hover:-translate-y-0.5"
            >
              Leave Area
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
