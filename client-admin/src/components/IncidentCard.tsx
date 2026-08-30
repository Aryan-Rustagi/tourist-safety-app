import React from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  MapPin,
  Flame,
  UserX,
  Stethoscope,
  HelpCircle,
  User,
} from 'lucide-react';

export interface IncidentData {
  _id: string;
  title: string;
  description: string;
  category: 'THEFT' | 'HARASSMENT' | 'SCAM' | 'MEDICAL' | 'NATURAL_HAZARD' | 'OTHER';
  latitude: number;
  longitude: number;
  address?: string;
  isVerified: boolean;
  createdAt: string;
  userId?: {
    name?: string;
    phone?: string;
  };
}

export const IncidentCard: React.FC<{
  incident: IncidentData;
  onVerifyToggle?: () => void;
  showAdminControls?: boolean;
}> = ({ incident, onVerifyToggle, showAdminControls }) => {
  const getCategoryIcon = (category: IncidentData['category']) => {
    switch (category) {
      case 'THEFT':
        return <UserX size={16} color="#fbbf24" />;
      case 'HARASSMENT':
        return <AlertCircle size={16} color="#fb7185" />;
      case 'SCAM':
        return <AlertCircle size={16} color="#f97316" />;
      case 'MEDICAL':
        return <Stethoscope size={16} color="#34d399" />;
      case 'NATURAL_HAZARD':
        return <Flame size={16} color="#f43f5e" />;
      default:
        return <HelpCircle size={16} color="#38bdf8" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="card card-interactive flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-sm mb-sm">
          <div className="flex items-center gap-sm">
            <div className="icon-box icon-box-sm icon-box-slate" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
              {getCategoryIcon(incident.category)}
            </div>
            <div>
              <span className="label" style={{ marginBottom: 0 }}>
                {incident.category.replace('_', ' ')}
              </span>
              <h4 className="text-sm font-bold text-gray-900">{incident.title}</h4>
            </div>
          </div>

          {incident.isVerified ? (
            <span className="badge badge-emerald">
              <ShieldCheck size={12} />
              Verified
            </span>
          ) : (
            <span className="badge badge-slate">Unverified</span>
          )}
        </div>

        <p className="text-xs text-secondary mt-sm mb-md line-clamp-3">{incident.description}</p>
        
        {showAdminControls && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 mb-4 flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            <div>
              <strong>Reported by:</strong> {incident.userId?.name || 'Anonymous User'} 
              {incident.userId?.phone && ` (${incident.userId.phone})`}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-sm text-2xs text-muted" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
        <div className="flex items-center gap-xs">
          <MapPin size={12} />
          <span>{incident.address || `${incident.latitude.toFixed(3)}, ${incident.longitude.toFixed(3)}`}</span>
        </div>
        <div className="flex items-center gap-xs text-gray-600 font-medium">
          <Clock size={12} />
          <span>{formatDate(incident.createdAt)}</span>
        </div>
        
        {showAdminControls && onVerifyToggle && (
          <div style={{ width: '100%', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={onVerifyToggle}
              className={`btn btn-sm btn-block ${incident.isVerified ? 'btn-secondary' : 'btn-success'}`}
              style={{ fontWeight: 700 }}
            >
              {incident.isVerified ? 'Revoke Verification' : 'Verify & Publish'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

