import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Compass, Award } from 'lucide-react';
import { IMAGE_ASSETS, getResponsiveImageProps } from '../../utils/imageAssets.js';
import { isImageLoaded, markImageLoaded } from '../../services/productCache.js';

interface BrandStorySectionProps {
  onNavigate: (route: string, param?: any) => void;
}

export const BrandStorySection: React.FC<BrandStorySectionProps> = ({ onNavigate }) => {
  const brandImgProps = getResponsiveImageProps(IMAGE_ASSETS.brandStory, 600);

  return (
    <section className="py-24 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Brand Story Imagery (5 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-200 dark:border-stone-800 aspect-[4/5] group">
              <img
                src={brandImgProps.src}
                srcSet={brandImgProps.srcSet}
                sizes="(max-width: 640px) 100vw, 500px"
                alt="FAWNIC Master craftsman bench and leather tools"
                loading={isImageLoaded(IMAGE_ASSETS.brandStory) ? 'eager' : 'lazy'}
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={() => markImageLoaded(IMAGE_ASSETS.brandStory)}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="px-3.5 py-1.5 bg-stone-900/80 backdrop-blur-md rounded-full text-[11px] font-mono uppercase tracking-widest text-amber-300 border border-stone-700/60">
                  Est. 2021 — Lahore, Punjab, Pakistan
                </span>
              </div>
            </div>
          </motion.div>

          {/* Brand Story Content (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>Our Heritage & Philosophy</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
                Born From an Obsession With Authentic Leather.
              </h2>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
              <p>
                FAWNIC was established with a singular conviction: men’s daily essentials should be crafted from genuine, uncompromised materials that grow more handsome with every year of use.
              </p>
              <p>
                Frustrated by mass-market faux leathers and disposable accessories, our founders partnered directly with generational leather tanneries in Punjab and skilled master saddlers. Every hide is tanned using natural tree bark extracts, skived to precision, and assembled with heavy-duty bonded thread.
              </p>
              <p>
                From classic bi-folds and solid brass harness belts to hand-regulated timepieces, every FAWNIC piece is an heirloom designed to accompany your life&apos;s most meaningful milestones.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => onNavigate('about')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-md"
              >
                <span>Discover Our Story</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
