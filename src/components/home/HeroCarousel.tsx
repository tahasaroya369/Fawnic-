import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck } from 'lucide-react';
import { IMAGE_ASSETS } from '../../utils/imageAssets.js';
import { isImageLoaded, markImageLoaded } from '../../services/productCache.js';

interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  primaryCtaText: string;
  primaryCtaRoute: string;
  primaryCtaParam?: any;
  secondaryCtaText: string;
  secondaryCtaRoute: string;
  secondaryCtaParam?: any;
  highlights: string[];
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide_wallets',
    badge: "MEN'S LEATHER WALLETS",
    title: 'Premium Leather, Made for Everyday',
    subtitle: 'Built with quality leather and made to last.',
    category: 'Wallets',
    image: IMAGE_ASSETS.heroWallets,
    primaryCtaText: 'Shop Wallets',
    primaryCtaRoute: 'shop',
    primaryCtaParam: 'wallets',
    secondaryCtaText: 'Explore Collection',
    secondaryCtaRoute: 'shop',
    highlights: ['Real Leather', 'RFID Protection', 'Durable Stitching'],
  },
  {
    id: 'slide_belts',
    badge: "MEN'S LEATHER BELTS",
    title: 'Classic Belts. Better Craft.',
    subtitle: 'Strong leather, clean design and solid hardware.',
    category: 'Belts',
    image: IMAGE_ASSETS.heroBelts,
    primaryCtaText: 'Shop Belts',
    primaryCtaRoute: 'shop',
    primaryCtaParam: 'belts',
    secondaryCtaText: 'Explore Collection',
    secondaryCtaRoute: 'shop',
    highlights: ['Thick Full-Grain', 'Solid Metal Buckle', 'Made to Last'],
  },
  {
    id: 'slide_watches',
    badge: 'PREMIUM WATCHES',
    title: 'Time, Made Better',
    subtitle: 'Elegant watches for everyday and special moments.',
    category: 'Watches',
    image: IMAGE_ASSETS.heroWatches,
    primaryCtaText: 'Shop Watches',
    primaryCtaRoute: 'shop',
    primaryCtaParam: 'watches',
    secondaryCtaText: 'Explore Collection',
    secondaryCtaRoute: 'shop',
    highlights: ['Precision Movement', 'Sapphire Glass', 'Leather Strap'],
  },
  {
    id: 'slide_craft',
    badge: 'LEATHER CRAFTSMANSHIP',
    title: 'The Art of Real Leather',
    subtitle: 'Every piece cut, stitched, and finished with care.',
    category: 'Craftsmanship',
    image: IMAGE_ASSETS.heroCraft,
    primaryCtaText: 'Our Craft',
    primaryCtaRoute: 'about',
    secondaryCtaText: 'Shop All',
    secondaryCtaRoute: 'shop',
    highlights: ['Handmade Detail', 'Clean Edges', 'Natural Aging'],
  },
];

interface HeroCarouselProps {
  onNavigate: (route: string, param?: any) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onNavigate }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Only auto-advance when hero is visible in the viewport to eliminate mobile background CPU usage
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const totalSlides = HERO_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Pause briefly on user interaction and resume after 3.5s
  const handleUserInteraction = useCallback(() => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3500);
  }, []);

  // Auto-play every 3.5 seconds only when active and in viewport
  useEffect(() => {
    if (isPaused || !isInViewport) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isInViewport, nextSlide]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, []);

  // Mobile swipe support without interfering with taps or clicks
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) {
      handleUserInteraction();
      if (diff > 45) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
  };

  const slide = HERO_SLIDES[currentIndex];

  const handleCtaClick = (route: string, param?: any) => {
    handleUserInteraction();
    onNavigate(route, param);
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full overflow-hidden bg-stone-950 text-white min-h-[560px] sm:min-h-[620px] md:min-h-[680px] lg:min-h-[720px] flex items-center"
      onMouseEnter={handleUserInteraction}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="FAWNIC Hero Showcase"
    >
      {/* Background Image Carousel with Smooth Crossfade */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={slide.id}
            initial={hasMounted ? { opacity: 0, scale: 1.02 } : false}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={slide.image}
              alt={slide.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center brightness-[0.7] contrast-[1.02]"
              loading={currentIndex === 0 || isImageLoaded(slide.image) ? 'eager' : 'lazy'}
              fetchPriority={currentIndex === 0 ? 'high' : 'low'}
              decoding={currentIndex === 0 ? 'sync' : 'async'}
              onLoad={() => markImageLoaded(slide.image)}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/images/hero_mens_wallet_1790447762128.jpg';
              }}
            />
            {/* Subtle dark gradient overlay for text readability without obscuring the product */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-transparent w-full md:w-3/5" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="max-w-2xl lg:max-w-3xl">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={slide.id}
              initial={hasMounted ? { opacity: 0, y: 16 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-5"
            >
              {/* Product Category Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-amber-200 uppercase font-mono">
                  {slide.badge}
                </span>
              </div>

              {/* Display Headline in Simple, Clear English */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.12]">
                {slide.title}
              </h1>

              {/* Simple, Clear Subtitle */}
              <p className="text-base sm:text-lg md:text-xl text-stone-200 leading-relaxed max-w-xl font-normal">
                {slide.subtitle}
              </p>

              {/* Key Features Pill Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {slide.highlights.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900/80 border border-stone-700/60 text-stone-200 text-xs font-medium backdrop-blur-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-3">
                <button
                  id={`hero-primary-cta-${slide.id}`}
                  onClick={() => handleCtaClick(slide.primaryCtaRoute, slide.primaryCtaParam)}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-serif font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 hover:shadow-amber-600/30 transition-all duration-200 cursor-pointer group"
                >
                  <span>{slide.primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  id={`hero-secondary-cta-${slide.id}`}
                  onClick={() => handleCtaClick(slide.secondaryCtaRoute, slide.secondaryCtaParam)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700/80 text-xs font-serif font-semibold uppercase tracking-wider transition-colors backdrop-blur-md cursor-pointer"
                >
                  <span>{slide.secondaryCtaText}</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Controls: Arrows & Slide Counter */}
      <div className="absolute bottom-6 sm:bottom-8 right-4 sm:right-8 lg:right-12 z-20 flex items-center gap-3">
        {/* Previous Button */}
        <button
          onClick={() => {
            handleUserInteraction();
            prevSlide();
          }}
          aria-label="Previous slide"
          className="p-2.5 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-200 hover:text-white transition-colors cursor-pointer backdrop-blur-md"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/80 border border-stone-700 backdrop-blur-md text-xs font-mono text-stone-300">
          <span className="font-bold text-amber-400">0{currentIndex + 1}</span>
          <span className="text-stone-500">/</span>
          <span>0{totalSlides}</span>
        </div>

        {/* Next Button */}
        <button
          onClick={() => {
            handleUserInteraction();
            nextSlide();
          }}
          aria-label="Next slide"
          className="p-2.5 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-200 hover:text-white transition-colors cursor-pointer backdrop-blur-md"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Small Pagination Indicators */}
      <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-6 lg:left-8 z-20 flex items-center gap-2">
        {HERO_SLIDES.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => {
              handleUserInteraction();
              setCurrentIndex(idx);
            }}
            aria-label={`Go to slide ${idx + 1}`}
            className="group py-2 px-1 cursor-pointer focus:outline-hidden"
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-7 bg-amber-500'
                  : 'w-2.5 bg-stone-600 group-hover:bg-stone-400'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
};
