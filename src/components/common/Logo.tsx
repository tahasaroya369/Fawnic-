import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const FAWNIC_LOGO_URL = 'https://i.postimg.cc/d391qxwY/Whats-App-Image-2026-09-11-at-11-39-40-AM.jpg';

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: { img: 'w-7 h-7 sm:w-8 sm:h-8', text: 'text-base sm:text-lg', sub: 'text-[8px] sm:text-[9px]' },
    md: { img: 'w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 sm:w-10 sm:h-10', text: 'text-sm min-[360px]:text-base sm:text-xl', sub: 'text-[9px] sm:text-[10px]' },
    lg: { img: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { img: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  };

  const { img, text, sub } = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 min-[360px]:gap-2 sm:gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Visual Emblem */}
      <div className={`relative ${img} shrink-0 rounded-full overflow-hidden shadow-sm border border-amber-900/20 dark:border-amber-700/30 bg-zinc-950 flex items-center justify-center ring-1 ring-amber-500/20`}>
        <img
          src={FAWNIC_LOGO_URL}
          alt="FAWNIC Luxury Leather"
          className="w-full h-full object-cover object-center transform scale-105"
          onError={(e) => {
            // Fallback to local copy if CDN has temporary connectivity issues
            (e.target as HTMLImageElement).src = '/fawnic-logo.jpg';
          }}
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-serif font-black tracking-[0.15em] sm:tracking-[0.2em] text-zinc-900 dark:text-zinc-50 ${text} uppercase`}>
            FAWNIC
          </span>
          <span className={`font-mono font-medium tracking-[0.2em] sm:tracking-[0.3em] text-amber-800 dark:text-amber-400/90 ${sub} uppercase mt-0.5 hidden min-[480px]:inline-block`}>
            LEATHER ATELIER
          </span>
        </div>
      )}
    </div>
  );
};
