import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard.js';
import type { Product } from '../../types.js';

interface TrendingSectionProps {
  products: Product[];
  onNavigate: (route: string, param?: any) => void;
  onQuickView: (product: Product) => void;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({
  products,
  onNavigate,
  onQuickView,
}) => {
  // Best sellers or highest reviewed items
  const bestSellers = products
    .filter((p) => p.isBestSeller)
    .slice(0, 4);

  const displayList = bestSellers.length >= 2 ? bestSellers : products.slice(0, 4);

  return (
    <section id="trending" className="py-20 bg-white dark:bg-stone-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold tracking-wider uppercase mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Connoisseur Favorites</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950 dark:text-stone-50 tracking-tight">
              Trending Now
            </h2>

            <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-xl text-sm sm:text-base">
              The most requested horological timepieces and heirloom leather goods commanding acclaim from customers across the country.
            </p>
          </div>

          <button
            onClick={() => onNavigate('shop', { sort: 'popular' })}
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors group cursor-pointer self-start md:self-auto"
          >
            <span>View All Bestsellers</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayList.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
            >
              <ProductCard
                product={product}
                onNavigate={onNavigate}
                onQuickView={onQuickView}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
