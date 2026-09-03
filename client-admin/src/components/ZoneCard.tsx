import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info, MapPin } from 'lucide-react';

export interface SafetyZoneData {
  _id: string;
  name: string;
  description?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export const ZoneCard: React.FC<{
  zone: SafetyZoneData;
  distanceMeters?: number;
  isSelected?: boolean;
  onSelect?: () => void;
}> = ({ zone, distanceMeters, isSelected, onSelect }) => {
  const getRiskBadge = (level: SafetyZoneData['riskLevel']) => {
    switch (level) {
      case 'LOW':
        return { label: 'Safe Haven / Verified Zone', icon: <ShieldCheck size={14} />, cls: 'badge-emerald' };
      case 'MEDIUM':
        return { label: 'Moderate Caution', icon: <Info size={14} />, cls: 'badge-amber' };
      case 'HIGH':
        return { label: 'High Risk / Alert Area', icon: <AlertTriangle size={14} />, cls: 'badge-orange' };
      case 'CRITICAL':
        return { label: 'Critical Hazard / Red Zone', icon: <AlertOctagon size={14} />, cls: 'badge-rose animate-pulse' };
    }
  };

  const badge = getRiskBadge(zone.riskLevel);

  return (
    <div
      onClick={onSelect}
      className={`card card-interactive flex flex-col justify-between cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-purple-600 border-purple-500 bg-purple-50/20 shadow-md shadow-purple-600/10'
          : 'hover:border-slate-300'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-sm mb-sm">
          <h4>{zone.name}</h4>
          <span className={`badge ${badge.cls}`} title={badge.label}>
            {badge.icon}
            {zone.riskLevel}
          </span>
        </div>
        <p className="text-xs text-secondary line-clamp-2 mb-md">
          {zone.description || 'Monitored area with perimeter surveillance and safety assistance.'}
        </p>
      </div>
      <div className="flex items-center justify-between text-xs text-muted" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
        <div className="flex items-center gap-xs">
          <MapPin size={14} />
          <span>
            {zone.latitude.toFixed(3)}, {zone.longitude.toFixed(3)}
          </span>
        </div>
        <div className="font-mono">
          Radius: {zone.radiusMeters}m{distanceMeters !== undefined ? ` • ~${distanceMeters}m away` : ''}
        </div>
      </div>
    </div>
  );
};
