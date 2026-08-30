import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { mappls } from 'mappls-web-maps';
import { AlertTriangle, LocateFixed } from 'lucide-react';
import api from '../services/api';
import { RiskZoneOverlay } from './RiskZoneOverlay';

export interface MapplsMapRef {
  getMapInstance: () => any;
  getMapplsObj: () => any;
}

interface MapplsMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
}

// Ray-casting algorithm for Point in Polygon
const isPointInPolygon = (point: [number, number], polygon: number[][][]) => {
  if (!polygon || !polygon[0] || polygon[0].length < 3) return false;
  const [lng, lat] = point;
  let isInside = false;
  const ring = polygon[0];
  
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    const intersect = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi + 0.000000001) + xi);
    if (intersect) isInside = !isInside;
  }

  return isInside;
};

export const MapplsMap = forwardRef<MapplsMapRef, MapplsMapProps>(
  ({ className = 'h-96 w-full rounded-xl overflow-hidden shadow-lg border border-gray-200', center = [26.9124, 75.7873], zoom = 13 }, ref) => {
  const mapRef = useRef<any>(null);
  const geojsonLayerRef = useRef<any>(null);
  const [isInDangerZone, setIsInDangerZone] = useState(false);
  const [dangerBannerDismissed, setDangerBannerDismissed] = useState(false);
  const [redZones, setRedZones] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentLoc, setCurrentLoc] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const mapplsObjRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const hasCenteredRef = useRef<boolean>(false);
  const lastGeoCheckRef = useRef<number>(0);
  const containerId = React.useId().replace(/:/g, '');

  // Expose map internals to parent via ref
  useImperativeHandle(ref, () => ({
    getMapInstance: () => mapRef.current,
    getMapplsObj: () => mapplsObjRef.current,
  }));

  useEffect(() => {
    let isMounted = true;
    mapplsObjRef.current = new mappls();
    const mapplsClassObject = mapplsObjRef.current;

    const fetchRedZones = async (map: any) => {
      try {
        const res = await api.get('/red-zones');
        if (!isMounted) return;
        if (res.data.success && res.data.geoJson) {
          const geoJson = res.data.geoJson;
          setRedZones(geoJson);
          
          // Render red zones as Polygons using addGeoJson
          geojsonLayerRef.current = mapplsClassObject.addGeoJson({
            map: map,
            data: geoJson,
            fitbounds: false,
            style: {
              fillColor: 'red',
              fillOpacity: 0.4,
              strokeColor: 'darkred',
              strokeOpacity: 0.8,
              strokeWidth: 2,
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch red zones', error);
      }
    };

    const initMap = () => {
      const loadObject = { map: true, version: '3.0' };
      mapplsClassObject.initialize("reqpzxosewtfxhrtixlizunwfgebmjwqfjbc", loadObject, () => {
        if (!isMounted) return;
        
        const container = document.getElementById(`mappls-container-${containerId}`);
        if (container && container.childNodes.length > 0) {
          container.innerHTML = '';
        }

        const map = mapplsClassObject.Map({ 
          id: `mappls-container-${containerId}`, 
          properties: { 
            center,
            zoom,
            zoomControl: true,
            searchControl: false,
            location: true
          } 
        });
        
        mapRef.current = map;
        setMapReady(true);
        
        fetchRedZones(map);
      });
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn('Map cleanup error', e);
        }
      }
      const container = document.getElementById(`mappls-container-${containerId}`);
      if (container) container.innerHTML = '';
      
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Geofencing Tracker (throttled to avoid CPU spikes)
  useEffect(() => {
    if (!redZones || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        // Throttle calculation to at most once every 2 seconds
        if (now - lastGeoCheckRef.current < 2000) return;
        lastGeoCheckRef.current = now;

        const { latitude, longitude } = position.coords;
        setCurrentLoc({ lat: latitude, lng: longitude });
        let inside = false;
        
        if (redZones.features && Array.isArray(redZones.features)) {
          for (const feature of redZones.features) {
            if (feature.geometry?.type === 'Polygon' && Array.isArray(feature.geometry.coordinates)) {
              if (isPointInPolygon([longitude, latitude], feature.geometry.coordinates)) {
                inside = true;
                break;
              }
            }
          }
        }
        
        setIsInDangerZone((prev) => (prev !== inside ? inside : prev));
        if (!inside) {
          setDangerBannerDismissed((prev) => (prev ? false : prev));
        }

        // Update user location marker and center map on first fix
        if (mapRef.current && mapplsObjRef.current) {
          if (!userMarkerRef.current) {
            try {
              // @ts-ignore
              userMarkerRef.current = new mapplsObjRef.current.Marker({
                map: mapRef.current,
                position: { lat: latitude, lng: longitude },
                html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
                width: 16,
                height: 16,
              });
            } catch (e) {
              console.warn('Marker creation error', e);
            }
          } else {
            try {
              userMarkerRef.current.setPosition({ lat: latitude, lng: longitude });
            } catch (e) {}
          }

          if (!hasCenteredRef.current) {
            try {
              mapRef.current.setCenter({ lat: latitude, lng: longitude });
              mapRef.current.setZoom(14);
              hasCenteredRef.current = true;
            } catch (e) {}
          }
        }
      },
      (error) => {
        console.warn('Geolocation error', error);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [redZones]);

  const handleLocateMe = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLoc({ lat: latitude, lng: longitude });
          if (mapRef.current) {
            try {
              mapRef.current.setCenter({ lat: latitude, lng: longitude });
              mapRef.current.setZoom(15);
              if (userMarkerRef.current) {
                userMarkerRef.current.setPosition({ lat: latitude, lng: longitude });
              }
            } catch (e) {
              console.warn('Failed to center map', e);
            }
          }
          setLocating(false);
        },
        () => {
          console.warn('Geolocation failed');
          setLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocating(false);
    }
  };

  return (
    <div className="relative w-full">
      {isInDangerZone && !dangerBannerDismissed && (
        <div className="risk-alert-banner absolute top-4 left-4 right-4 z-50 p-6 bg-red-50 border border-red-200 rounded-2xl shadow-md flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0 text-red-600" />
          <p className="font-bold text-red-700 flex-1">You are entering a High Risk Zone</p>
          <button type="button" onClick={() => setDangerBannerDismissed(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Leave Area</button>
        </div>
      )}
      
      {/* Locate Me Button */}
      {mapReady && (
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute bottom-6 right-6 z-40 bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 text-blue-600 focus:outline-none transition-transform hover:scale-105"
          aria-label="Locate Me"
        >
          <LocateFixed size={24} className={locating ? 'animate-pulse text-gray-400' : ''} />
        </button>
      )}

      {/* Risk Zone Overlay Legend (renders on top of map) */}
      {mapReady && mapRef.current && mapplsObjRef.current && (
        <RiskZoneOverlay
          mapInstance={mapRef.current}
          mapplsObj={mapplsObjRef.current}
        />
      )}
      
      {/* Map container - CSS rules to ensure Mappls logo stays visible */}
      <div 
        id={`mappls-container-${containerId}`}
        className={`${className} mappls-clean-frame relative z-0`}
        style={{ minHeight: '300px' }}
      >
        {/* Mappls dynamically injects its canvas and UI here */}
      </div>
    </div>
  );
});

MapplsMap.displayName = 'MapplsMap';
