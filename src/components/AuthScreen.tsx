import React, { useState } from 'react';
import { api } from '../utils/api.js';
import { User } from '../types.js';
import { KeyRound, ShieldAlert, Truck, UserCheck } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'dispatcher' | 'manager'>('dispatcher');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.auth.login({ email, password });
        localStorage.setItem('transit_token', response.token);
        localStorage.setItem('transit_user', JSON.stringify(response));
        onAuthSuccess(response);
      } else {
        const response = await api.auth.register({ name, email, password, role });
        localStorage.setItem('transit_token', response.token);
        localStorage.setItem('transit_user', JSON.stringify(response));
        onAuthSuccess(response);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.auth.login({ email: presetEmail, password: 'password123' });
      localStorage.setItem('transit_token', response.token);
      localStorage.setItem('transit_user', JSON.stringify(response));
      onAuthSuccess(response);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] p-6 relative overflow-hidden" id="auth-screen-container">
      {/* Decorative ambient background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-400/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0a0a15]/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800/80 p-8 z-10" id="auth-card">
        {/* Header Branding */}
        <div className="text-center mb-8" id="auth-branding">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-500 text-white rounded-xl mb-3 shadow-[0_0_15px_rgba(6,182,212,0.5)]" id="auth-logo-badge">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display italic" id="auth-title">Transit<span className="text-cyan-400">Ops</span></h1>
          <p className="text-sm text-slate-400 mt-1" id="auth-subtitle">Smart Transport Operations Platform</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-200 text-sm" id="auth-error">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                required
                placeholder="Elena Rostova"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#050508] border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent outline-none transition-all placeholder:text-slate-600 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="auth-email">Work Email</label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder="operator@transitops.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#050508] border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent outline-none transition-all placeholder:text-slate-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#050508] border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent outline-none transition-all placeholder:text-slate-600 text-sm"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="reg-role">Role Authorization</label>
              <select
                id="reg-role"
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#050508] border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent outline-none transition-all text-sm"
              >
                <option value="dispatcher">Dispatcher (Route Scheduler)</option>
                <option value="manager">Operations Manager</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
            ) : isLogin ? (
              'Sign In to Platform'
            ) : (
              'Create Dispatcher Account'
            )}
          </button>
        </form>

        {/* Navigation toggles */}
        <div className="mt-6 text-center text-sm" id="auth-switch-prompt">
          <button
            id="auth-switch-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer"
          >
            {isLogin ? "Need a new dispatcher account? Register" : "Already have an account? Sign In"}
          </button>
        </div>

        {/* Quick Demo Credentials */}
        {isLogin && (
          <div className="mt-8 pt-6 border-t border-slate-800/80" id="demo-credentials-section">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 justify-center">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Quick Demo Presets
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs" id="presets-grid">
              <button
                id="demo-admin-login-btn"
                onClick={() => handleQuickLogin('admin@transitops.com')}
                disabled={loading}
                className="p-2.5 bg-[#050508] hover:bg-[#0c0c1a] text-slate-300 border border-slate-800 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer"
              >
                <span className="font-semibold text-white">Chief Dispatcher</span>
                <span className="text-[10px] text-slate-500">Full Access (Admin)</span>
              </button>
              <button
                id="demo-dispatch-login-btn"
                onClick={() => handleQuickLogin('sarah@transitops.com')}
                disabled={loading}
                className="p-2.5 bg-[#050508] hover:bg-[#0c0c1a] text-slate-300 border border-slate-800 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer"
              >
                <span className="font-semibold text-white">Sarah Jenkins</span>
                <span className="text-[10px] text-slate-500">Standard Operator</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
