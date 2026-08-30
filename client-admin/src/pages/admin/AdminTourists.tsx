import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Users, Search, ShieldCheck, ShieldAlert, FileText, ChevronRight, X } from 'lucide-react';

interface TouristData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  blockchainId?: string;
  isKycVerified: boolean;
  idType?: string;
  idNumberMasked?: string;
  kycDocumentUrl?: string;
  createdAt: string;
}

export const AdminTourists: React.FC = () => {
  const { user } = useAuth();
  const [tourists, setTourists] = useState<TouristData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTourist, setSelectedTourist] = useState<TouristData | null>(null);

  useEffect(() => {
    document.title = 'Tourists Management — SafeTour Admin';
    fetchTourists();
  }, []);

  const fetchTourists = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/tourists'); // We need to add this endpoint to backend
      if (res.data?.success) {
        setTourists(res.data.tourists);
      }
    } catch (err) {
      console.error('Failed to fetch tourists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTourists = tourists.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-xl admin-tourists-dashboard">
      <div className="flex items-center justify-between mb-xl">
        <div>
          <h1 className="font-extrabold flex items-center gap-sm text-3xl">
            <Users size={32} className="text-blue-500" />
            Registered Tourists
          </h1>
          <p className="text-slate-400 mt-2">
            Manage tourist accounts and verify their KYC and Blockchain ID statuses.
          </p>
        </div>
      </div>

      <div className="mb-6 relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-500" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Search tourists by name or email..."
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading tourists...</div>
        ) : filteredTourists.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-white">No tourists found</h3>
            <p className="text-slate-400">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Tourist Name</th>
                  <th className="p-4 font-semibold">Contact</th>
                  <th className="p-4 font-semibold">KYC Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredTourists.map((tourist) => (
                  <tr key={tourist._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{tourist.name}</div>
                      <div className="text-xs text-slate-500 mt-1">Joined {new Date(tourist.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300">{tourist.email}</div>
                      <div className="text-xs text-slate-500 mt-1">{tourist.phone || 'No phone'}</div>
                    </td>
                    <td className="p-4">
                      {tourist.isKycVerified ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                          <ShieldCheck size={14} /> Verified
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                          <ShieldAlert size={14} /> Unverified
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedTourist(tourist)}
                        className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
                      >
                        View Details <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedTourist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Tourist Identity</h3>
              <button onClick={() => setSelectedTourist(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                  <Users size={32} className="text-blue-400" />
                </div>
              </div>
              
              <div className="text-center">
                <h4 className="text-xl font-bold text-white">{selectedTourist.name}</h4>
                <p className="text-slate-400 text-sm mt-1">{selectedTourist.email}</p>
                <p className="text-slate-400 text-sm">{selectedTourist.phone}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Blockchain ID</div>
                  <div className="font-mono text-xs text-blue-400 break-all">
                    {selectedTourist.blockchainId || 'Not minted'}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">KYC Status</div>
                    {selectedTourist.isKycVerified ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-xs font-bold"><ShieldCheck size={14}/> Verified</span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1 text-xs font-bold"><ShieldAlert size={14}/> Unverified</span>
                    )}
                  </div>
                  
                  {selectedTourist.isKycVerified && (
                    <div className="bg-slate-900 p-3 rounded-lg flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <FileText className="text-slate-400" size={20} />
                        <div>
                          <div className="text-xs text-slate-400">{selectedTourist.idType} Document</div>
                          <div className="text-sm text-white font-mono tracking-widest">{selectedTourist.idNumberMasked}</div>
                        </div>
                      </div>
                      
                      {selectedTourist.kycDocumentUrl && (
                        <a 
                          href={`http://localhost:5000${selectedTourist.kycDocumentUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-2 text-center text-xs font-bold text-blue-400 border border-blue-500/30 rounded-lg py-2 hover:bg-blue-500/10 transition-colors"
                        >
                          View Uploaded Document
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
