import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SOSButton } from '../../components/SOSButton';
import { EmergencySMSButton } from '../../components/EmergencySMSButton';
import { ZoneCard, SafetyZoneData } from '../../components/ZoneCard';
import { IncidentCard, IncidentData } from '../../components/IncidentCard';

import { SafetyScoreCard } from '../../components/SafetyScoreCard';
import { SafetyChatbot } from '../../components/SafetyChatbot';
import { AiGeoFenceAlert } from '../../components/AiGeoFenceAlert';
import { WeatherCard } from '../../components/WeatherCard';
import { BlockchainDigitalIdCard } from '../../components/BlockchainDigitalIdCard';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import api from '../../services/api';
import {
  ShieldCheck,
  PhoneCall,
  FileWarning,
  Users,
  Compass,
  ArrowRight,
  CloudSun,
  Navigation,
} from 'lucide-react';

export const TouristHome: React.FC = () => {
  const [zones, setZones] = useState<SafetyZoneData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    document.title = 'Dashboard — SafeTour Guardian';
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const zonesRes = await api.get(`/safety-zones?lat=${latitude}&lng=${longitude}`);
            if (zonesRes.data.success) {
              setZones(zonesRes.data.zones.slice(0, 4));
            }
          } catch (err) {
            console.warn('Dashboard data fetch warning:', err);
          } finally {
            setIsLoading(false);
          }
        },
        async () => {
          try {
            const zonesRes = await api.get('/safety-zones');
            if (zonesRes.data.success) setZones(zonesRes.data.zones.slice(0, 4));
          } catch (err) {
            console.warn('Dashboard data fetch warning:', err);
          } finally {
            setIsLoading(false);
          }
        }
      );
    } else {
      try {
        const zonesRes = await api.get('/safety-zones');
        if (zonesRes.data.success) setZones(zonesRes.data.zones.slice(0, 4));
      } catch (err) {
        console.warn('Dashboard data fetch warning:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const emergencyNumbers = [
    { title: 'National Emergency', number: '112', desc: 'All-in-one Emergency Dispatch', icon: 'helpline-icon-police' },
    { title: 'Police Control Room', number: '100', desc: 'Local Police Assistance', icon: 'helpline-icon-police' },
    { title: 'Women Helpline', number: '1091', desc: 'Women in Distress', icon: 'helpline-icon-tourist' },
    { title: 'Ambulance & Medical', number: '102', desc: 'Paramedics & Hospital', icon: 'helpline-icon-medical' },
    { title: 'Fire & Rescue', number: '101', desc: 'Fire Brigade', icon: 'helpline-icon-fire' },
    { title: 'Tourist Helpline', number: '1363', desc: 'Multilingual Tourist Support', icon: 'helpline-icon-tourist' },
  ];

  return (
    <div className="has-bottom-nav">
      <section className="container page dashboard-hero">
        <div className="text-center" style={{ maxWidth: 640, margin: '0 auto 2rem' }}>
          <p className="dashboard-eyebrow">Tourist safety, simplified</p>
          <h1 className="font-extrabold mb-4">
            Travel Safe, <span className="text-blue">Stay Protected</span>
          </h1>
          <p className="hero-subtitle">
            Instant one-touch emergency response connected directly to local authorities, safe havens, and designated responders.
          </p>
          
          {/* Simulated Network Toggle */}
          <div className="flex items-center justify-center mt-6">
            <ToggleSwitch checked={!isOnline} onChange={(offline) => setIsOnline(!offline)} />
          </div>
        </div>

        {isOnline ? (
          <SOSButton />
        ) : (
          <EmergencySMSButton />
        )}

        {isOnline && (
          <div style={{ maxWidth: 960, margin: '2rem auto 0' }}>
            <BlockchainDigitalIdCard />
          </div>
        )}

        {isOnline && (
          <div className="dashboard-card-grid">
            <SafetyScoreCard />
            <WeatherCard />
            <div className="dashboard-card">
              <div className="dashboard-card-icon dashboard-card-icon-green"><Navigation size={22} /></div>
              <p className="dashboard-card-label">Nearby Help</p>
              <h2>Help is close</h2>
              <p className="text-secondary">View safe havens, police kiosks, and monitored areas on the live map.</p>
              <Link to="/zones" className="dashboard-card-link">Find nearby help <ArrowRight size={14} /></Link>
            </div>
          </div>
        )}

        {isOnline && (
          <div className="helpline-grid mt-xl" style={{ maxWidth: 960, marginLeft: 'auto', marginRight: 'auto' }}>
            {emergencyNumbers.map((item) => (
              <a key={item.number} href={`tel:${item.number}`} className="helpline-card">
                <div>
                  <div className="flex items-center justify-between mb-sm">
                    <div className={`helpline-icon ${item.icon}`}>
                      <PhoneCall size={16} />
                    </div>
                    <span className="helpline-number">{item.number}</span>
                  </div>
                  <h4 className="helpline-title">{item.title}</h4>
                  <p className="helpline-desc">{item.desc}</p>
                </div>
                <span className="helpline-action">
                  Tap to Call <ArrowRight size={12} />
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      {isOnline && (
        <>
          <section className="container mb-xl">
            <div className="grid grid-3">
          <Link to="/zones" className="action-card">
            <div className="icon-box icon-box-md icon-box-emerald">
              <Compass size={22} />
            </div>
            <div>
              <h3 className="action-card-title">Safety Zones & Map</h3>
              <p className="action-card-desc">
                Discover safe havens, embassy shelters, police kiosks, and caution zones near you.
              </p>
            </div>
          </Link>
          <Link to="/report" className="action-card">
            <div className="icon-box icon-box-md icon-box-amber">
              <FileWarning size={22} />
            </div>
            <div>
              <h3 className="action-card-title">Report Incident</h3>
              <p className="action-card-desc">
                Warn fellow travelers of scams, theft, harassment, or road hazards in the vicinity.
              </p>
            </div>
          </Link>
          <Link to="/contacts" className="action-card">
            <div className="icon-box icon-box-md icon-box-sky">
              <Users size={22} />
            </div>
            <div>
              <h3 className="action-card-title">Emergency ICE Contacts</h3>
              <p className="action-card-desc">
                Keep family, guardians, and local embassy contacts ready for automatic SOS alerts.
              </p>
            </div>
          </Link>
        </div>
      </section>



      {/* ── AI Safety Chatbot (Floating) ── */}
      <SafetyChatbot />
      
      {/* ── AI GeoFence Alert Overlay ── */}
      <AiGeoFenceAlert />

      <section className="container">
        <div className="max-w-3xl mx-auto">
          <div>
            <div className="section-title-row">
              <div className="flex items-center gap-sm">
                <ShieldCheck size={20} color="#34d399" />
                <h3>Monitored Safety Zones</h3>
              </div>
              <Link to="/zones" className="link-accent">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-2">
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
              </div>
            ) : zones.length === 0 ? (
              <div className="empty-state">
                <ShieldCheck className="empty-state-icon" />
                <h3 className="empty-state-title">No safety zones yet</h3>
                <p className="empty-state-desc">Safe havens will appear here once responders publish them.</p>
              </div>
            ) : (
              <div className="grid grid-2">
                {zones.map((zone) => (
                  <ZoneCard key={zone._id} zone={zone} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  );
};
