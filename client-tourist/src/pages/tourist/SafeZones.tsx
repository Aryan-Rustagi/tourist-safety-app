import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ZoneCard, SafetyZoneData } from '../../components/ZoneCard';
import { MapplsMap } from '../../components/MapplsMap';
import { Compass, Search, RefreshCw, Info } from 'lucide-react';

export const SafeZones: React.FC = () => {
  const [zones, setZones] = useState<SafetyZoneData[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [currentRiskStatus, setCurrentRiskStatus] = useState<{
    risk: string;
    activeZones: any[];
    evaluated: boolean;
  }>({
    risk: 'LOW',
    activeZones: [],
    evaluated: false,
  });
  const [evaluatingRisk, setEvaluatingRisk] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Safety Zones — SafeTour Guardian';
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setIsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await api.get(`/safety-zones?lat=${latitude}&lng=${longitude}`);
            if (res.data.success) {
              setZones(res.data.zones);
            }
          } catch (err) {
            console.warn('Failed to fetch zones:', err);
          } finally {
            setIsLoading(false);
          }
        },
        async () => {
          // Fallback if location fails
          try {
            const res = await api.get('/safety-zones');
            if (res.data.success) setZones(res.data.zones);
          } catch (err) {
            console.warn('Failed to fetch zones:', err);
          } finally {
            setIsLoading(false);
          }
        }
      );
    } else {
      try {
        const res = await api.get('/safety-zones');
        if (res.data.success) setZones(res.data.zones);
      } catch (err) {
        console.warn('Failed to fetch zones:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const evaluateCurrentLocation = () => {
    setEvaluatingRisk(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await api.get(
              `/safety-zones/check-risk?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}`
            );
            if (res.data.success) {
              setCurrentRiskStatus({
                risk: res.data.currentRisk,
                activeZones: res.data.activeZones,
                evaluated: true,
              });
            }
          } catch (err) {
            console.warn(err);
          } finally {
            setEvaluatingRisk(false);
          }
        },
        () => {
          setCurrentRiskStatus({
            risk: 'LOW',
            activeZones: [],
            evaluated: true,
          });
          setEvaluatingRisk(false);
        }
      );
    } else {
      setEvaluatingRisk(false);
    }
  };

  const filteredZones = zones.filter((zone) => {
    const matchesFilter = filterLevel === 'ALL' || zone.riskLevel === filterLevel;
    const matchesSearch =
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (zone.description && zone.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return { text: 'Critical Risk Alert Area', cls: 'badge-rose' };
      case 'HIGH':
        return { text: 'Elevated Risk Caution', cls: 'badge-orange' };
      case 'MEDIUM':
        return { text: 'Moderate Caution Area', cls: 'badge-amber' };
      default:
        return { text: 'Safe & Monitored Zone', cls: 'badge-emerald' };
    }
  };

  return (
    <div className="container page has-bottom-nav">
      <div className="page-header-row page-header">
        <div>
          <span className="badge badge-emerald mb-sm">
            <Compass size={14} />
            Safety Perimeter Navigator
          </span>
          <h1 className="page-title">Safe Havens & Monitored Zones</h1>
          <p className="page-desc">
            Browse verified safe zones, tourist police booths, embassy zones, and areas requiring caution.
          </p>
        </div>
        <button type="button" onClick={evaluateCurrentLocation} disabled={evaluatingRisk} className="btn btn-secondary">
          <RefreshCw size={16} className={evaluatingRisk ? 'animate-spin' : ''} />
          {evaluatingRisk ? 'Scanning Perimeter...' : 'Scan My Location Risk'}
        </button>
      </div>

      {currentRiskStatus.evaluated && (
        <div className="card card-glow risk-banner">
          <div>
            <div className="label">Current Location Safety Status</div>
            <div className="flex items-center gap-sm mt-xs">
              <span className={`badge ${getRiskBadge(currentRiskStatus.risk).cls}`}>{currentRiskStatus.risk}</span>
              <span className="font-semibold">{getRiskBadge(currentRiskStatus.risk).text}</span>
            </div>
          </div>
          <div className="location-box text-xs">
            {currentRiskStatus.activeZones.length > 0
              ? `Inside: ${currentRiskStatus.activeZones.map((z: any) => z.zone.name).join(', ')}`
              : 'Within standard safety corridor'}
          </div>
        </div>
      )}

      <div className="mb-xl">{zones.length > 0 && <MapplsMap center={[32.2190, 76.3234]} zoom={13} className="h-[500px] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200" />}</div>

      <div className="filter-bar mb-xl">
        <div className="input-group flex-1" style={{ width: '100%' }}>
          <Search className="input-icon" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search zones by name or landmark description..."
            className="input input-with-icon"
          />
        </div>
        <div className="filter-pills">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterLevel(lvl)}
              className={`filter-pill${filterLevel === lvl ? ' active' : ''}`}
            >
              {lvl === 'ALL' ? 'All Zones' : lvl}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-3">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      ) : filteredZones.length === 0 ? (
        <div className="empty-state">
          <Info className="empty-state-icon" />
          <h3 className="empty-state-title">No zones found</h3>
          <p className="empty-state-desc">Try adjusting your search terms or filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {filteredZones.map((zone) => (
            <ZoneCard key={zone._id} zone={zone} />
          ))}
        </div>
      )}
    </div>
  );
};
