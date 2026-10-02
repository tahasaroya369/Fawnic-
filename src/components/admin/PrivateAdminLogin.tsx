import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface PrivateAdminLoginProps {
  onSuccess: () => void;
  onReturnToStore: () => void;
}

export const PrivateAdminLogin: React.FC<PrivateAdminLoginProps> = ({
  onSuccess,
  onReturnToStore,
}) => {
  const { setSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'admin' | 'staff'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTabChange = (tab: 'admin' | 'staff') => {
    setActiveTab(tab);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = activeTab === 'admin' ? '/api/auth/admin-login' : '/api/auth/staff-login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (activeTab === 'admin' ? 'Invalid administrator email or password.' : 'Authentication failed. Please check your credentials.'));
      }

      if (activeTab === 'admin' && data.user?.role !== 'admin') {
        throw new Error('Invalid administrator email or password.');
      }

      if (activeTab === 'staff' && data.user?.role !== 'staff') {
        throw new Error('Access Denied: Only Atelier Staff members can use this login.');
      }

      // Store in auth context
      setSession(data.token, data.user);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid administrator email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-amber-500 selection:text-stone-950">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-7 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-xl shadow-amber-950/50 mx-auto border border-amber-500/30">
            F
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl tracking-widest text-stone-100 uppercase">
              FAWNIC
            </h1>
            <p className="text-[11px] font-mono tracking-widest uppercase text-amber-500 mt-1">
              Private Atelier Management Portal
            </p>
          </div>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">
            Authorized administrative & craftsman access only. All activities are cryptographically verified.
          </p>
        </div>

        {/* Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-7 shadow-2xl backdrop-blur-md space-y-5">
          {/* Admin vs Staff Tabs */}
          <div className="flex rounded-xl bg-stone-950 p-1 border border-stone-800">
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('staff')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'staff'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Staff Login</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800/90 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="space-y-0.5">
                <p className="font-semibold text-rose-300">
                  {error.includes('disabled') ? 'Account Access Restricted' : 'Authentication Error'}
                </p>
                <p className="text-stone-300 text-[11px] leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                {activeTab === 'admin' ? 'Administrator Email' : 'Staff Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'admin' ? 'admin@fawnic.pk' : 'staff@fawnic.pk'}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950/80 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-950/80 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate as {activeTab === 'admin' ? 'Admin' : 'Staff'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {activeTab === 'staff' && (
            <div className="p-3 bg-stone-950/50 border border-stone-800/80 rounded-xl text-[11px] text-stone-400">
              <p>Staff accounts are issued and managed by the Atelier Super Admin. Logins are lifetime accounts unless disabled.</p>
            </div>
          )}
        </div>

        {/* Return to Public Website */}
        <div className="text-center">
          <button
            type="button"
            onClick={onReturnToStore}
            className="text-xs text-stone-500 hover:text-stone-300 transition"
          >
            ← Return to FAWNIC Public Boutique
          </button>
        </div>
      </div>
    </div>
  );
};
