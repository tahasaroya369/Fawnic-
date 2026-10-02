import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { IMAGE_ASSETS, getResponsiveImageProps } from '../../utils/imageAssets.js';
import { isImageLoaded, markImageLoaded } from '../../services/productCache.js';

interface FinalCtaSectionProps {
  onNavigate: (route: string, param?: any) => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onNavigate }) => {
  const ctaImgProps = getResponsiveImageProps(IMAGE_ASSETS.finalCta, 900);

  return (
    <section className="relative py-28 sm:py-32 bg-stone-950 text-white overflow-hidden">
      {/* Background Unique Image with Dark Atelier Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={ctaImgProps.src}
          srcSet={ctaImgProps.srcSet}
          sizes="100vw"
          alt="FAWNIC Leather Goods & Watches Atelier"
          loading={isImageLoaded(IMAGE_ASSETS.finalCta) ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => markImageLoaded(IMAGE_ASSETS.finalCta)}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold tracking-widest uppercase backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FAWNIC Leather Atelier</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
          Find Your Everyday Essential.
        </h2>

        <p className="text-sm sm:text-base md:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed font-light">
          Handcrafted full-grain leather goods and mechanical timepieces built to accompany your journey for decades to come.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('shop', 'wallets')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs uppercase tracking-wider shadow-xl shadow-amber-950/50 transition-all cursor-pointer group"
          >
            <span>Shop Wallets</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => onNavigate('shop', 'watches')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold uppercase tracking-wider transition-colors backdrop-blur-md cursor-pointer"
          >
            <span>Explore Watches</span>
          </button>
        </div>

        {/* Security / Quality Micro-Badge */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            100% Full-Grain Guaranteed
          </span>
          <span className="text-stone-700">•</span>
          <span>Insured TCS & Leopards Courier</span>
          <span className="text-stone-700">•</span>
          <span>Cash on Delivery Available</span>
        </div>
      </div>
    </section>
  );
};
