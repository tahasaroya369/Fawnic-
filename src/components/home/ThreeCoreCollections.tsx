import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { IMAGE_ASSETS, getCategoryFallbackImage } from '../../utils/imageAssets.js';
import { getCachedCategories, setCachedCategories, isImageLoaded, markImageLoaded } from '../../services/productCache.js';
import { fetchWithRetry } from '../../utils/apiClient.js';
import type { Category } from '../../types.js';

interface ThreeCoreCollectionsProps {
  onNavigate: (route: string, param?: any) => void;
}

export const ThreeCoreCollections: React.FC<ThreeCoreCollectionsProps> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories() || []);
  const [loading, setLoading] = useState(() => !getCachedCategories());

  // Strictly 3 core categories with 100% matched, distinct images
  const defaultCollections = useMemo(
    () => [
      {
        id: 'wallets',
        name: "Men's Wallets",
        slug: 'wallets',
        subtitle: 'Quality leather wallets designed for easy everyday carry.',
        cta: 'Shop Wallets',
        image: IMAGE_ASSETS.collectionWallets,
        badge: 'Real Leather',
      },
      {
        id: 'belts',
        name: "Men's Belts",
        slug: 'belts',
        subtitle: 'Strong leather belts with solid hardware that lasts.',
        cta: 'Shop Belts',
        image: IMAGE_ASSETS.collectionBelts,
        badge: 'Solid Hardware',
      },
      {
        id: 'watches',
        name: 'Premium Watches',
        slug: 'watches',
        subtitle: 'Classic timepieces with leather straps and precision movements.',
        cta: 'Shop Watches',
        image: IMAGE_ASSETS.collectionWatches,
        badge: 'Precision Time',
      },
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;
    async function fetchCategories() {
      try {
        const hasCached = Boolean(getCachedCategories());
        if (!hasCached) setLoading(true);

        const res = await fetchWithRetry('/api/categories', {}, 2, 500);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
            setCachedCategories(data);
          }
        }
      } catch (err) {
        // Fall back gracefully to cache
        const cached = getCachedCategories();
        if (cached && cached.length > 0 && isMounted) {
          setCategories(cached);
        } else {
          console.warn('Temporary delay loading categories, using fallback collections:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Map collections with strict category image enforcement
  const displayCollections = useMemo(() => {
    return defaultCollections.map((col) => {
      const matchingBackendCat = categories.find(
        (c) => c.slug === col.slug || c.id === `cat_${col.id}`
      );
      return {
        ...col,
        name: matchingBackendCat?.name || col.name,
        image: col.image, // Strictly use dedicated realistic product photography
      };
    });
  }, [defaultCollections, categories]);

  return (
    <section className="py-16 sm:py-20 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Simple English */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
            Our Main Collections
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Built with Care. Made to Last.
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Explore our handcrafted leather goods and elegant timepieces.
          </p>
        </div>

        {/* 3 Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {displayCollections.map((col, idx) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              onClick={() => onNavigate('shop', col.slug)}
              className="group relative flex flex-col justify-end min-h-[420px] sm:min-h-[480px] rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-200 dark:border-stone-800 bg-stone-900"
            >
              {/* Category Image */}
              <div className="absolute inset-0 z-0 overflow-hidden bg-stone-900">
                <img
                  src={col.image}
                  alt={col.name}
                  loading={isImageLoaded(col.image) ? 'eager' : 'lazy'}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onLoad={() => markImageLoaded(col.image)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = getCategoryFallbackImage(col.slug, col.name);
                  }}
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Subtle dark overlay for text readability without obscuring the product */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950/15 opacity-85 group-hover:opacity-90 transition-opacity" />
              </div>

              {/* Top Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3.5 py-1.5 bg-stone-900/85 backdrop-blur-md border border-stone-700/70 rounded-full text-[11px] font-mono uppercase tracking-wider text-amber-300 shadow-sm">
                  {col.badge}
                </span>
              </div>

              {/* Bottom Content Area */}
              <div className="relative z-10 p-6 sm:p-7 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
                    {col.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-200 font-normal leading-relaxed line-clamp-2">
                    {col.subtitle}
                  </p>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-serif uppercase tracking-wider font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                    <span>{col.cta}</span>
                    <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
