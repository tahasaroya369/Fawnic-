import React, { useEffect, useState } from 'react';

interface WelcomeSplashProps {
  onComplete: () => void;
  isReady: boolean;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ onComplete, isReady }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // If ready, trigger immediate smooth exit
    if (isReady && !fading) {
      setFading(true);
      const timer = setTimeout(() => {
        onComplete();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isReady, fading, onComplete]);

  // Fail-safe maximum timeout (600ms) so user is never blocked on slow network
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setFading(true);
      const exitTimer = setTimeout(onComplete, 200);
      return () => clearTimeout(exitTimer);
    }, 600);
    return () => clearTimeout(safetyTimer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-stone-950 flex flex-col items-center justify-center p-6 text-center select-none transition-opacity duration-250 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-live="polite"
      aria-label="Welcome to FAWNIC"
    >
      <div className="max-w-xs sm:max-w-sm space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Crest */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-600/30 to-amber-900/40 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-2xl font-serif font-bold shadow-xl shadow-amber-950/60">
          F
        </div>

        {/* Brand Title */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-widest uppercase text-stone-100">
            Welcome to FAWNIC
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-amber-500 font-mono">
            Bespoke Leather Atelier
          </p>
        </div>

        {/* Slim loading accent line */}
        <div className="w-24 h-0.5 bg-stone-850 mx-auto rounded-full overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-amber-600 to-amber-400 animate-pulse origin-left" />
        </div>
      </div>
    </div>
  );
};
