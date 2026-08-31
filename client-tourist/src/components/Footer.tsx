import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const Footer: React.FC<{ portal?: 'tourist' | 'admin' }> = ({ portal = 'tourist' }) => {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 py-8 mt-auto" role="contentinfo">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-gray-900 p-1.5 rounded-md border border-gray-800">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-wide text-sm">Safar Setu</span>
        </div>
        
        <p className="text-gray-400 text-xs mb-6 max-w-md mx-auto">
          Real-time tourist safety, one-touch SOS dispatch, and crowd-sourced incident intelligence.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
          {portal === 'tourist' ? (
            <>
              <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <Link to="/zones" className="hover:text-white transition-colors">Safety Zones</Link>
              <Link to="/report" className="hover:text-white transition-colors">Report Incident</Link>
            </>
          ) : (
            <>
              <Link to="/" className="hover:text-white transition-colors">Command Center</Link>
              <Link to="/zones" className="hover:text-white transition-colors">Zone Management</Link>
            </>
          )}
          <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-800/50 flex flex-col md:flex-row items-center justify-center gap-2 text-[10px] text-gray-600">
          <p>© 2026 Safar Setu. SIH 2026.</p>
          <span className="hidden md:inline">•</span>
          <p>{portal === 'admin' ? 'Police & Rescue Command' : 'Tourist Portal'}</p>
        </div>
      </div>
    </footer>
  );
};
