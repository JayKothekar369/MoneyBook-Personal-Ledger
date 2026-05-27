import React, { useState, useEffect } from 'react';
import { User, Lock, Key, TrendingUp, PiggyBank, Coins, ArrowRight, Phone, Eye, EyeOff, IndianRupee } from 'lucide-react';

export default function AuthPage({ onLoginSuccess, onGuestLogin, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'otp' | 'forgot' | 'forgot-otp'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (newMode) => {
    setMode(newMode);
    if (newMode === 'login' || newMode === 'register' || newMode === 'forgot') {
      setName('');
      setPassword('');
      setMobile('');
      setOtp('');
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, password })
        });
        const data = await res.json();
        
        if (data.success) {
          onLoginSuccess(data.user.id);
        } else {
          setError(data.error || 'Login failed');
        }
      } else if (mode === 'register') {
        const res = await fetch('/api/auth/register-init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, password, mobile })
        });
        const data = await res.json();
        
        if (data.success) {
          setMode('otp');
        } else {
          setError(data.error || 'Registration failed');
        }
      } else if (mode === 'otp') {
        const res = await fetch('/api/auth/register-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, otp })
        });
        const data = await res.json();
        
        if (data.success) {
          onLoginSuccess(data.user.id, "Successfully Registered! Welcome to MoneyBook.");
        } else {
          setError(data.error || 'Invalid OTP');
        }
      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        
        if (data.success) {
          setMode('forgot-otp');
        } else {
          setError(data.error || 'User not found');
        }
      } else if (mode === 'forgot-otp') {
        const res = await fetch('/api/auth/forgot-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, otp, newPassword: password })
        });
        const data = await res.json();
        
        if (data.success) {
          switchMode('login');
          showToast("Password updated successfully! Please login.");
        } else {
          setError(data.error || 'Invalid OTP');
        }
      }
    } catch (err) {
      setError('Network error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      
      {/* Background elements */}
      <div className="absolute top-[10%] left-[10%] text-cyan-500/10 animate-[pulse_4s_ease-in-out_infinite] blur-sm"><TrendingUp className="w-48 h-48" /></div>
      <div className="absolute bottom-[10%] right-[10%] text-indigo-500/10 animate-[pulse_5s_ease-in-out_infinite] delay-700 blur-sm"><PiggyBank className="w-48 h-48" /></div>
      <div className="absolute top-1/2 right-[20%] text-teal-500/10 animate-[pulse_3s_ease-in-out_infinite] delay-300 blur-sm"><Coins className="w-32 h-32" /></div>
      
      {/* Floating Money Visuals */}
      <div className="absolute top-[30%] left-[20%] text-cyan-500/20 animate-bounce delay-100"><IndianRupee className="w-16 h-16" /></div>
      <div className="absolute bottom-[20%] left-[30%] text-indigo-500/20 animate-bounce delay-500"><IndianRupee className="w-24 h-24" /></div>
      <div className="absolute top-[20%] right-[20%] text-teal-500/20 animate-bounce delay-300"><IndianRupee className="w-20 h-20" /></div>
      <div className="absolute bottom-[30%] right-[25%] text-cyan-500/20 animate-bounce delay-700"><IndianRupee className="w-16 h-16" /></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl z-10 animate-fade-in relative overflow-hidden">
        
        {/* Glow orb */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-8 relative z-10">
          <img src="/moneybook_logo.svg" alt="MoneyBook Logo" className="h-28 w-auto mx-auto mb-2 object-contain hover-lift" />
          <p className="text-slate-400 text-sm mt-2 font-medium">
            {mode === 'login' ? 'Welcome back. Access your portal.' : 
             mode === 'register' ? 'Initialize your financial profile.' : 
             mode === 'forgot' ? 'Reset your password.' :
             'Verify your identity.'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {(mode === 'login' || mode === 'register' || mode === 'forgot' || mode === 'forgot-otp') && (
            <>
              {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl font-medium"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              )}
              
              {(mode === 'login' || mode === 'register' || mode === 'forgot-otp') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                    {mode === 'forgot-otp' ? 'New Password' : 'Password'}
                  </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="glass-input w-full pl-10 pr-10 py-3 rounded-xl font-medium"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}
              
            {mode === 'register' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="tel" 
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl font-medium"
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>
              )}
              {mode === 'forgot-otp' && (
                <div className="space-y-1 animate-fade-in mt-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Secure OTP</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl font-medium tracking-widest text-lg"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 pl-1">OTP sent to your registered mobile. Check terminal.</p>
                </div>
              )}
            </>
          )}

          {mode === 'otp' && (
            <div className="space-y-1 animate-fade-in">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Secure OTP</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl font-medium tracking-widest text-lg"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 pl-1">OTP sent to {mobile}. Check the server terminal.</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : mode === 'login' ? 'Access Portal' : mode === 'register' ? 'Register Profile' : mode === 'forgot' ? 'Send OTP' : 'Verify & Enter'}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col items-center gap-4 relative z-10">
          {mode === 'login' ? (
            <>
              <p className="text-sm text-slate-400">
                New to MoneyBook?{' '}
                <button onClick={() => switchMode('register')} className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Create Profile</button>
              </p>
              <button onClick={() => switchMode('forgot')} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">Forgot Password?</button>
            </>
          ) : mode === 'register' || mode === 'forgot' ? (
            <p className="text-sm text-slate-400">
              Already have a profile?{' '}
              <button onClick={() => switchMode('login')} className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Login Here</button>
            </p>
          ) : (
             <p className="text-sm text-slate-400">
              Need to restart?{' '}
              <button onClick={() => switchMode('login')} className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Go back</button>
            </p>
          )}

          <button 
            onClick={onGuestLogin}
            className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors mt-2"
          >
            Continue as Guest (Volatile Session)
          </button>
        </div>

      </div>
    </div>
  );
}
