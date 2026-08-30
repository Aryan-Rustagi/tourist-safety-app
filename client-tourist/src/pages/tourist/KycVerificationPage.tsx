import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { CheckCircle, ShieldAlert, FileText, Fingerprint, ArrowLeft, UploadCloud } from 'lucide-react';

export const KycVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [touristType, setTouristType] = useState<'Domestic' | 'International' | ''>('');
  const [idNumber, setIdNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  if (user.isKycVerified) {
    return (
      <div className="container py-xl min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">KYC Verified</h2>
          <p className="text-slate-400 mb-6">
            Your identity is successfully verified and secured on the Simulated Blockchain.
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left mb-6">
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Document Type</div>
            <div className="text-white font-semibold mb-4">{user.idType}</div>
            
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">ID Number</div>
            <div className="text-blue-400 font-mono text-lg">{user.idNumberMasked}</div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!touristType || !idNumber || !file) {
      setError('Please fill in all fields and upload a document.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const idType = touristType === 'Domestic' ? 'Aadhaar' : 'Passport';

    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('idType', idType);
      formData.append('idNumber', idNumber);
      formData.append('document', file);

      const res = await api.post('/auth/kyc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        await refreshProfile();
      } else {
        setError(res.data?.message || 'Verification failed. Please check your ID format.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
            <Fingerprint size={24} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">KYC Verification</h1>
            <p className="text-slate-400 text-sm">Upload your identity document for blockchain validation.</p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="mt-8 space-y-6">
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">Are you a Domestic or International Tourist?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setTouristType('Domestic'); setIdNumber(''); setError(''); setFile(null); }}
                className={`py-3 px-4 rounded-xl text-sm font-bold border transition-colors ${
                  touristType === 'Domestic'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Domestic (India)
              </button>
              <button
                type="button"
                onClick={() => { setTouristType('International'); setIdNumber(''); setError(''); setFile(null); }}
                className={`py-3 px-4 rounded-xl text-sm font-bold border transition-colors ${
                  touristType === 'International'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                International
              </button>
            </div>
          </div>

          {touristType && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  {touristType === 'Domestic' ? 'Aadhaar Number' : 'Passport Number'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FileText size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                    placeholder={touristType === 'Domestic' ? 'Enter 12-digit Aadhaar' : 'Enter 7-character Passport'}
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-base focus:outline-none focus:border-blue-500 transition-colors"
                    maxLength={touristType === 'Domestic' ? 12 : 7}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {touristType === 'Domestic' ? 'Format: Exactly 12 digits (e.g., 123456789012)' : 'Format: Exactly 7 alphanumeric characters'}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">Upload Document Photo</label>
                <label className={`block w-full border-2 border-dashed ${file ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-950'} rounded-2xl p-8 text-center cursor-pointer transition-colors`}>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className={`p-3 rounded-full ${file ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                      <UploadCloud size={32} />
                    </div>
                    {file ? (
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-slate-400 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-300 font-medium">Click to browse or drag and drop</p>
                        <p className="text-slate-500 text-xs mt-1">Supported: JPG, PNG, PDF (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-3 text-red-400 text-sm bg-red-950/40 p-4 rounded-xl border border-red-900/50">
                  <ShieldAlert size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !idNumber || !file}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(37,99,235,0.3)] disabled:shadow-none"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Uploading & Verifying...</span>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Secure Verification
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
