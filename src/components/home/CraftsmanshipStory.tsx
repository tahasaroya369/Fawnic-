import React from 'react';
import { motion } from 'motion/react';
import { Compass, Award, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface CraftsmanshipStoryProps {
  onNavigate: (route: string, param?: any) => void;
}

export const CraftsmanshipStory: React.FC<CraftsmanshipStoryProps> = ({ onNavigate }) => {
  return (
    <section id="craftsmanship-story" className="py-24 bg-stone-100/60 dark:bg-stone-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual Story Collage with 3D Depth */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Primary Large Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 bg-stone-900 aspect-[4/5] sm:aspect-[3/4]">
                <img
                  src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&auto=format&fit=crop&q=85"
                  alt="Artisan crafting leather by hand"
                  loading="lazy"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
                    The Workbench Heritage
                  </span>
                  <p className="text-sm font-light text-stone-200 mt-1">
                    Vegetable-tanned hides aging with character under natural light.
                  </p>
                </div>
              </div>

              {/* Overlapping Floating Small Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="hidden sm:flex absolute -bottom-8 -right-8 w-64 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      Lifetime Pledge
                    </h4>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      Unconditional Stitch Warranty
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-light">
                  If any seam, rivet, or brass component fails under normal use, our atelier repairs it at no charge.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold tracking-wider uppercase">
              <Compass className="w-3.5 h-3.5" />
              <span>Our Atelier Genesis</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 dark:text-stone-50 tracking-tight leading-tight">
              Evolving from an Atelier into a Curated Luxury Guild
            </h2>

            <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed font-light">
              FAWNIC was founded on an unapologetic belief: objects you interact with every day should tell a story of human mastery. What began as a single workbench dedicated to full-grain leather goods has now grown into a premier multi-vendor guild.
            </p>

            <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed font-light">
              Today, we invite independent master horologists, luggage artisans, and brass-smiths to share our stage. Each vendor is vetted for continuous raw material provenance, hand-finished assembly, and transparent workshop ethics.
            </p>

            {/* Checklist of Principles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {[
                'Zero bonded or synthetic faux leather',
                'Solid forged lead-free brass hardware',
                'Hand-wound & automatic Swiss calibers',
                'Artisan repair & re-burnishing service',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-stone-800 dark:text-stone-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => onNavigate('about')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-100 dark:text-stone-950 text-xs sm:text-sm font-semibold tracking-wide shadow-md transition-colors cursor-pointer group"
              >
                <span>Read Full Atelier Manifesto</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
