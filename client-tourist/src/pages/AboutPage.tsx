import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About — Safar Setu | SIH';
  }, []);

  return (
    <div className="page container-md">
      <p className="section-kicker">Smart India Hackathon</p>
      <h1 className="page-title">Tourist safety for a high-mobility India</h1>
      <p className="page-desc mt-md">
        Millions of domestic and international visitors travel through dense cities, remote
        circuits, and permit-controlled states. When something goes wrong, language barriers,
        unknown geography, and delayed police coordination cost critical minutes.
      </p>

      <section className="mt-2xl">
        <h2>Problem</h2>
        <p className="text-secondary text-sm mt-sm">
          Existing helplines are fragmented (112, 1363, local tourist police). Travelers rarely
          know restricted Inner Line Permit districts, LWE-affected belts, or the nearest verified
          safe haven. Crowd reports of scams and harassment do not reach responders in a structured
          way. Command centers lack a live SOS queue tied to GPS.
        </p>
      </section>

      <section className="mt-2xl">
        <h2>Solution</h2>
        <p className="text-secondary text-sm mt-sm mb-lg">
          Safar Setu is a dual-portal MERN system: a tourist app for SOS, maps, ICE
          contacts, and incident reports; and an admin command center for acknowledge / resolve
          workflows over Socket.IO.
        </p>
        <div className="arch-grid">
          <article className="arch-step">
            <div className="arch-num">01</div>
            <h4>Tourist client</h4>
            <p className="feature-desc mt-sm">SOS, GPS, ICE, and reports from the phone.</p>
          </article>
          <article className="arch-step">
            <div className="arch-num">02</div>
            <h4>Express API</h4>
            <p className="feature-desc mt-sm">JWT auth, MongoDB models, REST + Socket.IO.</p>
          </article>
          <article className="arch-step">
            <div className="arch-num">03</div>
            <h4>Geo layer</h4>
            <p className="feature-desc mt-sm">Leaflet + geoBoundaries ADM1 restricted overlays.</p>
          </article>
          <article className="arch-step">
            <div className="arch-num">04</div>
            <h4>Dispatch</h4>
            <p className="feature-desc mt-sm">Live queue, verification, zone CRUD for police.</p>
          </article>
        </div>
      </section>

      <section className="mt-2xl">
        <h2>Novelty</h2>
        <ul className="text-secondary text-sm mt-md" style={{ paddingLeft: '1.1rem' }}>
          <li>Unified SOS + restricted-zone awareness (ILP / LWE / sensitive borders) on one map.</li>
          <li>Role-split portals so tourists never see dispatch controls.</li>
          <li>Verified incident radar so rumours do not flood public feeds.</li>
          <li>ICE contacts ready for the same GPS payload as the SOS beacon.</li>
        </ul>
      </section>

      <section className="mt-2xl">
        <h2>Impact (demo placeholders)</h2>
        <div className="metric-grid mt-md">
          <div className="stat-card">
            <div className="stat-value">&lt;30s</div>
            <div className="stat-label">Target SOS-to-queue latency</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">2</div>
            <div className="stat-label">Portals (tourist + command)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">4</div>
            <div className="stat-label">National helplines one tap away</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">IND</div>
            <div className="stat-label">ADM1 restricted overlay coverage</div>
          </div>
        </div>
      </section>

      <div className="hero-actions" style={{ marginTop: '2.5rem' }}>
        <Link to="/dashboard" className="btn btn-primary">
          Open tourist dashboard <ArrowRight size={16} />
        </Link>
        <Link to="/login" className="btn btn-secondary">
          Responder sign-in
        </Link>
      </div>
    </div>
  );
};
