import React from 'react';
import { motion } from 'motion/react';
import { Scissors, CheckCircle, ShieldCheck, Feather } from 'lucide-react';
import { IMAGE_ASSETS } from '../../utils/imageAssets.js';
import { isImageLoaded, markImageLoaded } from '../../services/productCache.js';

interface CraftedInDetailSectionProps {
  onNavigate: (route: string, param?: any) => void;
}

export const CraftedInDetailSection: React.FC<CraftedInDetailSectionProps> = ({ onNavigate }) => {
  return (
    <section className="py-20 sm:py-24 bg-stone-900 text-stone-100 overflow-hidden relative border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual Showcase Stage */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-800 aspect-[4/3] group bg-stone-950"
          >
            <img
              src={IMAGE_ASSETS.craftDetail}
              alt="Artisan hands stitching genuine full-grain leather"
              loading={isImageLoaded(IMAGE_ASSETS.craftDetail) ? 'eager' : 'lazy'}
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => markImageLoaded(IMAGE_ASSETS.craftDetail)}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="px-3.5 py-1.5 bg-stone-900/90 backdrop-blur-md rounded-full text-[11px] font-mono uppercase tracking-widest text-amber-400 border border-stone-700 shadow-md">
                Genuine Leather & Solid Hardware
              </span>
            </div>
          </motion.div>

          {/* Simple & Clear Editorial Content */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-7"
          >
            <div className="space-y-3">
              <span className="text-xs font-serif uppercase tracking-widest text-amber-400 font-semibold block">
                Quality In Every Stitch
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                The Details That Matter
              </h2>
              <p className="text-base sm:text-lg text-stone-300 font-normal leading-relaxed">
                From smooth hand-finished edges to solid metal hardware, every detail is made to last through years of daily use.
              </p>
            </div>

            {/* Key Micro-Details List in Simple English */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400">
                  <Scissors className="w-4 h-4 shrink-0" />
                  <h4 className="text-sm font-semibold text-stone-100 font-serif">Hand-Finished Edges</h4>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Edges are smoothed and sealed by hand so they don&apos;t fray or split.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <h4 className="text-sm font-semibold text-stone-100 font-serif">Solid Metal Hardware</h4>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Belt buckles and hardware are cast solid, never hollow or cheap.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <h4 className="text-sm font-semibold text-stone-100 font-serif">Heavy-Duty Thread</h4>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Stitched with strong thread that stays tight in your pocket every day.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400">
                  <Feather className="w-4 h-4 shrink-0" />
                  <h4 className="text-sm font-semibold text-stone-100 font-serif">Ages Beautifully</h4>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Real leather gets smoother and develops a handsome look over time.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('about')}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-xs font-serif font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md"
              >
                Learn About Our Craft
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
