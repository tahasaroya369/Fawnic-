import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { IMAGE_ASSETS } from '../../utils/imageAssets.js';

export interface VideoClip {
  id: string;
  displayOrder: number;
  clipNumber: string;
  tag: string;
  category: string;
  title: string;
  shortTitle: string;
  description: string;
  detailBadge: string;
  videoSrc: string;
  poster: string;
  ctaText: string;
  ctaRoute: string;
  ctaParam?: string;
  durationSeconds: number;
  active: boolean;
}

export const VIDEO_CLIPS: VideoClip[] = [
  {
    id: 'clip_wallets',
    displayOrder: 1,
    clipNumber: '01',
    tag: "MEN'S LEATHER WALLETS",
    category: 'Wallets & Cardholders',
    title: 'Quality Leather & Clean Stitching',
    shortTitle: 'Wallets',
    description:
      'Genuine leather built with RFID protection and hand-finished edges for everyday carry.',
    detailBadge: 'RFID Protected',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-and-showing-a-leather-wallet-48866-large.mp4',
    poster: IMAGE_ASSETS.videoPosters.wallet,
    ctaText: 'EXPLORE WALLETS',
    ctaRoute: 'shop',
    ctaParam: 'wallets',
    durationSeconds: 6.5,
    active: true,
  },
  {
    id: 'clip_belts',
    displayOrder: 2,
    clipNumber: '02',
    tag: "MEN'S LEATHER BELTS",
    category: 'Full-Grain Belts',
    title: 'Solid Metal Buckles & Strong Leather',
    shortTitle: 'Belts',
    description:
      'Cut from thick full-grain steerhide with solid brass hardware that stays tough for years.',
    detailBadge: 'Thick Full-Grain',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-craftsman-cutting-a-piece-of-leather-41178-large.mp4',
    poster: IMAGE_ASSETS.videoPosters.belt,
    ctaText: 'EXPLORE BELTS',
    ctaRoute: 'shop',
    ctaParam: 'belts',
    durationSeconds: 6.5,
    active: true,
  },
  {
    id: 'clip_watches',
    displayOrder: 3,
    clipNumber: '03',
    tag: "PREMIUM WATCHES",
    category: 'Modern Horology',
    title: 'Precision Movements & Sapphire Glass',
    shortTitle: 'Watches',
    description:
      'Reliable automatic timepieces with scratch-resistant glass and handcrafted leather straps.',
    detailBadge: 'Automatic Movement',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-watchmaker-repairing-a-watch-41180-large.mp4',
    poster: IMAGE_ASSETS.videoPosters.watch,
    ctaText: 'EXPLORE WATCHES',
    ctaRoute: 'shop',
    ctaParam: 'watches',
    durationSeconds: 6.5,
    active: true,
  },
  {
    id: 'clip_handmade',
    displayOrder: 4,
    clipNumber: '04',
    tag: 'HANDMADE PRODUCTS',
    category: 'Artisan Workshop',
    title: 'Handmade Products',
    shortTitle: 'Handmade',
    description:
      'Handmade leather products made with care and attention to detail.',
    detailBadge: 'COMING SOON',
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-craftsman-polishing-a-leather-product-41181-large.mp4',
    poster: IMAGE_ASSETS.videoPosters.handmade,
    ctaText: 'COMING SOON',
    ctaRoute: 'shop',
    durationSeconds: 6.5,
    active: true,
  },
];

interface CinematicVideoSectionProps {
  onNavigate: (route: string, param?: any) => void;
}

export const CinematicVideoSection: React.FC<CinematicVideoSectionProps> = ({ onNavigate }) => {
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalClips = VIDEO_CLIPS.length;
  const currentClip = VIDEO_CLIPS[activeClipIndex];

  // Navigation handlers
  const goToNextClip = useCallback(() => {
    setActiveClipIndex((prev) => (prev + 1) % totalClips);
  }, [totalClips]);

  const goToPrevClip = useCallback(() => {
    setActiveClipIndex((prev) => (prev - 1 + totalClips) % totalClips);
  }, [totalClips]);

  const selectClip = useCallback((index: number) => {
    setActiveClipIndex(index);
  }, []);

  // Handle auto-slide timer with single timer instead of 50ms interval re-renders
  useEffect(() => {
    setIsPlaying(false);

    if (slideTimerRef.current) {
      clearTimeout(slideTimerRef.current);
    }

    const duration = currentClip.durationSeconds * 1000;
    slideTimerRef.current = setTimeout(() => {
      goToNextClip();
    }, duration);

    return () => {
      if (slideTimerRef.current) {
        clearTimeout(slideTimerRef.current);
      }
    };
  }, [activeClipIndex, currentClip.durationSeconds, goToNextClip]);

  // Handle video element play / events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((_err) => {
          // Autoplay was prevented or postponed: fallback to poster gracefully
          setIsPlaying(false);
        });
    }
  }, [activeClipIndex]);

  // Touch / Swipe Navigation on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartXRef.current;

    if (Math.abs(diffX) > 40) {
      if (diffX < 0) {
        goToNextClip();
      } else {
        goToPrevClip();
      }
    }
    touchStartXRef.current = null;
  };

  const hasVideoError = videoErrors[currentClip.id];

  return (
    <section
      id="cinematic-product-video"
      className="relative w-full bg-stone-950 text-white py-16 sm:py-20 lg:py-24 overflow-hidden border-y border-stone-850"
      aria-label="Crafted In Detail - Product Marketing Video"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/70 border border-amber-500/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono font-semibold tracking-widest text-amber-300 uppercase">
                CINEMATIC CAMPAIGN • THE FAWNIC EDIT
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-100 tracking-tight">
              CRAFTED IN DETAIL
            </h2>

            <p className="text-stone-400 text-sm sm:text-base max-w-2xl font-light leading-relaxed">
              Discover the details, textures and craftsmanship behind every FAWNIC piece.
            </p>
          </div>

          {/* Top Counter & Quick Arrows */}
          <div className="flex items-center gap-4 shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-1.5 font-mono text-xs tracking-wider">
              <span className="text-amber-400 font-bold">{currentClip.clipNumber}</span>
              <span className="text-stone-600">/</span>
              <span className="text-stone-400">0{totalClips}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevClip}
                aria-label="Previous product video clip"
                className="p-2.5 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNextClip}
                aria-label="Next product video clip"
                className="p-2.5 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Large Cinematic Video Container (16:9 / Wide Editorial Ratio) */}
        <div
          className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-stone-800/80 bg-stone-900 select-none group"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Animated Video Screen with 450ms Transition (Fade + Scale 1.03 -> 1) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentClip.id}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              {/* High-Resolution Poster Image (Always Present as Base Layer to Prevent Any Flickering) */}
              <img
                src={currentClip.poster}
                alt={currentClip.title}
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-cover object-center brightness-[0.88] contrast-[1.06] transition-opacity duration-300 ${
                  isPlaying && !hasVideoError ? 'opacity-0' : 'opacity-100'
                }`}
              />

              {/* Active Video Stream - Muted, Autoplay, PlaysInline, Lazy Optimized */}
              {!hasVideoError && (
                <video
                  ref={videoRef}
                  src={currentClip.videoSrc}
                  poster={currentClip.poster}
                  autoPlay
                  muted
                  playsInline
                  loop
                  preload="none"
                  onError={() =>
                    setVideoErrors((prev) => ({ ...prev, [currentClip.id]: true }))
                  }
                  className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.88] contrast-[1.06]"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Subtle Cinematic Overlay - Keeps Video Vibrant while Ensuring Razor-Sharp Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-950/40 to-transparent pointer-events-none" />

          {/* Top-Right Detail Pill */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md text-[11px] font-mono shadow-lg ${
              currentClip.detailBadge === 'COMING SOON'
                ? 'bg-amber-950/80 border border-amber-400 text-amber-300 font-bold tracking-wider'
                : 'bg-stone-950/70 border border-stone-700/60 text-stone-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                currentClip.detailBadge === 'COMING SOON' ? 'bg-amber-400 animate-ping' : 'bg-amber-400 animate-pulse'
              }`} />
              <span>{currentClip.detailBadge}</span>
            </div>
          </div>

          {/* Editorial Text Overlay Content (Bottom-Left Alignment) */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-5 sm:p-8 lg:p-12 max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentClip.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-3 sm:space-y-4"
              >
                {/* Category & Tag Eyebrow */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
                    {currentClip.clipNumber} • {currentClip.tag}
                  </span>
                  <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-stone-600" />
                  <span className="hidden sm:inline-block text-xs font-mono text-stone-300">
                    {currentClip.category}
                  </span>
                </div>

                {/* Main Product Title */}
                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-stone-50 tracking-tight leading-tight">
                  {currentClip.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm md:text-base text-stone-300 font-light leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-none">
                  {currentClip.description}
                </p>

                {/* Call To Action Buttons */}
                <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => onNavigate(currentClip.ctaRoute, currentClip.ctaParam)}
                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-lg shadow-amber-950/40 group/cta"
                  >
                    <span>{currentClip.ctaText}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-1" />
                  </button>

                  <button
                    onClick={() => onNavigate('shop')}
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700/80 text-xs sm:text-sm font-medium tracking-wide transition-colors backdrop-blur-md cursor-pointer"
                  >
                    <span>View All Collections</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Integrated Slim Timeline Progress Bar at the Base of the Video Frame */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-900/80 z-30 overflow-hidden">
            <div
              key={currentClip.id}
              className="h-full w-full bg-gradient-to-r from-amber-500 to-amber-400 origin-left"
              style={{
                animation: `clipProgress ${currentClip.durationSeconds}s linear forwards`,
              }}
            />
          </div>
        </div>

        {/* Compact Clip Navigation Strip Below Video (Thumbnails, Labels, and Progress Indicators) */}
        <div className="mt-6 sm:mt-8">
          <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
            {VIDEO_CLIPS.map((clip, idx) => {
              const isActive = idx === activeClipIndex;

              return (
                <button
                  key={clip.id}
                  onClick={() => selectClip(idx)}
                  className={`group relative flex items-center gap-3 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all duration-200 text-left shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 border-amber-500/80 shadow-lg shadow-stone-950/50 min-w-[170px] sm:min-w-[210px]'
                      : 'bg-stone-900/40 hover:bg-stone-900/80 border-stone-800 hover:border-stone-700 min-w-[150px] sm:min-w-[180px]'
                  }`}
                >
                  {/* Miniature Poster Thumbnail */}
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 bg-stone-800 border border-stone-700/50">
                    <img
                      src={clip.poster}
                      alt={clip.shortTitle}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      </div>
                    )}
                  </div>

                  {/* Clip Label and Number */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          isActive ? 'text-amber-400' : 'text-stone-500'
                        }`}
                      >
                        {clip.clipNumber}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 uppercase truncate">
                        {clip.tag.replace("MEN'S ", '')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs sm:text-sm font-medium truncate ${
                          isActive ? 'text-stone-100 font-semibold' : 'text-stone-400 group-hover:text-stone-200'
                        }`}
                      >
                        {clip.shortTitle}
                      </span>
                      {clip.detailBadge === 'COMING SOON' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                          SOON
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Individual Clip Progress Line on the Bottom of Active Pill */}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        key={currentClip.id}
                        className="h-full bg-amber-400"
                        style={{
                          animation: `clipFill ${currentClip.durationSeconds}s linear forwards`,
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
