import React, { useState, useEffect } from 'react';
import { useAlerts } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { IncidentCard, IncidentData } from '../../components/IncidentCard';
import { SafetyMap } from '../../components/SafetyMap';
import { SafetyZoneData } from '../../components/ZoneCard';
import api from '../../services/api';
import {
  Radio,
  ShieldAlert,
  CheckCircle2,
  Phone,
  MapPin,
  AlertTriangle,
  Check,
  UserCheck,
  RefreshCw,
  Search,
  Layers,
  Activity,
  FileWarning,
  ExternalLink,
  Shield,
  Clock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeAlerts, acknowledgeAlert, resolveAlert, fetchActiveAlerts } = useAlerts();

  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [zones, setZones] = useState<SafetyZoneData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'unverified' | 'verified'>('all');

  useEffect(() => {
    document.title = 'Command Center — SafeTour Admin';
    fetchActiveAlerts();
    loadAllIncidents();
  }, []);

  const loadAllIncidents = async () => {
    try {
      setLoadingIncidents(true);
      const [incidentsRes, zonesRes] = await Promise.all([
        api.get('/incidents/admin/all'),
        api.get('/safety-zones'),
      ]);
      if (incidentsRes.data?.success) setIncidents(incidentsRes.data.incidents || []);
      if (zonesRes.data?.success) setZones(zonesRes.data.zones || []);
    } catch (err) {
      console.warn('Failed to load admin incidents:', err);
    } finally {
      setLoadingIncidents(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    setActionInProgress(id);
    await acknowledgeAlert(id);
    await fetchActiveAlerts();
    setActionInProgress(null);
  };

  const handleResolve = async (id: string) => {
    setActionInProgress(id);
    await resolveAlert(id);
    await fetchActiveAlerts();
    setActionInProgress(null);
  };

  const handleToggleVerify = async (incident: IncidentData) => {
    try {
      const res = await api.patch(`/incidents/${incident._id}/verify`, {
        isVerified: !incident.isVerified,
      });
      if (res.data?.success) {
        setIncidents((prev) =>
          prev.map((i) => (i._id === incident._id ? { ...i, isVerified: !incident.isVerified } : i))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered lists
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.category?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'unverified') return !incident.isVerified;
    if (activeTab === 'verified') return incident.isVerified;
    return true;
  });

  const pendingCount = incidents.filter((i) => !i.isVerified).length;
  const verifiedCount = incidents.filter((i) => i.isVerified).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Alert Bar */}
      <div className="admin-hero-banner">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="admin-hero-badge">
                <Radio size={14} className="animate-pulse" />
                Police & Emergency Dispatch HQ
              </div>
              <h2>Live Incident & Dispatch Radar</h2>
              <p>
                Real-time SOS triangulation, rapid officer deployment, and live crowd-sourced incident verification.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                fetchActiveAlerts();
                loadAllIncidents();
              }}
              className="admin-btn-ghost-dark"
            >
              <RefreshCw size={14} />
              <span>Sync Channels</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent 4-Column KPI Stats */}
      <div className="admin-kpi-grid">
        {/* KPI 1: SOS Distress */}
        <div className="admin-kpi-card kpi-danger">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626' }}>
              Active SOS Distress
            </span>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a' }}>{activeAlerts.length}</span>
            {activeAlerts.length > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626' }} className="animate-pulse">URGENT</span>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            {activeAlerts.length > 0 ? 'Requires immediate response' : 'No active emergencies'}
          </p>
        </div>

        {/* KPI 2: Pending Incidents */}
        <div className="admin-kpi-card kpi-warning">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d97706' }}>
              Pending Review
            </span>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a' }}>{pendingCount}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>reports</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>Awaiting police validation</p>
        </div>

        {/* KPI 3: Verified Incidents */}
        <div className="admin-kpi-card kpi-success">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669' }}>
              Public Hazards
            </span>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a' }}>{verifiedCount}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>published</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>Live on tourist safety radar</p>
        </div>

        {/* KPI 4: Monitored Perimeters */}
        <div className="admin-kpi-card kpi-purple">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7c3aed' }}>
              Monitored Zones
            </span>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a' }}>{zones.length}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>perimeters</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>Safe havens & risk perimeters</p>
        </div>
      </div>

      {/* Tactical Surveillance Map Section */}
      <section className="admin-panel-card" id="map">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', background: '#dc2626' }} className="animate-ping" />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Tactical Surveillance Radar</h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Live Map with plotted SOS distress locations, danger clusters, and monitored safe havens
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: '#f1f5f9', color: '#334155', fontSize: '0.75rem', fontWeight: 700 }}>
              <MapPin size={13} color="#ef4444" />
              <span>{zones.length} Active Zones</span>
            </span>
          </div>
        </div>

        <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <SafetyMap zones={zones} incidents={incidents.filter((incident) => incident.isVerified)} />
        </div>
      </section>

      {/* 2-Column Dispatch & Verification Section */}
      <div className="admin-dispatch-grid">
        {/* Left Column: SOS Distress Queue */}
        <div className="admin-panel-card" id="alerts">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Live SOS Distress Queue</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Incoming tourist emergency calls</p>
              </div>
            </div>

            {activeAlerts.length > 0 ? (
              <span style={{ padding: '0.25rem 0.625rem', borderRadius: '9999px', background: '#dc2626', color: '#ffffff', fontWeight: 900, fontSize: '0.75rem' }} className="animate-pulse">
                {activeAlerts.length} URGENT
              </span>
            ) : (
              <span style={{ padding: '0.25rem 0.625rem', borderRadius: '9999px', background: '#d1fae5', color: '#047857', fontWeight: 800, fontSize: '0.75rem' }}>
                ALL CLEAR
              </span>
            )}
          </div>

          {activeAlerts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <CheckCircle2 size={28} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>No Active Distress Calls</h4>
              <p style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '24rem', margin: '0 auto' }}>
                Tourist SOS beacons will automatically pop up here in real time via live WebSocket telemetry.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeAlerts.map((alert) => {
                const isAcknowledged = alert.status === 'ACKNOWLEDGED';
                return (
                  <div key={alert._id} className={`admin-sos-card ${isAcknowledged ? 'acknowledged' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span className={`admin-sos-status-badge ${isAcknowledged ? 'acknowledged' : ''}`}>
                            {alert.status}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                            {new Date(alert.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0.25rem 0' }}>
                          {alert.userId?.name || 'Tourist Distress Call'}
                        </h4>
                        {alert.userId?.phone && (
                          <a
                            href={`tel:${alert.userId.phone}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}
                          >
                            <Phone size={13} />
                            <span>{alert.userId.phone}</span>
                          </a>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', display: 'block' }}>GPS Location</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', display: 'inline-block', marginTop: '0.125rem' }}>
                          {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    {/* Note */}
                    <div className="admin-sos-note-box">
                      <strong style={{ color: '#0f172a' }}>Emergency Note:</strong>{' '}
                      {alert.message || 'No custom note attached.'}
                      {alert.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem', color: '#64748b', fontWeight: 500, paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                          <MapPin size={13} color="#ef4444" style={{ flexShrink: 0 }} />
                          <span>{alert.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                      {!isAcknowledged && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(alert._id)}
                          disabled={actionInProgress === alert._id}
                          className="admin-btn-amber"
                          style={{ flex: 1 }}
                        >
                          <Check size={14} />
                          <span>Acknowledge & Deploy</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResolve(alert._id)}
                        disabled={actionInProgress === alert._id}
                        className="admin-btn-emerald"
                        style={{ flex: 1 }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Safely Resolved</span>
                      </button>
                      <a
                        href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn-dark"
                      >
                        <ExternalLink size={13} />
                        <span>Map</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Incident Verification Queue */}
        <div className="admin-panel-card" id="incidents">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <FileWarning size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Incident Verification Feed</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{incidents.length} total hazard reports</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="admin-filter-bar">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`admin-filter-btn ${activeTab === 'all' ? 'active' : ''}`}
              >
                All ({incidents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unverified')}
                className={`admin-filter-btn ${activeTab === 'unverified' ? 'active-warning' : ''}`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('verified')}
                className={`admin-filter-btn ${activeTab === 'verified' ? 'active-success' : ''}`}
              >
                Verified ({verifiedCount})
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="admin-search-wrapper">
            <Search className="search-icon" size={15} />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by title, category (e.g. Theft, Scam), description..."
            />
          </div>

          {loadingIncidents ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ height: '7rem', borderRadius: '1rem', background: '#f1f5f9' }} className="animate-pulse" />
              <div style={{ height: '7rem', borderRadius: '1rem', background: '#f1f5f9' }} className="animate-pulse" />
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>No Incident Reports</h4>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {searchTerm ? 'No reports matched your search criteria.' : 'Crowd-sourced reports will appear here.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {filteredIncidents.map((incident) => (
                <IncidentCard
                  key={incident._id}
                  incident={incident}
                  showAdminControls={true}
                  onVerifyToggle={() => handleToggleVerify(incident)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
