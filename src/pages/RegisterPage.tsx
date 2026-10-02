import React, { useState } from 'react';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { getPendingShoppingAction, clearPendingShoppingAction } from '../utils/authGuard.js';

interface RegisterPageProps {
  onNavigate: (route: string, param?: any) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist } = useWishlist();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+92 ');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter carefully.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    setLoading(true);
    const res = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });
    setLoading(false);

    if (res.success) {
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
      setErrorMsg(res.error || 'Account creation failed. Please check details.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_25px_70px_rgba(0,0,0,0.15)] transition-all duration-300">
        
        {/* LEFT COLUMN: Brand & Atelier Showcase (Desktop) */}
        <div className="lg:col-span-5 relative bg-stone-950 text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden min-h-[220px] sm:min-h-[280px] lg:min-h-[660px]">
          {/* Subtle 3D background lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-900/30 via-stone-950 to-stone-950 z-0 pointer-events-none" />
          
          <img
            src="/assets/images/card_mens_belt_1790447805889.jpg"
            alt="FAWNIC Handcrafted Leather Belts and Goods"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000 ease-out hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-transparent z-10" />

          {/* Top Brand Logo */}
          <div className="relative z-20 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shrink-0">
              <span className="font-serif font-black text-base sm:text-lg tracking-wider text-stone-100">F</span>
            </div>
            <div>
              <span className="font-serif text-xs sm:text-sm tracking-[0.25em] font-bold text-stone-200 block uppercase">
                FAWNIC
              </span>
              <span className="text-[9px] sm:text-[10px] text-stone-400 tracking-widest uppercase">
                Leather Atelier
              </span>
            </div>
          </div>

          {/* Center Content */}
          <div className="relative z-20 my-auto py-4 sm:py-8 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] text-stone-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Join FAWNIC Customer Portal</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-serif font-bold text-stone-100 leading-tight">
              Curated Craftsmanship. <br />
              <span className="text-stone-400 font-light italic">Seamless Experience.</span>
            </h2>

            <p className="hidden sm:block text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">
              Create your account to unlock instant order tracking, simplified checkout, address management, and customer support.
            </p>

            {/* Value bullets */}
            <div className="pt-1 sm:pt-2 space-y-2 text-xs text-stone-300 hidden sm:block">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time courier delivery tracking across Pakistan</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Save multiple delivery addresses for fast checkout</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Direct atelier support and hassle-free 7-day returns</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-20 text-[10px] sm:text-[11px] text-stone-500 hidden sm:flex items-center justify-between pt-4 border-t border-white/10">
            <span>Official Atelier Portal</span>
            <span>Secure 256-bit Encryption</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-stone-50/50 dark:bg-stone-900/50">
          <div className="max-w-md mx-auto w-full space-y-6">
            
            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-950 dark:text-stone-50 tracking-tight">
                Create Account
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Join FAWNIC to manage your orders, wishlist, and shipping addresses.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-700 dark:text-rose-400 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs text-xs text-stone-900 dark:text-stone-100 transition-colors"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs text-xs text-stone-900 dark:text-stone-100 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Mobile Number (for Courier SMS Alerts) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 3XX XXXXXXX"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs text-xs text-stone-900 dark:text-stone-100 transition-colors font-mono"
                  />
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs text-xs text-stone-900 dark:text-stone-100 transition-colors"
                    />
                    <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs text-xs text-stone-900 dark:text-stone-100 transition-colors"
                    />
                    <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-4"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Login */}
            <div className="pt-4 border-t border-stone-200/70 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => onNavigate('login')}
                  className="text-stone-950 dark:text-stone-100 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
