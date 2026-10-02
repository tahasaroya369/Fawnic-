import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Award, Clock, Briefcase, Wallet, Shield, Sparkles, Layers } from 'lucide-react';
import type { Category } from '../../types.js';

interface CategorySectionProps {
  onNavigate: (route: string, param?: any) => void;
}

interface DisplayCategory {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  image: string;
  countLabel: string;
  icon: React.ReactNode;
}

const DEFAULT_DISPLAY_CATEGORIES: DisplayCategory[] = [
  {
    id: 'cat_leather',
    name: 'LEATHER ATELIER',
    slug: 'leather',
    subtitle: 'Full-grain hides, executive folios & heirloom bindings',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=85',
    countLabel: 'Flagship Atelier',
    icon: <Award className="w-5 h-5 text-amber-500" />,
  },
  {
    id: 'cat_watches',
    name: 'WATCHES & HOROLOGY',
    slug: 'watches',
    subtitle: 'Mechanical chronographs & sapphire crystal calibers',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=85',
    countLabel: 'Independent Guild',
    icon: <Clock className="w-5 h-5 text-amber-500" />,
  },
  {
    id: 'cat_bags',
    name: 'ARTISAN BAGS',
    slug: 'bags',
    subtitle: 'Pull-up leather weekender duffels & laptop satchels',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=85',
    countLabel: 'Master Bagmakers',
    icon: <Briefcase className="w-5 h-5 text-amber-500" />,
  },
  {
    id: 'cat_wallets',
    name: 'MEN’S WALLETS',
    slug: 'wallets',
    subtitle: 'Bifold, slim card cases, long continentals & RFID',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=85',
    countLabel: 'Bespoke Finishing',
    icon: <Wallet className="w-5 h-5 text-amber-500" />,
  },
  {
    id: 'cat_belts',
    name: 'LEATHER BELTS',
    slug: 'belts',
    subtitle: 'Single-slab 9oz steerhide with solid forged brass',
    image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&auto=format&fit=crop&q=85',
    countLabel: 'Lifetime Steerhide',
    icon: <Shield className="w-5 h-5 text-amber-500" />,
  },
  {
    id: 'cat_accessories',
    name: 'ACCESSORIES',
    slug: 'accessories',
    subtitle: 'Heirloom gift boxes, valet trays & EDC essentials',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=85',
    countLabel: 'Executive Curation',
    icon: <Sparkles className="w-5 h-5 text-amber-500" />,
  },
];

export const CategorySection: React.FC<CategorySectionProps> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<DisplayCategory[]>(DEFAULT_DISPLAY_CATEGORIES);

  useEffect(() => {
    fetch('/api/products/categories')
      .then((res) => (res.ok ? res.json() : []))
      .then((apiCats: Category[]) => {
        if (Array.isArray(apiCats) && apiCats.length > 0) {
          // Map API categories with fallback graphics
          const mapped = DEFAULT_DISPLAY_CATEGORIES.map((def) => {
            const match = apiCats.find(
              (c) => c.slug?.toLowerCase() === def.slug.toLowerCase() || c.name.toLowerCase().includes(def.slug)
            );
            if (match) {
              return {
                ...def,
                name: def.name,
                subtitle: match.description || def.subtitle,
                image: match.image || match.banner || def.image,
              };
            }
            return def;
          });
          setCategories(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section id="categories" className="py-20 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold tracking-wider uppercase mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Curated Departments</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-950 dark:text-stone-50">
              Explore Our Atelier Categories
            </h2>
            <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-xl text-sm sm:text-base">
              Discover masterfully crafted horology, genuine steerhide leatherwork, bespoke bags, and refined accoutrements across our artisan network.
            </p>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors group cursor-pointer self-start md:self-auto"
          >
            <span>Browse All Collections</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Categories Bento Grid with Subtle 3D Depth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              onClick={() => onNavigate('shop', cat.slug)}
              className="group relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-stone-900 shadow-md hover:shadow-2xl transition-all duration-200 cursor-pointer border border-stone-200/80 dark:border-stone-800/80"
              style={{
                perspective: 1000,
              }}
            >
              {/* Background Imagery with Layered Depth */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-250 ease-out brightness-[0.72] contrast-[1.05]"
                />
                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
                <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-transparent transition-colors duration-200" />
              </div>

              {/* Top Tag */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-950/70 border border-stone-700/60 backdrop-blur-md text-[11px] font-semibold text-amber-300">
                  {cat.icon}
                  <span>{cat.countLabel}</span>
                </span>

                <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-stone-900/60 border border-white/20 dark:border-stone-700 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-200 backdrop-blur-md">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* Bottom Card Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col justify-end">
                <span className="text-xs font-mono tracking-widest text-amber-400 font-semibold mb-1 uppercase">
                  Explore Department
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide group-hover:text-amber-200 transition-colors duration-200">
                  {cat.name}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-stone-300 line-clamp-2 font-light">
                  {cat.subtitle}
                </p>

                {/* Subtle Interactive Underline Indicator */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-0.5 w-6 bg-amber-500 group-hover:w-16 transition-all duration-200" />
                  <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    View Range
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
