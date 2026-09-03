import React, { useEffect, useState, useRef, useId } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  CircleMarker,
  useMap,
  GeoJSON,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SafetyZoneData } from './ZoneCard';
import { IncidentData } from './IncidentCard';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const RESTRICTED_STATES = ['Arunachal Pradesh', 'Manipur', 'Nagaland', 'Mizoram'];
const HIGH_ALERT_STATES = ['Chhattisgarh', 'Jharkhand'];
const SENSITIVE_STATES = ['Jammu and Kashmir', 'Ladakh', 'Sikkim'];

interface SafetyMapProps {
  zones: SafetyZoneData[];
  incidents?: IncidentData[];
  center?: [number, number];
  zoom?: number;
  selectedZoneId?: string | null;
  onSelectZone?: (zone: SafetyZoneData) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

const OPENSTREETMAP_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Sub-component: dynamically flies the map to the target center & zoom when updated
const MapController: React.FC<{
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
}> = ({ center, zoom, onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 15, { duration: 1.2 });
    }
  }, [center?.[0], center?.[1], zoom, map]);

  useEffect(() => {
    if (!onMapClick) return;
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
};

// Sub-component: shows live user location dot without overriding custom map center
const CurrentLocationMarker = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: false, maxZoom: 14 });
    map.on('locationfound', (e) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
    });
  }, [map]);

  return position === null ? null : (
    <>
      <CircleMarker center={position} radius={8} pathOptions={{ color: '#fff', fillColor: '#3b82f6', fillOpacity: 1, weight: 3 }}>
        <Popup><div style={{ fontWeight: 700, fontSize: 13 }}>You are here</div></Popup>
      </CircleMarker>
      <Circle center={position} radius={300} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.12, stroke: false }} />
    </>
  );
};

// Sub-component: fetches and renders official state GeoJSON with restricted zone overlays
const RestrictedZonesLayer = () => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IND/ADM1/geoBoundaries-IND-ADM1_simplified.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.warn('Failed to load restricted zones GeoJSON:', err));
  }, []);

  if (!geoData) return null;

  const styleFeature = (feature: any) => {
    const name = feature?.properties?.shapeName || '';
    if (RESTRICTED_STATES.includes(name)) return { color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.25, weight: 2, dashArray: '6 4' };
    if (HIGH_ALERT_STATES.includes(name)) return { color: '#f97316', fillColor: '#f97316', fillOpacity: 0.18, weight: 1.5, dashArray: '4 3' };
    if (SENSITIVE_STATES.includes(name)) return { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 1.5, dashArray: '4 3' };
    return { color: 'transparent', fillColor: 'transparent', fillOpacity: 0, weight: 0 };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature?.properties?.shapeName || 'Unknown';
    let label = '';
    let details = '';

    if (RESTRICTED_STATES.includes(name)) {
      label = '🔴 ILP Restricted Zone';
      details = 'Inner Line Permit required for all foreign nationals. Entry without permit is illegal.';
    } else if (HIGH_ALERT_STATES.includes(name)) {
      label = '🟠 High Alert — LWE Activity';
      details = 'Left Wing Extremism (Maoist) conflict area. Exercise extreme caution. Avoid remote regions.';
    } else if (SENSITIVE_STATES.includes(name)) {
      label = '🟡 Sensitive Border Territory';
      details = 'Protected Area Permit may be required. Active military presence. Check advisories before travel.';
    } else return;

    layer.bindPopup(`
      <div style="font-family: sans-serif; max-width: 220px;">
        <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${name}</div>
        <div style="font-weight: 600; font-size: 11px; color: #64748b; margin-bottom: 6px;">${label}</div>
        <div style="font-size: 11px; color: #334155; line-height: 1.5;">${details}</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">Source: MHA India / geoBoundaries</div>
      </div>
    `);
  };

  return <GeoJSON key={geoData ? 'loaded' : 'empty'} data={geoData} style={styleFeature} onEachFeature={onEachFeature} />;
};

const getZoneColor = (risk: string) => {
  switch (risk) {
    case 'CRITICAL': return '#f43f5e';
    case 'HIGH': return '#f97316';
    case 'MEDIUM': return '#f59e0b';
    default: return '#10b981';
  }
};

const LeafletSafetyMap: React.FC<SafetyMapProps> = ({
  zones,
  incidents = [],
  center = [28.6139, 77.209],
  zoom = 13,
  selectedZoneId,
  onSelectZone,
  onMapClick,
}) => {
  return (
    <div className="map-wrapper" style={{ position: 'relative', width: '100%', height: '520px', overflow: 'hidden' }}>
      {/* Sleek floating legend in top-right corner */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 999,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '10px 14px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          fontSize: '11px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          border: '1px solid #e2e8f0',
          pointerEvents: 'auto',
          maxWidth: '210px',
        }}
      >
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Perimeter Radar
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', border: '2px solid #fff', display: 'inline-block' }} /> You are here
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
          <span style={{ width: 12, height: 8, borderRadius: 2, background: 'rgba(244,63,94,0.3)', border: '1.5px solid #f43f5e', display: 'inline-block' }} /> ILP Restricted
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
          <span style={{ width: 12, height: 8, borderRadius: 2, background: 'rgba(249,115,22,0.2)', border: '1.5px solid #f97316', display: 'inline-block' }} /> High Alert (LWE)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(16,185,129,0.3)', border: '2px solid #10b981', display: 'inline-block' }} /> Safe Perimeter
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7e22ce', fontWeight: 600 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(168,85,247,0.4)', border: '2px solid #a855f7', display: 'inline-block' }} /> Focused Perimeter
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        maxBounds={[[6.75, 68.16], [37.5, 97.4]]}
        maxBoundsViscosity={1.0}
        minZoom={4}
      >
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={OPENSTREETMAP_TILES} />
        <MapController center={center} zoom={zoom} onMapClick={onMapClick} />
        <RestrictedZonesLayer />
        <CurrentLocationMarker />

        {zones.map((zone) => {
          const isSelected = selectedZoneId === zone._id;
          const color = getZoneColor(zone.riskLevel);
          return (
            <React.Fragment key={zone._id}>
              <Circle
                center={[zone.latitude, zone.longitude]}
                radius={zone.radiusMeters}
                eventHandlers={{
                  click: () => onSelectZone?.(zone),
                }}
                pathOptions={{
                  color: isSelected ? '#a855f7' : color,
                  fillColor: isSelected ? '#a855f7' : color,
                  fillOpacity: isSelected ? 0.35 : 0.2,
                  weight: isSelected ? 4 : 2,
                  dashArray: isSelected ? '4 2' : undefined,
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px', fontFamily: 'sans-serif' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>
                      {zone.name}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: isSelected ? '#f3e8ff' : '#f1f5f9',
                        color: isSelected ? '#7e22ce' : '#334155',
                        marginBottom: 6,
                      }}
                    >
                      {zone.riskLevel} RISK • {zone.radiusMeters}m radius
                    </div>
                    {zone.description && (
                      <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>
                        {zone.description}
                      </div>
                    )}
                    <div style={{ marginTop: 6, fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                      GPS: {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Circle>

              {isSelected && (
                <CircleMarker
                  center={[zone.latitude, zone.longitude]}
                  radius={7}
                  pathOptions={{ color: '#ffffff', fillColor: '#a855f7', fillOpacity: 1, weight: 3 }}
                />
              )}
            </React.Fragment>
          );
        })}

        {incidents.map((incident) => (
          <Marker key={incident._id} position={[incident.latitude, incident.longitude]}>
            <Popup>
              <div>
                <strong>{incident.category.replace('_', ' ')}</strong>
                <p style={{ fontSize: 12, marginTop: 4 }}>{incident.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export const SafetyMap: React.FC<SafetyMapProps> = (props) => {
  return <LeafletSafetyMap {...props} />;
};
