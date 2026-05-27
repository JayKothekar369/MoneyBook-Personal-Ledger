import React, { useState } from 'react';
import { User, LogOut, Settings, Wallet, BookOpen, ShieldCheck, IndianRupee, Edit2, Trash2, Check, X } from 'lucide-react';

export default function Header({ users, activeUserId, setActiveUserId, editUser, deleteUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const activeUser = users.find(u => u.id === activeUserId);

  const handleEdit = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    editUser(activeUserId, editName.trim());
    setIsEditing(false);
  };

  const startEdit = () => {
    setEditName(activeUser?.name || '');
    setIsEditing(true);
  };

  const confirmDelete = () => {
    if (window.confirm('Are you sure you want to delete this profile and all its data?')) {
      deleteUser(activeUserId);
      setActiveUserId('');
    }
  };

  const logout = () => {
    setActiveUserId('');
  };

  return (
    <div className="glass-panel p-4 md:p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-20 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-4 relative z-10">
        <img src="/moneybook_logo.svg" alt="MoneyBook" className="h-16 w-auto object-contain hover-lift" />
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-2 pl-4 rounded-2xl border border-slate-700/50 relative z-10">
        <User className="w-5 h-5 text-indigo-400" />
        
        {isEditing ? (
          <form onSubmit={handleEdit} className="flex items-center gap-2">
            <input 
              autoFocus
              type="text" 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="glass-input w-32 rounded-xl px-2 py-1 text-sm font-bold text-white focus:outline-none"
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-1 hover-lift"><Check className="w-4 h-4" /></button>
            <button type="button" onClick={() => setIsEditing(false)} className="text-rose-400 hover:text-rose-300 p-1 hover-lift"><X className="w-4 h-4" /></button>
          </form>
        ) : (
          <div className="text-sm font-bold text-slate-200 pr-2">
            {activeUser?.name || 'Guest'}
          </div>
        )}
        
        {activeUser && !activeUser.isGuest && !isEditing && (
          <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-700/50">
            <button onClick={startEdit} className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-700/50 transition-colors hover-lift" title="Edit Profile">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={confirmDelete} className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors hover-lift" title="Delete Profile">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="ml-1 pl-2 border-l border-slate-700/50">
          <button onClick={logout} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors hover-lift px-2 py-1.5 rounded-lg hover:bg-rose-500/10" title="Logout">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
