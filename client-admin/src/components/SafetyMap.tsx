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
}

const OPENSTREETMAP_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Sub-component: shows live user location dot
const CurrentLocationMarker = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 14 });
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

const LeafletSafetyMap: React.FC<SafetyMapProps> = ({ zones, incidents = [], center = [20.5937, 78.9629], zoom = 5 }) => {
  return (
    <div className="map-wrapper">
      <div className="map-legend">
        <div className="map-legend-title">Map Legend (OSM)</div>
        <div className="map-legend-item"><span className="map-legend-dot" style={{ background: '#3b82f6', border: '2px solid #fff' }} /> You</div>
        <div className="map-legend-item"><span className="map-legend-rect" style={{ background: 'rgba(244,63,94,0.3)', border: '2px solid #f43f5e' }} /> ILP Restricted</div>
        <div className="map-legend-item"><span className="map-legend-rect" style={{ background: 'rgba(249,115,22,0.2)', border: '2px solid #f97316' }} /> High Alert (LWE)</div>
        <div className="map-legend-item"><span className="map-legend-rect" style={{ background: 'rgba(251,191,36,0.2)', border: '2px solid #fbbf24' }} /> Sensitive Border</div>
        <div className="map-legend-item"><span className="map-legend-dot" style={{ background: 'rgba(52,211,153,0.3)', border: '2px solid #34d399' }} /> Safety Zone</div>
        <div className="map-legend-item">Incident</div>
      </div>

      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '500px', width: '100%', background: '#f9fafb' }} maxBounds={[[6.75, 68.16], [37.5, 97.4]]} maxBoundsViscosity={1.0} minZoom={4}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={OPENSTREETMAP_TILES} />
        <RestrictedZonesLayer />
        <CurrentLocationMarker />
        {zones.map((zone) => (
          <Circle key={zone._id} center={[zone.latitude, zone.longitude]} radius={zone.radiusMeters} pathOptions={{ color: getZoneColor(zone.riskLevel), fillColor: getZoneColor(zone.riskLevel), fillOpacity: 0.2, weight: 2 }}>
            <Popup><div><strong>{zone.name}</strong><p style={{ fontSize: 12, marginTop: 4 }}>Risk: {zone.riskLevel}</p></div></Popup>
          </Circle>
        ))}
        {incidents.map((incident) => (
          <Marker key={incident._id} position={[incident.latitude, incident.longitude]}>
            <Popup><div><strong>{incident.category.replace('_', ' ')}</strong><p style={{ fontSize: 12, marginTop: 4 }}>{incident.description}</p></div></Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export const SafetyMap: React.FC<SafetyMapProps> = (props) => {
  return <LeafletSafetyMap {...props} />;
};
