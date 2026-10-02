import React, { useState, useEffect } from 'react';
import { Tag, Copy, Check, Sparkles, ArrowRight } from 'lucide-react';

interface PromotionalBannerProps {
  onNavigate: (route: string, param?: any) => void;
}

export const PromotionalBanner: React.FC<PromotionalBannerProps> = ({ onNavigate }) => {
  const [copied, setCopied] = useState(false);
  const [promoCode, setPromoCode] = useState('ATELIER15');
  const [promoTitle, setPromoTitle] = useState('Atelier Autumn Grand Reveal');
  const [promoDesc, setPromoDesc] = useState(
    'Experience the launch of our multi-vendor luxury collective. Enjoy 15% off signature timepieces, leather crafts, and artisan luggage.'
  );

  useEffect(() => {
    fetch('/api/promotions')
      .then((res) => (res.ok ? res.json() : []))
      .then((promos) => {
        if (Array.isArray(promos) && promos.length > 0) {
          const active = promos[0];
          if (active.code) setPromoCode(active.code);
          if (active.title) setPromoTitle(active.title);
          if (active.description) setPromoDesc(active.description);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="py-12 bg-stone-50 dark:bg-stone-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl p-8 sm:p-12 lg:p-16">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full bg-amber-600/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 rounded-full bg-stone-700/20 blur-3xl pointer-events-none" />

          {/* Background Decorative Motif */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none overflow-hidden hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1000&auto=format&fit=crop&q=85"
              alt="Decorative watch background"
              className="w-full h-full object-cover object-center brightness-150"
            />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold tracking-widest uppercase mb-4 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Limited Collective Release</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight">
              {promoTitle}
            </h3>

            <p className="mt-3 text-sm sm:text-base text-stone-300 font-light leading-relaxed">
              {promoDesc}
            </p>

            {/* Voucher Code Copy Bar & CTA Button */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {/* Promo Code Box */}
              <div className="flex items-center rounded-xl bg-stone-950/80 border border-stone-700/80 p-1.5 shadow-inner">
                <div className="flex items-center gap-2 px-3 py-1 text-stone-200">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span className="font-mono font-bold tracking-wider text-amber-400 text-sm">
                    {promoCode}
                  </span>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onNavigate('shop')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-950/40 transition-colors cursor-pointer group"
              >
                <span>Shop With Voucher</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
