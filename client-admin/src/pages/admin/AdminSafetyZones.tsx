import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { SafetyZoneData, ZoneCard } from '../../components/ZoneCard';
import { SafetyMap } from '../../components/SafetyMap';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const AdminSafetyZones: React.FC = () => {
  const [zones, setZones] = useState<SafetyZoneData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.209);
  const [radiusMeters, setRadiusMeters] = useState<number>(500);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    document.title = 'Safety Perimeters — SafeTour Admin';
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/safety-zones');
      if (res.data?.success) {
        setZones(res.data.zones || []);
      }
    } catch (err) {
      console.warn('Failed to load zones', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setRiskLevel('LOW');
    setLatitude(28.6139);
    setLongitude(77.209);
    setRadiusMeters(500);
    setShowModal(true);
  };

  const handleOpenEdit = (zone: SafetyZoneData) => {
    setEditingId(zone._id);
    setName(zone.name);
    setDescription(zone.description || '');
    setRiskLevel(zone.riskLevel);
    setLatitude(zone.latitude);
    setLongitude(zone.longitude);
    setRadiusMeters(zone.radiusMeters);
    setShowModal(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      if (editingId) {
        const res = await api.put(`/safety-zones/${editingId}`, {
          name,
          description,
          riskLevel,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
        });
        if (res.data?.success) {
          setFeedback({ type: 'success', message: 'Safety zone updated successfully.' });
        }
      } else {
        const res = await api.post('/safety-zones', {
          name,
          description,
          riskLevel,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
        });
        if (res.data?.success) {
          setFeedback({ type: 'success', message: 'New safety zone perimeter established successfully.' });
        }
      }
      setShowModal(false);
      fetchZones();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save safety perimeter.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this safety perimeter? Tourists will no longer receive alerts for it.')) return;
    try {
      await api.delete(`/safety-zones/${id}`);
      fetchZones();
    } catch (err) {
      console.warn('Failed to delete zone', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="admin-hero-banner">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="admin-hero-badge purple">
                <Layers size={14} />
                Perimeter Control & Hazard Zones
              </div>
              <h2>Safety Perimeters & Geofences</h2>
              <p>
                Manage monitored police safe havens, high-tourist protection corridors, and automated geofence alert radiuses.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="admin-btn-purple"
            >
              <Plus size={18} />
              <span>Create New Perimeter</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle size={18} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={18} className="text-red-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Interactive Tactical Map */}
      <section className="admin-panel-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Perimeter Radar Map</h3>
            <p className="text-xs text-slate-500">Visual representation of active safety boundaries</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold font-mono">
            {zones.length} Active Perimeters
          </span>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          {zones.length > 0 ? (
            <SafetyMap zones={zones} />
          ) : (
            <div className="p-12 text-center bg-slate-50 text-slate-500 text-sm">
              Map will render active perimeters once created.
            </div>
          )}
        </div>
      </section>

      {/* Zone Cards Grid */}
      <section className="admin-panel-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Active Geofence Boundaries</h3>
            <p className="text-xs text-slate-500">All registered danger zones and safe haven locations</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-3 gap-4">
            <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        ) : zones.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <Layers size={32} />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">No Safety Perimeters Defined</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Define tourist safe zones, police security kiosks, or danger perimeters to notify tourists automatically when they enter.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-purple-700 transition-all"
            >
              <Plus size={16} />
              <span>Create First Perimeter</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-3 gap-4">
            {zones.map((zone) => (
              <div key={zone._id} className="relative group">
                <ZoneCard zone={zone} />
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(zone)}
                    className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm transition-all"
                    title="Edit Perimeter"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(zone._id)}
                    className="p-1.5 rounded-lg bg-white/90 hover:bg-red-50 text-red-600 border border-red-200 shadow-sm transition-all"
                    title="Delete Perimeter"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal for Add / Edit Zone */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Layers size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {editingId ? 'Edit Safety Perimeter' : 'Create Safety Perimeter'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure geofence boundary coordinates</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Perimeter Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tourist Police Safe Haven"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 24/7 manned police assistance kiosk with emergency dispatch"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Security Threat & Risk Level
                </label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                >
                  <option value="LOW">LOW — Safe Haven (Police Kiosk / Embassy)</option>
                  <option value="MEDIUM">MEDIUM — Moderate Caution Area</option>
                  <option value="HIGH">HIGH — Elevated Risk Perimeter</option>
                  <option value="CRITICAL">CRITICAL — Red Danger Hazard Zone</option>
                </select>
              </div>

              <div className="grid grid-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Center Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Center Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Geofence Radius (Meters)
                </label>
                <input
                  type="number"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10))}
                  required
                  min={50}
                  step={50}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition-all"
                >
                  {editingId ? 'Save Updates' : 'Establish Perimeter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
