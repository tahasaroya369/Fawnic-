import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { ProductCard } from '../common/ProductCard.js';
import type { Product } from '../../types.js';

interface ProductCarouselSectionProps {
  id: string;
  title: string;
  eyebrow: string;
  description?: string;
  products: Product[];
  onNavigate: (route: string, param?: any) => void;
  onQuickView: (product: Product) => void;
  viewAllRoute?: string;
  viewAllParam?: any;
  bgClass?: string;
  badgeIcon?: React.ReactNode;
}

const ProductCarouselSectionComponent: React.FC<ProductCarouselSectionProps> = ({
  id,
  title,
  eyebrow,
  description,
  products,
  onNavigate,
  onQuickView,
  viewAllRoute = 'shop',
  viewAllParam,
  bgClass = 'bg-white dark:bg-stone-900',
  badgeIcon,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const nextLeft = scrollLeft > 10;
    const nextRight = scrollLeft + clientWidth < scrollWidth - 10;
    setCanScrollLeft((prev) => (prev !== nextLeft ? nextLeft : prev));
    setCanScrollRight((prev) => (prev !== nextRight ? nextRight : prev));
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      checkScrollability();
      scrollRafRef.current = null;
    });
  }, [checkScrollability]);

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability, { passive: true });
    return () => {
      window.removeEventListener('resize', checkScrollability);
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [checkScrollability, products]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = 320;
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScrollability, 300);
  };

  if (products.length === 0) return null;

  return (
    <section id={id} className={`py-16 sm:py-20 ${bgClass} transition-colors border-b border-stone-200/70 dark:border-stone-800/70`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold tracking-wider uppercase mb-3">
              {badgeIcon || <Sparkles className="w-3.5 h-3.5" />}
              <span>{eyebrow}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-950 dark:text-stone-50 tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-xl text-xs sm:text-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Right Action: View All + Carousel Controls */}
          <div className="flex items-center gap-4 self-start sm:self-auto">
            <button
              onClick={() => onNavigate(viewAllRoute, viewAllParam)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition-colors group cursor-pointer"
            >
              <span>View Department</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Previous & Next Buttons */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-300 dark:border-stone-700">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  canScrollLeft
                    ? 'border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800/50 text-stone-300 dark:text-stone-700 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  canScrollRight
                    ? 'border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800/50 text-stone-300 dark:text-stone-700 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          {products.map((product, idx) => (
            <div
              key={product.id}
              className="flex-none w-[265px] sm:w-[285px] md:w-[305px] snap-start"
            >
              <ProductCard
                product={product}
                onNavigate={onNavigate}
                onQuickView={onQuickView}
                priority={idx < 2}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const ProductCarouselSection = React.memo(ProductCarouselSectionComponent);

