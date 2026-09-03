import React, { useState, useEffect, useRef } from 'react';
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
  Globe,
  Loader2,
  Sparkles,
  Check,
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

  // Radar Map Focus & Redirect States
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.209]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // OpenStreetMap Ingestion Modal States
  const [showOsmModal, setShowOsmModal] = useState(false);
  const [osmCity, setOsmCity] = useState('delhi');
  const [osmRadius, setOsmRadius] = useState(10000);
  const [osmClearExisting, setOsmClearExisting] = useState(false);
  const [osmCategories, setOsmCategories] = useState<{
    police: boolean;
    hospital: boolean;
    embassy: boolean;
    information: boolean;
  }>({
    police: true,
    hospital: true,
    embassy: true,
    information: true,
  });
  const [isIngesting, setIsIngesting] = useState(false);
  const [osmResult, setOsmResult] = useState<any | null>(null);

  useEffect(() => {
    document.title = 'Safety Perimeters — Safar Setu Admin';
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
    setLatitude(mapCenter[0]);
    setLongitude(mapCenter[1]);
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
    setSelectedZoneId(zone._id);
    setMapCenter([zone.latitude, zone.longitude]);
    setMapZoom(15);
    setShowModal(true);
  };

  const handleSelectZone = (zone: SafetyZoneData) => {
    setSelectedZoneId(zone._id);
    setMapCenter([zone.latitude, zone.longitude]);
    setMapZoom(15);
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleTriggerOsmIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    setOsmResult(null);

    try {
      const activeCategories: string[] = [];
      if (osmCategories.police) activeCategories.push('police');
      if (osmCategories.hospital) activeCategories.push('hospital');
      if (osmCategories.embassy) activeCategories.push('embassy');
      if (osmCategories.information) activeCategories.push('information');

      const res = await api.post('/safety-zones/ingest-osm', {
        city: osmCity,
        radiusMeters: Number(osmRadius),
        clearExisting: osmClearExisting,
        categories: activeCategories,
      });

      if (res.data?.success) {
        setOsmResult(res.data.data);
        setFeedback({
          type: 'success',
          message: res.data.message || 'Real OpenStreetMap data ingested successfully!',
        });
        fetchZones();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to ingest data from OpenStreetMap.',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const latNum = Number(latitude);
      const lngNum = Number(longitude);
      let targetZoneId = editingId;

      if (editingId) {
        const res = await api.put(`/safety-zones/${editingId}`, {
          name,
          description,
          riskLevel,
          latitude: latNum,
          longitude: lngNum,
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
          latitude: latNum,
          longitude: lngNum,
          radiusMeters: Number(radiusMeters),
        });
        if (res.data?.success) {
          targetZoneId = res.data.zone?._id || res.data.data?._id;
          setFeedback({
            type: 'success',
            message: `Perimeter "${name}" created successfully! Map redirected and focused on new zone.`,
          });
        }
      }
      setShowModal(false);
      await fetchZones();

      // REDIRECT / FOCUS MAP ON THE NEW PERIMETER
      setMapCenter([latNum, lngNum]);
      setMapZoom(15);
      if (targetZoneId) {
        setSelectedZoneId(targetZoneId);
      }
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setOsmResult(null);
                  setShowOsmModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl font-bold text-xs backdrop-blur-md shadow-sm transition-all"
                title="Fetch live police stations, hospitals, and embassies via OpenStreetMap Overpass API"
              >
                <Globe size={16} />
                <span>Import Real OSM Data</span>
              </button>

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
      <section ref={mapSectionRef} className="admin-panel-card scroll-mt-20">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Perimeter Radar Map</h3>
            <p className="text-xs text-slate-500">
              {selectedZoneId
                ? 'Focused on selected perimeter. Click any circle or card to redirect.'
                : 'Visual representation of active safety boundaries across India'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedZoneId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedZoneId(null);
                  setMapZoom(13);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
              >
                Reset Focus
              </button>
            )}
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold font-mono">
              {zones.length} Active Perimeters
            </span>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          {zones.length > 0 ? (
            <SafetyMap
              zones={zones}
              center={mapCenter}
              zoom={mapZoom}
              selectedZoneId={selectedZoneId}
              onSelectZone={handleSelectZone}
              onMapClick={(lat, lng) => setMapCenter([lat, lng])}
            />
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
                <ZoneCard
                  zone={zone}
                  isSelected={selectedZoneId === zone._id}
                  onSelect={() => handleSelectZone(zone)}
                />
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(zone);
                    }}
                    className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm transition-all"
                    title="Edit Perimeter"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(zone._id);
                    }}
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
        <div
          className="admin-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="admin-modal-card"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '32rem',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxSizing: 'border-box',
            }}
          >
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#f3e8ff',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {editingId ? 'Edit Safety Perimeter' : 'Create Safety Perimeter'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Configure geofence boundary coordinates</p>
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

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">GPS Coordinates</span>
                <button
                  type="button"
                  onClick={() => {
                    setLatitude(mapCenter[0]);
                    setLongitude(mapCenter[1]);
                  }}
                  style={{
                    fontSize: '11px',
                    color: '#7c3aed',
                    fontWeight: 700,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Use Radar Map Center
                </button>
              </div>

              <div className="grid grid-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="admin-btn-secondary"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.25rem',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    borderRadius: '0.75rem',
                    border: '1px solid #cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.25rem',
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Plus size={16} />
                  <span>{editingId ? 'Save Updates' : 'Establish Perimeter'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Ingesting Real-World OpenStreetMap Data */}
      {showOsmModal && (
        <div
          className="admin-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="admin-modal-card"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '32rem',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxSizing: 'border-box',
            }}
          >
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Globe size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Import Real OpenStreetMap Data
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                    Live Overpass API Ingestion • Police, Hospitals, Embassies & Desks
                  </p>
                </div>
              </div>
            </div>

            {osmResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm mb-1">
                    <Sparkles size={18} />
                    <span>Real-World Data Ingested Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Source: <strong className="font-mono">{osmResult.source}</strong> • Region:{' '}
                    <strong>{osmResult.cityOrArea}</strong>
                  </p>
                </div>

                <div className="grid grid-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="block text-2xl font-black text-slate-900 font-mono">
                      {osmResult.totalInserted}
                    </span>
                    <span className="text-[11px] font-bold uppercase text-slate-500">
                      New Safety Zones
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="block text-2xl font-black text-red-600 font-mono">
                      {osmResult.totalRedZonesInserted}
                    </span>
                    <span className="text-[11px] font-bold uppercase text-slate-500">
                      Red Alert Perimeters
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700 mb-1">Facilities Breakdown:</div>
                  <div className="flex justify-between text-slate-600">
                    <span>🚔 Police Stations & Booths:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {osmResult.breakdown?.police}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>🏥 24/7 Hospitals & Trauma Care:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {osmResult.breakdown?.hospitals}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>🏛️ Embassies & Consular Missions:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {osmResult.breakdown?.embassies}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ℹ️ Tourist Information Desks:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {osmResult.breakdown?.touristInfo}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOsmModal(false);
                      setOsmResult(null);
                    }}
                    className="admin-btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.25rem',
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      borderRadius: '0.75rem',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>Close & View On Tactical Map</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTriggerOsmIngest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Select Target Tourist Destination
                  </label>
                  <select
                    value={osmCity}
                    onChange={(e) => setOsmCity(e.target.value)}
                    disabled={isIngesting}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="delhi">Delhi NCR (Connaught Place, Chanakyapuri, AIIMS)</option>
                    <option value="goa">Goa (Calangute, Baga Beach & Coastal Patrols)</option>
                    <option value="mumbai">Mumbai (Colaba, Marine Drive, Bandra)</option>
                    <option value="jaipur">Jaipur (Pink City, Hawa Mahal, Amer)</option>
                    <option value="agra">Agra (Taj Mahal Protection Sector)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Coverage Search Radius: {osmRadius / 1000} km
                  </label>
                  <input
                    type="range"
                    min="3000"
                    max="20000"
                    step="1000"
                    value={osmRadius}
                    onChange={(e) => setOsmRadius(Number(e.target.value))}
                    disabled={isIngesting}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                    <span>3 km (City Core)</span>
                    <span>10 km (Standard Urban)</span>
                    <span>20 km (Wide Metro)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Public Safety Categories to Ingest
                  </label>
                  <div className="grid grid-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={osmCategories.police}
                        onChange={(e) =>
                          setOsmCategories((c) => ({ ...c, police: e.target.checked }))
                        }
                        disabled={isIngesting}
                        className="rounded text-blue-600"
                      />
                      <span>Police Stations (24/7)</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={osmCategories.hospital}
                        onChange={(e) =>
                          setOsmCategories((c) => ({ ...c, hospital: e.target.checked }))
                        }
                        disabled={isIngesting}
                        className="rounded text-blue-600"
                      />
                      <span>Emergency Hospitals</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={osmCategories.embassy}
                        onChange={(e) =>
                          setOsmCategories((c) => ({ ...c, embassy: e.target.checked }))
                        }
                        disabled={isIngesting}
                        className="rounded text-blue-600"
                      />
                      <span>Embassies & Consulates</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={osmCategories.information}
                        onChange={(e) =>
                          setOsmCategories((c) => ({ ...c, information: e.target.checked }))
                        }
                        disabled={isIngesting}
                        className="rounded text-blue-600"
                      />
                      <span>Tourist Info Kiosks</span>
                    </label>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={osmClearExisting}
                      onChange={(e) => setOsmClearExisting(e.target.checked)}
                      disabled={isIngesting}
                      className="rounded text-purple-600"
                    />
                    <span>Clear previously generated mock data before importing real locations</span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setShowOsmModal(false)}
                    disabled={isIngesting}
                    className="admin-btn-secondary"
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.25rem',
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      borderRadius: '0.75rem',
                      border: '1px solid #cbd5e1',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: isIngesting ? 'not-allowed' : 'pointer',
                      opacity: isIngesting ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isIngesting}
                    className="admin-btn-blue"
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.25rem',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '0.75rem',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: isIngesting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                      opacity: isIngesting ? 0.75 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {isIngesting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Querying OSM...</span>
                      </>
                    ) : (
                      <>
                        <Globe size={16} />
                        <span>Fetch & Ingest Data</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
