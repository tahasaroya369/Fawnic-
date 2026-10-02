import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { IMAGE_ASSETS } from '../../utils/imageAssets.js';

interface CinematicHeroProps {
  onNavigate: (route: string, param?: any) => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden bg-stone-950">
      {/* Background Image with Cinematic Dark Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={IMAGE_ASSETS.homeHero}
          alt="FAWNIC Leather Atelier and Watch Boutique"
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-stone-950/40" />
        <div className="absolute inset-0 bg-stone-950/30 mix-blend-multiply" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8">
        {/* Subtle Luxury Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900/80 border border-stone-700/60 backdrop-blur-md text-amber-400 text-xs font-serif tracking-widest uppercase"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>FAWNIC Leather Atelier & Horology</span>
        </motion.div>

        {/* Primary Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-stone-100 tracking-tight leading-[1.1] max-w-4xl mx-auto"
        >
          Crafted for Men Who Value Detail.
        </motion.h1>

        {/* Supporting Text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-xl text-stone-300 font-normal max-w-2xl mx-auto leading-relaxed"
        >
          Premium leather essentials and refined timepieces, crafted with character.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button
            onClick={() => onNavigate('shop')}
            className="w-full sm:w-auto px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>Shop Collection</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onNavigate('about')}
            className="w-full sm:w-auto px-8 py-4 bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700/80 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 backdrop-blur-sm cursor-pointer"
          >
            Explore FAWNIC
          </button>
        </motion.div>

        {/* Minimal Bottom Trust Micro-Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="pt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-[11px] font-mono tracking-wider uppercase text-stone-400"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>100% Full-Grain Steerhide</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Precision Horology</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Nationwide TCS & Leopards Delivery</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
