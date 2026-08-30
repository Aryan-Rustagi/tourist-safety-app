import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';

interface RiskZoneData {
  id: string;
  lat: number;
  lng: number;
  radius_km: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface RiskZoneOverlayProps {
  /** The live Mappls map instance — pass mapRef.current from MapplsMap */
  mapInstance: any;
  /** The Mappls SDK object — pass mapplsObjRef.current from MapplsMap */
  mapplsObj: any;
}

const RISK_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  HIGH:   { fill: '#ef4444', stroke: '#b91c1c', label: 'High Risk'   },
  MEDIUM: { fill: '#f97316', stroke: '#c2410c', label: 'Medium Risk' },
  LOW:    { fill: '#eab308', stroke: '#a16207', label: 'Low Risk'    },
};

/**
 * Generates a GeoJSON Polygon approximating a circle on the map.
 * Mappls addGeoJson supports Polygon features.
 */
const buildCircleGeoJson = (
  lat: number,
  lng: number,
  radiusKm: number,
  points = 48
): GeoJSON.Feature<GeoJSON.Polygon> => {
  const earthRadius = 6371;
  const angularRadius = radiusKm / earthRadius;
  const coords: [number, number][] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = angularRadius * Math.cos(angle);
    const dLng = angularRadius * Math.sin(angle) / Math.cos((lat * Math.PI) / 180);
    coords.push([lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI]);
  }
  // Close the ring
  coords.push(coords[0]);

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  };
};

export const RiskZoneOverlay: React.FC<RiskZoneOverlayProps> = ({ mapInstance, mapplsObj }) => {
  const [zones, setZones] = useState<RiskZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapInstance || !mapplsObj) return;

    const fetchAndRender = async () => {
      try {
        const res = await api.get('/risk-zones');
        if (!res.data.success) throw new Error('Failed to load risk zones');

        const fetchedZones: RiskZoneData[] = res.data.zones || [];
        setZones(fetchedZones);

        // Remove previous layers if re-rendering
        layersRef.current.forEach((layer) => {
          try { mapplsObj.removeLayer(layer); } catch (_) {}
        });
        layersRef.current = [];

        // Group zones by risk level and render as separate styled GeoJSON layers
        const grouped: Record<string, RiskZoneData[]> = { HIGH: [], MEDIUM: [], LOW: [] };
        fetchedZones.forEach((z) => {
          if (grouped[z.risk_level]) grouped[z.risk_level].push(z);
        });

        Object.entries(grouped).forEach(([level, zoneList]) => {
          if (zoneList.length === 0) return;
          const colors = RISK_COLORS[level];

          const featureCollection: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: zoneList.map((z) =>
              buildCircleGeoJson(z.lat, z.lng, z.radius_km)
            ),
          };

          const layer = mapplsObj.addGeoJson({
            map: mapInstance,
            data: featureCollection,
            fitbounds: false,
            style: {
              fillColor: colors.fill,
              fillOpacity: 0.3,
              strokeColor: colors.stroke,
              strokeOpacity: 0.85,
              strokeWidth: 2,
            },
          });
          layersRef.current.push(layer);
        });
      } catch (err: any) {
        console.error('RiskZoneOverlay error:', err);
        setError('Failed to load risk zones.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndRender();

    return () => {
      layersRef.current.forEach((layer) => {
        try { mapplsObj.removeLayer(layer); } catch (_) {}
      });
      layersRef.current = [];
    };
  }, [mapInstance, mapplsObj]);

  return null;
};
