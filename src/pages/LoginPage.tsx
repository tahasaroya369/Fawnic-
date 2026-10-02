import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { getPendingShoppingAction, clearPendingShoppingAction } from '../utils/authGuard.js';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal.js';

interface LoginPageProps {
  onNavigate: (route: string, param?: any) => void;
  defaultRole?: 'customer' | 'admin';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist } = useWishlist();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (res.user?.role === 'admin') {
        onNavigate('admin-dashboard');
        return;
      }

      const pending = getPendingShoppingAction();
      if (pending) {
        clearPendingShoppingAction();
        if (pending.action === 'add_to_cart' && pending.product) {
          addToCart(pending.product, pending.quantity || 1, pending.selectedVariants);
          if (pending.returnRoute) {
            onNavigate(pending.returnRoute, pending.returnParam);
            return;
          }
        } else if (pending.action === 'buy_now' && pending.product) {
          addToCart(pending.product, pending.quantity || 1, pending.selectedVariants);
          onNavigate('checkout');
          return;
        } else if (pending.action === 'wishlist' && pending.product) {
          toggleWishlist(pending.product);
          if (pending.returnRoute) {
            onNavigate(pending.returnRoute, pending.returnParam);
            return;
          }
        } else if (pending.action === 'checkout') {
          onNavigate('checkout');
          return;
        }
      }

      onNavigate('profile');
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please check your email and password.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_25px_70px_rgba(0,0,0,0.15)] transition-all duration-300">
        
        {/* LEFT COLUMN: Luxury Men's Brand Showcase (Desktop) */}
        <div className="lg:col-span-6 relative bg-stone-950 text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden min-h-[220px] sm:min-h-[280px] lg:min-h-[600px]">
          {/* Subtle 3D background lighting and texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/30 via-stone-950 to-stone-950 z-0 pointer-events-none" />
          
          <img
            src="https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1200"
            alt="FAWNIC Handcrafted Leather Atelier"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000 ease-out hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent z-10" />

          {/* Top Brand Tag */}
          <div className="relative z-20 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shrink-0">
              <span className="font-serif font-black text-base sm:text-lg tracking-wider text-stone-100">F</span>
            </div>
            <div>
              <span className="font-serif text-xs sm:text-sm tracking-[0.25em] font-bold text-stone-200 block uppercase">
                FAWNIC
              </span>
              <span className="text-[9px] sm:text-[10px] text-stone-400 tracking-widest uppercase">
                Leather Atelier & Marketplace
              </span>
            </div>
          </div>

          {/* Center Editorial Focus */}
          <div className="relative z-20 my-auto py-4 sm:py-8 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] text-stone-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Artisanal Men's Lifestyle & Accessories</span>
            </div>

            <h2 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-100 leading-tight">
              Mastery of Grain, <br />
              <span className="text-stone-400 font-light italic">Timeless In Stature.</span>
            </h2>

            <p className="hidden sm:block text-xs sm:text-sm text-stone-400 max-w-md leading-relaxed">
              Sign in to track nationwide courier deliveries across Pakistan, manage saved addresses, and access your private customer portal.
            </p>

            {/* Feature Badges */}
            <div className="pt-1 sm:pt-2 hidden sm:grid grid-cols-2 gap-2 max-w-sm text-[11px] text-stone-300">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Encrypted Order History</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Live Courier Tracking</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-20 text-[10px] sm:text-[11px] text-stone-500 hidden sm:flex items-center justify-between pt-4 border-t border-white/10">
            <span>© 2026 FAWNIC Atelier</span>
            <span>Karachi • Lahore • Islamabad</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Professional Login Card */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-stone-50/50 dark:bg-stone-900/50">
          <div className="max-w-md mx-auto w-full space-y-6">
            
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-950 dark:text-stone-50 tracking-tight">
                Sign In
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Welcome back. Enter your credentials to access your account.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-700 dark:text-rose-400 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Email Address */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    required
                    className="w-full pl-10 pr-3.5 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs text-xs text-stone-900 dark:text-stone-100 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-stone-700 dark:text-stone-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200 font-semibold cursor-pointer underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs text-xs text-stone-900 dark:text-stone-100 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Register */}
            <div className="pt-4 border-t border-stone-200/70 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
              <p>
                Don't have an account yet?{' '}
                <button
                  onClick={() => onNavigate('register')}
                  className="text-stone-950 dark:text-stone-100 font-bold hover:underline cursor-pointer"
                >
                  Create an Account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Real 3-Step Verification Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={email}
        onSuccessRedirectToLogin={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};
