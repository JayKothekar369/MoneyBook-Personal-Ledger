import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in flex items-center justify-between min-w-[300px] p-4 glass-panel border border-emerald-500/30 rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.2)]">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <p className="text-white font-bold text-sm">{message}</p>
      </div>
      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-4"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
