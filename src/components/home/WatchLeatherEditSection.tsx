import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Compass, Shield } from 'lucide-react';
import { IMAGE_ASSETS, getResponsiveImageProps } from '../../utils/imageAssets.js';
import { isImageLoaded, markImageLoaded } from '../../services/productCache.js';

interface WatchLeatherEditSectionProps {
  onNavigate: (route: string, param?: any) => void;
}

export const WatchLeatherEditSection: React.FC<WatchLeatherEditSectionProps> = ({ onNavigate }) => {
  return (
    <section className="py-24 bg-stone-950 text-stone-100 relative overflow-hidden border-b border-stone-800">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Editorial Text (5 Columns) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-amber-400 text-xs font-serif tracking-widest uppercase">
              <Compass className="w-3.5 h-3.5" />
              <span>Editorial Luxury Campaign</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                The Modern Gentleman&apos;s Trio
              </h2>
              <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-normal">
                A deliberate synthesis of vegetable-tanned steerhide, solid forged brass, and mechanical horology. Curated to complement each other in shade, texture, and character.
              </p>
            </div>

            {/* The 3 Elements Breakdown */}
            <div className="space-y-4 pt-4 border-t border-stone-800">
              <div
                onClick={() => onNavigate('shop', 'wallets')}
                className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-stone-900/80 transition-colors cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-stone-800 text-amber-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                  01
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-white group-hover:text-amber-400 transition-colors">
                    The Saddle Brown Bifold Wallet
                  </h4>
                  <p className="text-xs text-stone-400">
                    Italian vegetable-tanned leather with 8 calibrated card slots and certified RFID defense.
                  </p>
                </div>
              </div>

              <div
                onClick={() => onNavigate('shop', 'belts')}
                className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-stone-900/80 transition-colors cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-stone-800 text-amber-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                  02
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-white group-hover:text-amber-400 transition-colors">
                    The Full-Grain Harness Belt
                  </h4>
                  <p className="text-xs text-stone-400">
                    Continuous 9oz steerhide strap featuring a hand-buffed sand-molded brass buckle.
                  </p>
                </div>
              </div>

              <div
                onClick={() => onNavigate('shop', 'watches')}
                className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-stone-900/80 transition-colors cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-stone-800 text-amber-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                  03
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-white group-hover:text-amber-400 transition-colors">
                    The Heritage Automatic Watch
                  </h4>
                  <p className="text-xs text-stone-400">
                    Sunray dial with scratchproof sapphire crystal and vegetable-tanned matching strap.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('shop')}
                className="px-7 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40"
              >
                <span>Shop The Ensemble</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

          {/* Editorial Campaign Stage (7 Columns) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-800 aspect-[5/4] sm:aspect-[4/3] group">
              <img
                src={IMAGE_ASSETS.editorialCampaign}
                alt="The Modern Gentleman's Trio: Handcrafted Leather Wallet, Belt and Luxury Watch"
                loading={isImageLoaded(IMAGE_ASSETS.editorialCampaign) ? 'eager' : 'lazy'}
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={() => markImageLoaded(IMAGE_ASSETS.editorialCampaign)}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-amber-400 uppercase tracking-widest">FAWNIC Atelier</p>
                  <p className="text-base font-serif font-bold text-white">Autumn / Winter Edition</p>
                </div>
                <button
                  onClick={() => onNavigate('shop')}
                  className="px-4 py-2 rounded-full bg-white/20 hover:bg-white text-white hover:text-stone-950 backdrop-blur-md text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  View Lookbook
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
