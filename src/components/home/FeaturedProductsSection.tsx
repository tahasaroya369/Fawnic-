import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard.js';
import type { Product } from '../../types.js';

interface FeaturedProductsSectionProps {
  products: Product[];
  onNavigate: (route: string, param?: any) => void;
  onQuickView: (product: Product) => void;
}

const FeaturedProductsSectionComponent: React.FC<FeaturedProductsSectionProps> = ({
  products,
  onNavigate,
  onQuickView,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'wallets' | 'belts' | 'watches'>('all');

  // Curate products by category
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (activeTab === 'all') {
        return p.isFeatured || p.isBestSeller;
      }
      if (activeTab === 'wallets') {
        const cat = (p.categoryName || '').toLowerCase();
        return cat.includes('wallet') || p.categoryId === 'cat_wallets';
      }
      if (activeTab === 'belts') {
        const cat = (p.categoryName || '').toLowerCase();
        return cat.includes('belt') || p.categoryId === 'cat_belts';
      }
      if (activeTab === 'watches') {
        const cat = (p.categoryName || '').toLowerCase();
        return cat.includes('watch') || p.categoryId === 'cat_watches';
      }
      return true;
    });
  }, [products, activeTab]);

  // Take top 8 items
  const displayProducts = React.useMemo(() => {
    return (filteredProducts.length > 0 ? filteredProducts : products).slice(0, 8);
  }, [filteredProducts, products]);

  return (
    <section className="py-20 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Flagship Atelier Curation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Featured Essentials
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-xl">
              Handpicked heirloom leather goods and precision timepieces built from authentic materials.
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Curated' },
              { id: 'wallets', label: 'Wallets' },
              { id: 'belts', label: 'Belts' },
              { id: 'watches', label: 'Watches' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid (Mobile: strictly 2 per row) */}
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
                onQuickView={onQuickView}
                priority={idx < 4}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-stone-500 text-sm">
            Catalog is updating with fresh workshop releases...
          </div>
        )}

        {/* View All in Shop Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <span>Explore Entire Shop Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export const FeaturedProductsSection = React.memo(FeaturedProductsSectionComponent);

