import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Phone,
  Star,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  HeartHandshake,
  Info,
} from 'lucide-react';

interface Contact {
  _id: string;
  name: string;
  phone: string;
  relationship?: string;
  isPrimary: boolean;
}

export const EmergencyContacts: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    document.title = 'Emergency Contacts — Safar Setu';
    loadContacts();
  }, [isAuthenticated]);

  const loadContacts = async () => {
    setIsLoading(true);
    if (isAuthenticated) {
      try {
        const res = await api.get('/contacts');
        if (res.data.success) {
          setContacts(res.data.contacts);
          localStorage.setItem('tourist_ice_contacts', JSON.stringify(res.data.contacts));
        }
      } catch (err) {
        console.warn('Failed to load contacts from API, loading local backup', err);
        const local = localStorage.getItem('tourist_ice_contacts');
        if (local) {
          try {
            setContacts(JSON.parse(local));
          } catch (e) {}
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const local = localStorage.getItem('tourist_ice_contacts');
        if (local) {
          setContacts(JSON.parse(local));
        } else {
          const defaultContacts: Contact[] = [
            {
              _id: 'local-1',
              name: 'National Emergency Helpline',
              phone: '112',
              relationship: 'All-in-one Emergency Dispatch',
              isPrimary: true,
            },
            {
              _id: 'local-2',
              name: 'Tourist Police & Information',
              phone: '1363',
              relationship: 'Official Tourist Support',
              isPrimary: false,
            },
          ];
          setContacts(defaultContacts);
          localStorage.setItem('tourist_ice_contacts', JSON.stringify(defaultContacts));
        }
      } catch (e) {
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setRelationship('Family');
    setIsPrimary(contacts.length === 0);
    setShowModal(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setEditingId(contact._id);
    setName(contact.name);
    setPhone(contact.phone);
    setRelationship(contact.relationship || '');
    setIsPrimary(contact.isPrimary);
    setShowModal(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isAuthenticated) {
      try {
        if (editingId && !editingId.startsWith('local-')) {
          const res = await api.put(`/contacts/${editingId}`, {
            name,
            phone,
            relationship,
            isPrimary,
          });
          if (res.data.success) {
            setFeedback({ type: 'success', message: 'Contact updated successfully' });
          }
        } else {
          const res = await api.post('/contacts', {
            name,
            phone,
            relationship,
            isPrimary,
          });
          if (res.data.success) {
            setFeedback({ type: 'success', message: 'Emergency contact added' });
          }
        }
        setShowModal(false);
        loadContacts();
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Action failed',
        });
      }
    } else {
      try {
        let updated: Contact[] = [...contacts];
        if (isPrimary) {
          updated = updated.map((c) => ({ ...c, isPrimary: false }));
        }
        if (editingId) {
          updated = updated.map((c) =>
            c._id === editingId
              ? {
                  ...c,
                  name,
                  phone,
                  relationship,
                  isPrimary,
                }
              : c
          );
          setFeedback({ type: 'success', message: 'Contact updated locally' });
        } else {
          const newContact: Contact = {
            _id: `local-${Date.now()}`,
            name,
            phone,
            relationship,
            isPrimary,
          };
          updated.push(newContact);
          setFeedback({ type: 'success', message: 'Emergency contact added locally' });
        }
        setContacts(updated);
        localStorage.setItem('tourist_ice_contacts', JSON.stringify(updated));
        setShowModal(false);
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: 'Failed to save contact locally',
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this emergency contact?')) return;
    if (isAuthenticated && !id.startsWith('local-')) {
      try {
        await api.delete(`/contacts/${id}`);
        loadContacts();
      } catch (err) {
        console.warn('Failed to delete contact', err);
      }
    } else {
      const updated = contacts.filter((c) => c._id !== id);
      setContacts(updated);
      localStorage.setItem('tourist_ice_contacts', JSON.stringify(updated));
      setFeedback({ type: 'success', message: 'Contact removed' });
    }
  };

  return (
    <div className="container-md page has-bottom-nav">
      <div className="page-header-row page-header">
        <div>
          <span className="badge badge-sky mb-sm">
            <Users size={14} />
            In Case of Emergency (ICE)
          </span>
          <h1 className="page-title">Emergency Contacts</h1>
          <p className="page-desc">
            Trusted contacts who receive direct notifications and coordinates whenever you trigger an SOS.
          </p>
        </div>
        <button type="button" onClick={handleOpenAdd} className="btn btn-sky">
          <UserPlus size={16} />
          Add Contact
        </button>
      </div>

      {!isAuthenticated && (
        <div className="alert alert-info flex items-center justify-between mb-md" style={{ background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1', padding: '0.75rem 1rem', borderRadius: '0.75rem' }}>
          <div className="flex items-center gap-sm">
            <Info size={18} color="#38bdf8" />
            <span className="text-xs">
              <strong>Device Storage Mode:</strong> Emergency contacts are saved on this phone for instant 1-touch calls &amp; SMS.
            </span>
          </div>
          <Link to="/login?redirect=/contacts" className="text-xs font-bold text-sky-400 hover:underline" style={{ color: '#38bdf8', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
            Sign In to Sync →
          </Link>
        </div>
      )}

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-2">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="empty-state">
          <HeartHandshake className="empty-state-icon" />
          <h3 className="empty-state-title">No Emergency Contacts Registered</h3>
          <p className="empty-state-desc">
            Add at least one family member, friend, or travel companion to ensure they receive alerts in an emergency.
          </p>
          <button type="button" onClick={handleOpenAdd} className="btn btn-sky mt-md">
            Add First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-2">
          {contacts.map((contact) => (
            <div key={contact._id} className={`contact-card transition-all duration-200${contact.isPrimary ? ' primary' : ''}`}>
              <div>
                <div className="flex items-start justify-between gap-sm mb-sm">
                  <div>
                    <div className="flex items-center gap-sm">
                      <h4>{contact.name}</h4>
                      {contact.isPrimary && (
                        <span className="badge badge-sky">
                          <Star size={12} />
                          PRIMARY ICE
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted">{contact.relationship || 'Emergency Contact'}</span>
                  </div>
                  <div className="flex items-center gap-xs">
                    <button type="button" onClick={() => handleOpenEdit(contact)} className="icon-btn-ghost" title="Edit Contact">
                      <Edit2 size={14} />
                    </button>
                    <button type="button" onClick={() => handleDelete(contact._id)} className="icon-btn-ghost" title="Delete Contact">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-sm font-mono text-sm mt-sm">
                  <Phone size={14} color="#38bdf8" />
                  <span>{contact.phone}</span>
                </div>
              </div>
              <div className="contact-actions">
                <a href={`tel:${contact.phone}`} className="contact-action-btn contact-action-call">
                  <Phone size={14} /> Call Contact
                </a>
                <a href={`sms:${contact.phone}`} className="contact-action-btn contact-action-sms">
                  Send SMS
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="mb-md">{editingId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}</h3>
            <form onSubmit={handleSaveContact} className="space-y">
              <div>
                <label className="label">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" required className="input" />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 9876543210" required className="input" />
              </div>
              <div>
                <label className="label">Relationship</label>
                <input type="text" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Spouse, Parent, Embassy" className="input" />
              </div>
              <div className="flex items-center gap-sm">
                <input
                  type="checkbox"
                  id="primaryContact"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="checkbox"
                />
                <label htmlFor="primaryContact" className="text-xs text-secondary">
                  Set as Primary ICE Contact (notified first)
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sky flex-1">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
