import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { IncidentCard, IncidentData } from '../../components/IncidentCard';
import {
  FileWarning,
  MapPin,
  Send,
  AlertTriangle,
  CheckCircle,
  UserX,
  Flame,
  Stethoscope,
  HelpCircle,
} from 'lucide-react';

export const ReportIncident: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('SCAM');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 26.9124,
    longitude: 75.7873,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);

  useEffect(() => {
    document.title = 'Report Incident — SafeTour Guardian';
    fetchCurrentCoords();
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/incidents?verifiedOnly=true');
      if (res.data.success) {
        setIncidents(res.data.incidents);
      }
    } catch (err) {
      console.warn('Failed to fetch incidents', err);
    } finally {
      setIsLoadingIncidents(false);
    }
  };

  const fetchCurrentCoords = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setAddress(`Dharamshala (Near ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          setIsLocating(false);
        },
        () => {
          setCoords({ latitude: 26.9124, longitude: 75.7873 });
          setAddress('Jaipur (Fallback GPS)');
          setIsLocating(false);
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const categories = [
    { value: 'THEFT', label: 'Theft / Pickpocketing', icon: UserX },
    { value: 'SCAM', label: 'Tourist Scam / Overcharging', icon: AlertTriangle },
    { value: 'HARASSMENT', label: 'Harassment / Safety Threat', icon: AlertTriangle },
    { value: 'MEDICAL', label: 'Medical Emergency / Injury', icon: Stethoscope },
    { value: 'NATURAL_HAZARD', label: 'Natural Hazard / Flood / Landslide', icon: Flame },
    { value: 'OTHER', label: 'Other Hazard', icon: HelpCircle },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isAuthenticated) {
      navigate('/login?redirect=/report');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter both a title and description.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/incidents', {
        title,
        description,
        category,
        latitude: coords.latitude,
        longitude: coords.longitude,
        address,
      });

      if (res.data.success) {
        setSuccessMsg('Incident reported successfully! It will be reviewed by local responders.');
        setTitle('');
        setDescription('');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-md page has-bottom-nav">
      <div className="card">
        <div className="flex items-center gap-md mb-lg" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div className="icon-box icon-box-md icon-box-amber">
            <FileWarning size={22} />
          </div>
          <div>
            <h1>Report a Safety Incident</h1>
            <p className="page-desc">Contribute to real-time community safety for tourists and emergency responders.</p>
          </div>
        </div>

        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y">
          <div>
            <label className="label">Incident Category</label>
            <div className="grid grid-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`category-option${isSelected ? ' selected' : ''}`}
                  >
                    <Icon size={16} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Summary / Headline</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Aggressive taxi scam outside north metro gate"
              required
              className="input"
            />
          </div>

          <div>
            <label className="label">Detailed Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide key details, visual descriptions, exact landmark, or actions taken..."
              required
              className="input"
            />
          </div>

          <div className="location-box">
            <div className="flex items-center justify-between mb-sm">
              <label className="label" style={{ marginBottom: 0 }}>
                <MapPin size={14} color="#fb7185" /> Incident Location
              </label>
              <button type="button" onClick={fetchCurrentCoords} className="btn btn-danger btn-sm">
                {isLocating ? 'Detecting...' : 'Detect GPS'}
              </button>
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Approximate address or landmark name"
              className="input"
            />
            <div className="flex gap-md text-xs text-muted mt-sm">
              <span>Lat: {coords.latitude.toFixed(4)}</span>
              <span>Lng: {coords.longitude.toFixed(4)}</span>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-block btn-lg">
            <Send size={16} />
            {isSubmitting ? 'Transmitting Report...' : 'Publish Incident Warning'}
          </button>
        </form>
      </div>

      <div className="mt-xl">
        <div className="flex items-center gap-sm mb-lg border-b border-gray-200 pb-4">
          <FileWarning size={20} className="text-amber-500" />
          <h2 className="text-xl font-bold">Verified Incident Alerts</h2>
        </div>
        
        {isLoadingIncidents ? (
          <div className="grid grid-2">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="empty-state">
            <FileWarning className="empty-state-icon" />
            <h3 className="empty-state-title">All clear nearby</h3>
            <p className="empty-state-desc">No verified incidents in the public radar right now.</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {incidents.map((incident) => (
              <IncidentCard key={incident._id} incident={incident} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
