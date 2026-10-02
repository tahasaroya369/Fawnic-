import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Sparkles, ArrowRight, Tag } from 'lucide-react';

interface LookbookSectionProps {
  onNavigate: (route: string, param?: any) => void;
}

interface LookbookItem {
  id: string;
  title: string;
  season: string;
  image: string;
  description: string;
  taggedProducts: {
    name: string;
    price: string;
    category: string;
    slug?: string;
  }[];
}

const LOOKBOOKS: LookbookItem[] = [
  {
    id: 'look_01',
    title: 'The Modern Connoisseur',
    season: 'Autumn / Winter Edition',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&auto=format&fit=crop&q=85',
    description: 'Precision tailoring balanced by an automatic chronograph and the sovereign full-grain leather wallet.',
    taggedProducts: [
      { name: 'The Sovereign Bifold Wallet', price: 'Rs. 4,850', category: 'wallets', slug: 'sovereign-executive-bifold-wallet' },
      { name: 'The Vanguard Chronomaster 40mm', price: 'Rs. 38,500', category: 'watches', slug: 'vanguard-chronomaster-40mm-automatic' },
      { name: 'Solid Brass Formal Steerhide Belt', price: 'Rs. 4,650', category: 'belts', slug: 'artisan-solid-brass-full-grain-formal-belt' },
    ],
  },
  {
    id: 'look_02',
    title: 'The Weekend Voyager',
    season: 'Travel & Exploration',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&auto=format&fit=crop&q=85',
    description: 'Unlined pull-up cowhide luggage engineered for transatlantic cabins, high-altitude train cars, and coastal getaways.',
    taggedProducts: [
      { name: 'Grand Voyageur 55L Duffle', price: 'Rs. 24,500', category: 'bags', slug: 'saint-honore-grand-voyageur-leather-duffle' },
      { name: 'Minimalist Hand-Stitched Card Sleeve', price: 'Rs. 2,250', category: 'card-holders', slug: 'minimalist-hand-stitched-card-sleeve' },
      { name: 'Leather Valet Catchall Tray', price: 'Rs. 2,750', category: 'accessories', slug: 'handcrafted-leather-valet-catchall-tray' },
    ],
  },
  {
    id: 'look_03',
    title: 'The Executive Suite',
    season: 'Boardroom & Private Office',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&auto=format&fit=crop&q=85',
    description: 'Structured English bridle hide that stands independently beside your desk, guarding vital documents and electronics.',
    taggedProducts: [
      { name: 'The Diplomat Executive Briefcase', price: 'Rs. 21,800', category: 'bags', slug: 'diplomat-leather-executive-briefcase' },
      { name: 'The Aethelgard Heritage Dual-Time', price: 'Rs. 44,000', category: 'watches', slug: 'aethelgard-heritage-dual-time-dress-watch' },
      { name: 'The Royal Continental Long Wallet', price: 'Rs. 6,800', category: 'wallets', slug: 'royal-continental-long-wallet' },
    ],
  },
];

export const LookbookSection: React.FC<LookbookSectionProps> = ({ onNavigate }) => {
  const [activeLook, setActiveLook] = useState<number>(0);

  const look = LOOKBOOKS[activeLook];

  return (
    <section id="lookbook" className="py-24 bg-stone-900 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold tracking-widest uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Ensembles</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight">
              Editorial Lookbook
            </h2>

            <p className="mt-2 text-stone-300 max-w-xl text-sm sm:text-base font-light">
              Explore how timepieces, steerhide leather, and luggage coalesce into an effortless signature wardrobe.
            </p>
          </div>

          {/* Lookbook Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {LOOKBOOKS.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActiveLook(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeLook === idx
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* Editorial Showcase Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-stone-950 border border-stone-800 overflow-hidden shadow-2xl p-6 sm:p-8 lg:p-10">
          {/* Main Visual Frame */}
          <div className="lg:col-span-7 relative h-[420px] sm:h-[500px] rounded-2xl overflow-hidden bg-stone-900">
            <AnimatePresence mode="wait">
              <motion.img
                key={look.id}
                src={look.image}
                alt={look.title}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full h-full object-cover object-center"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-xs font-mono text-amber-400 uppercase font-semibold">
                {look.season}
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                {look.title}
              </h3>
            </div>
          </div>

          {/* Right Column: Story & Hotspot Products */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6">
            <div>
              <span className="text-xs font-mono tracking-widest text-stone-400 uppercase">
                Styling Notes
              </span>
              <p className="mt-2 text-stone-300 text-sm leading-relaxed font-light">
                {look.description}
              </p>
            </div>

            {/* Tagged Items in this look */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Featured In This Ensemble
              </h4>

              <div className="space-y-3">
                {look.taggedProducts.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (p.slug) onNavigate('product', p.slug);
                      else onNavigate('shop', p.category);
                    }}
                    className="group flex items-center justify-between p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-600/50 hover:bg-stone-850 transition-all cursor-pointer"
                  >
                    <div>
                      <h5 className="text-sm font-semibold text-stone-100 group-hover:text-amber-300 transition-colors">
                        {p.name}
                      </h5>
                      <span className="text-xs text-stone-400 capitalize">
                        {p.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {p.price}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => onNavigate('shop')}
              className="w-full py-3 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Shop All Lookbook Pieces</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
