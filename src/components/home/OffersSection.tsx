import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, CheckCircle2, ArrowRight, BellRing } from 'lucide-react';

interface OffersSectionProps {
  onNavigate: (route: string, param?: any) => void;
}

export const OffersSection: React.FC<OffersSectionProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  return (
    <section className="py-20 bg-stone-100 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-mono uppercase tracking-widest">
          <BellRing className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Private Gazette</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Private Offers & New Arrivals
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
            Stay updated with the latest FAWNIC releases, small-batch workshop drops, and seasonal member privileges.
          </p>
        </div>

        {subscribed ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl max-w-md mx-auto text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Shukriya! You are registered for private atelier notices and releases.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
            <div className="relative w-full">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-full text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        )}

        <div className="pt-2">
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View Latest Updates & Arrivals</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </section>
  );
};
