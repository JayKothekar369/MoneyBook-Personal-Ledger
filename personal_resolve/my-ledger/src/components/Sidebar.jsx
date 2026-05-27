import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { 
  Home, 
  History, 
  Landmark, 
  BarChart3, 
  Bot, 
  Settings as SettingsIcon, 
  LogOut, 
  UserX,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar({ user, onLogout, onDeleteProfile, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { t } = useSettings();

  const navItems = [
    { name: t('dashboard'), path: '/', icon: Home },
    { name: t('transactions'), path: '/history', icon: History },
    { name: t('banks'), path: '/banks', icon: Landmark },
    { name: t('analytics'), path: '/analytics', icon: BarChart3 },
    { name: t('aiAssistant'), path: '/ai', icon: Bot },
    { name: t('settings'), path: '/settings', icon: SettingsIcon },
  ];

  const handleLinkClick = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 
        w-72 flex flex-col transition-transform duration-300 z-50
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">{user?.name ? user.name.charAt(0).toUpperCase() : 'M'}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 truncate max-w-[140px]">
                {user?.name || 'MoneyBook'}
              </h1>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[140px]">Logged in</p>
            </div>
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-slate-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={handleLinkClick}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium
                ${isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
          <button 
            onClick={onDeleteProfile}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all font-medium"
          >
            <UserX className="w-5 h-5" />
            {t('deleteProfile')}
          </button>
        </div>
      </aside>
    </>
  );
}
