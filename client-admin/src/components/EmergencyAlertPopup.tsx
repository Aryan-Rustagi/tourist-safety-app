import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { AlertTriangle, MapPin, X } from 'lucide-react';

interface AlertData {
  _id?: string;
  userId?: any;
  latitude: number;
  longitude: number;
  message?: string;
  status?: string;
}

const SOCKET_URL =
  (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '') || 'http://localhost:5005';

export const EmergencyAlertPopup: React.FC = () => {
  const [alert, setAlert] = useState<AlertData | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket: Socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Admin] Socket.io connected for EmergencyAlertPopup');
      // Optionally join the responders channel
      socket.emit('join_responders');
    });

    // Listen for new SOS alerts
    socket.on('new_sos_alert', (data: AlertData) => {
      console.log('[Admin] Received new SOS alert:', data);
      setAlert(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!alert) return null;

  const handleDismiss = () => {
    setAlert(null);
  };

  const handleDispatchHelp = () => {
    window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, '_blank');
  };

  const userId =
    typeof alert.userId === 'object' && alert.userId !== null
      ? alert.userId._id
      : alert.userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-6 overflow-hidden bg-white border border-red-200 rounded-xl shadow-lg">
        
        {/* Blinking red background glow effect */}
        <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-center w-20 h-20 mb-4 bg-red-600 rounded-full shadow-lg shadow-red-500/50 animate-bounce">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>

          <h2 className="mb-2 text-3xl font-black text-red-700 uppercase tracking-widest">
            Critical Emergency
          </h2>
          
          <div className="w-full h-px mb-4 bg-red-100" />

          <div className="w-full space-y-4 font-mono text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-gray-400 uppercase">User ID</span>
              <span className="font-bold text-red-400">{userId || 'UNKNOWN'}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-gray-400 uppercase">Coordinates</span>
              <div className="flex items-center font-bold text-cyan-400">
                <MapPin className="w-4 h-4 mr-2" />
                {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full gap-3 mt-6 sm:flex-row">
            <button
              onClick={handleDispatchHelp}
              className="flex-1 px-6 py-3 font-bold text-white transition-all bg-red-600 rounded-lg hover:bg-red-700 active:scale-95 shadow-sm flex items-center justify-center"
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              DISPATCH HELP
            </button>
            
            <button
              onClick={handleDismiss}
              className="flex-1 px-6 py-3 font-bold text-gray-700 transition-all bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 flex items-center justify-center"
            >
              <X className="w-5 h-5 mr-2" />
              DISMISS ALERT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
