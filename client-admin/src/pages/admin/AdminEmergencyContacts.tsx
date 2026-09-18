import React, { useState, useEffect } from 'react';
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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    document.title = 'Emergency Contacts — Safar Setu Admin';
    loadContacts();
  }, [isAuthenticated]);

  const loadContacts = async () => {
    setIsLoading(true);
    if (isAuthenticated) {
      try {
        const res = await api.get('/contacts');
        if (res.data && res.data.success) {
          setContacts(res.data.contacts);
          localStorage.setItem('admin_ice_contacts', JSON.stringify(res.data.contacts));
        }
      } catch (err) {
        console.warn('Failed to load contacts from API, attempting local fallback', err);
        const local = localStorage.getItem('admin_ice_contacts') || localStorage.getItem('tourist_ice_contacts');
        if (local) {
          try {
            setContacts(JSON.parse(local));
          } catch (e) {}
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      const local = localStorage.getItem('admin_ice_contacts') || localStorage.getItem('tourist_ice_contacts');
      if (local) {
        try {
          setContacts(JSON.parse(local));
        } catch (e) {}
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
      }
      setIsLoading(false);
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
        localStorage.setItem('admin_ice_contacts', JSON.stringify(updated));
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
      localStorage.setItem('admin_ice_contacts', JSON.stringify(updated));
      setFeedback({ type: 'success', message: 'Contact removed' });
    }
  };

  return (
    <div className="container py-xl max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            In Case of Emergency (ICE)
          </div>
          <h1 className="text-3xl font-extrabold text-white">Emergency ICE Contacts</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Designated contacts and rapid responders notified whenever a tourist distress alert is broadcast.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Contacts List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading emergency contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-slate-900/60 p-10 rounded-2xl text-center border border-slate-800">
          <HeartHandshake className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Emergency Contacts Registered</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Add at least one emergency contact or authority helpline to receive automated SOS dispatch coordinates.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
          >
            Add First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact._id}
              className={`bg-slate-900 border p-6 rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                contact.isPrimary ? 'border-sky-500/50 shadow-lg shadow-sky-500/5' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{contact.name}</h4>
                      {contact.isPrimary && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                          <Star className="w-3 h-3 fill-sky-400 text-sky-400" />
                          PRIMARY ICE
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{contact.relationship || 'Emergency Contact'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(contact)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-sm font-mono text-slate-200 mt-2 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  <span>{contact.phone}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex gap-2">
                <a
                  href={`tel:${contact.phone}`}
                  className="flex-1 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-xs font-bold text-center border border-sky-500/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Contact
                </a>
                <a
                  href={`sms:${contact.phone}`}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold text-center border border-slate-700 transition-all"
                >
                  Send SMS
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h3>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199 or +91 9876543210"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Spouse, Parent, Hotel Concierge, Embassy"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="primaryContact"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <label htmlFor="primaryContact" className="text-xs text-slate-300 font-medium">
                  Set as Primary ICE Contact (notified first)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all"
                >
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

export default EmergencyContacts;
