import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  Sparkles,
  Tag,
  Package,
  Truck,
  ArrowRight,
  ExternalLink,
  Flame,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { NotificationItem, NotificationType } from '../../types.js';

interface NotificationDetailModalProps {
  notification: NotificationItem | null;
  onClose: () => void;
  onNavigate?: (route: string, param?: any) => void;
  onActionClick?: (link: string) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  onClose,
  onNavigate,
  onActionClick,
}) => {
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(notification);
  const [isClosing, setIsClosing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync active notification when prop changes
  useEffect(() => {
    if (notification) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setActiveNotification(notification);
      setIsClosing(false);
      setImageError(false);
    } else if (activeNotification && !isClosing) {
      setIsClosing(true);
      closeTimeoutRef.current = setTimeout(() => {
        setActiveNotification(null);
        setIsClosing(false);
      }, 200);
    }
  }, [notification]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard accessibility (ESC to close)
  useEffect(() => {
    if (!activeNotification || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleRequestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNotification, isClosing]);

  const handleRequestClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setActiveNotification(null);
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const current = activeNotification;
  const isVisible = Boolean(current && !isClosing);

  const formatNotificationDate = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '';
      const day = d.getDate().toString().padStart(2, '0');
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const hoursStr = hours.toString().padStart(2, '0');
      return `${day} ${month} ${year} · ${hoursStr}:${minutes} ${ampm}`;
    } catch {
      return '';
    }
  };

  const getTypeIcon = (type?: NotificationType | string) => {
    switch (type) {
      case 'Order Update':
        return <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'Shipping Update':
        return <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'Winter Sale':
      case 'Summer Sale':
      case 'Flash Sale':
        return <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'Discount':
      case 'Promotion':
        return <Tag className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />;
      case 'New Arrival':
        return <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'Stock Alert':
        return <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />;
    }
  };

  const getTypeBadgeClass = (type?: NotificationType | string) => {
    switch (type) {
      case 'Order Update':
        return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20';
      case 'Shipping Update':
        return 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20';
      case 'Winter Sale':
      case 'Summer Sale':
      case 'Flash Sale':
        return 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20';
      case 'Discount':
      case 'Promotion':
        return 'bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/20';
      case 'New Arrival':
        return 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/20';
      case 'Stock Alert':
        return 'bg-orange-500/10 text-orange-900 dark:text-orange-300 border-orange-500/20';
      default:
        return 'bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/20';
    }
  };

  const ctaLink =
    current?.link || (current as any)?.buttonLink || (current as any)?.actionUrl;
  const configuredCtaText = current?.buttonText || (current as any)?.actionText;
  const hasCta = Boolean(ctaLink || configuredCtaText);
  const ctaText =
    configuredCtaText ||
    (ctaLink?.includes('shop') || ctaLink?.includes('product')
      ? 'SHOP NOW →'
      : ctaLink?.includes('collection')
      ? 'EXPLORE COLLECTION →'
      : 'EXPLORE COLLECTION →');
  const isExternal = Boolean(
    ctaLink && (ctaLink.startsWith('http://') || ctaLink.startsWith('https://'))
  );

  const handleActionClick = () => {
    handleRequestClose();

    if (!ctaLink) {
      if (onNavigate) onNavigate('shop');
      return;
    }

    if (onActionClick) {
      onActionClick(ctaLink);
      return;
    }

    const trimmed = ctaLink.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return;
    }

    if (onNavigate) {
      const clean = trimmed.replace(/^\/+/, '');
      if (
        clean === 'products' ||
        clean.startsWith('products/') ||
        clean === 'shop' ||
        clean.startsWith('shop/')
      ) {
        const parts = clean.split('/');
        onNavigate('shop', parts[1] || undefined);
      } else if (clean.startsWith('aliadmin') || clean.startsWith('#admin')) {
        onNavigate('aliadmin');
      } else if (clean.startsWith('track')) {
        const parts = clean.split('/');
        onNavigate('track', parts[1] || undefined);
      } else if (clean.startsWith('profile')) {
        onNavigate('profile');
      } else if (clean.startsWith('cart')) {
        onNavigate('cart');
      } else if (clean.startsWith('contact')) {
        onNavigate('contact');
      } else if (clean.startsWith('about')) {
        onNavigate('about');
      } else {
        onNavigate(clean || 'home');
      }
    } else {
      window.location.href = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }
  };

  const showBannerImage = Boolean(current?.image && !imageError);
  const formattedDate = formatNotificationDate(current?.createdAt);

  return (
    <AnimatePresence>
      {isVisible && current && (
        <motion.div
          key="fawnic-notification-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-stone-950/45 backdrop-blur-[4px]"
          onClick={handleRequestClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-modal-title"
        >
          <motion.div
            key="fawnic-notification-card"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[750px] bg-white dark:bg-stone-900 rounded-[22px] sm:rounded-[24px] shadow-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden flex flex-col max-h-[85vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top-Right Circular Close Button (~42px × 42px) */}
            <button
              type="button"
              onClick={handleRequestClose}
              className={`absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-9 h-9 sm:w-[42px] sm:h-[42px] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border ${
                showBannerImage
                  ? 'bg-black/55 hover:bg-black/80 text-white border-white/20 backdrop-blur-md shadow-md'
                  : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white border-stone-200 dark:border-stone-700 shadow-xs'
              }`}
              title="Close (ESC)"
              aria-label="Close notification"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </button>

            {/* Top Image: Spans modal width, ~290–300px on desktop, ~190–220px on mobile */}
            {showBannerImage && (
              <div className="relative w-full h-[190px] sm:h-[240px] md:h-[295px] shrink-0 bg-stone-950 overflow-hidden border-b border-stone-200/80 dark:border-stone-800">
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full h-full object-cover object-center"
                  onError={() => setImageError(true)}
                />
              </div>
            )}

            {/* Content Body: Refined Spacing & Typography Matching Reference */}
            <div className="p-6 sm:p-7 md:p-8 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 flex flex-col">
              {/* Top Row: Type Badge on Left, Clock + Date on Right */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getTypeBadgeClass(
                    current.type
                  )}`}
                >
                  {getTypeIcon(current.type)}
                  <span>{current.type || 'Announcement'}</span>
                </span>

                {formattedDate && (
                  <span className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </span>
                )}
              </div>

              {/* Title: Large Elegant Serif Heading */}
              <h3
                id="notification-modal-title"
                className="text-xl sm:text-2xl md:text-[27px] font-bold font-serif text-stone-950 dark:text-stone-50 leading-snug tracking-tight"
              >
                {current.title}
              </h3>

              {/* Description: Comfortable Line Height, Full Text Content */}
              <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-[15px] leading-relaxed font-sans whitespace-pre-line break-words max-w-prose">
                {current.message}
              </p>

              {/* Order Reference (if present on the notification) */}
              {current.orderNumber && (
                <div className="p-3 rounded-xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/20 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>
                      Consignment Reference: <strong>#{current.orderNumber}</strong>
                    </span>
                  </div>
                  {current.orderStatus && (
                    <span className="capitalize font-bold px-2 py-0.5 rounded-md bg-amber-600/20 text-amber-900 dark:text-amber-200 text-[11px]">
                      {current.orderStatus.replace('_', ' ')}
                    </span>
                  )}
                </div>
              )}

              {/* Action Button: FAWNIC-style Amber/Brown CTA */}
              {hasCta && (
                <div className="pt-2 sm:pt-3 mt-auto">
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-[12px] sm:rounded-[14px] text-xs sm:text-sm font-bold tracking-wider uppercase bg-amber-800 hover:bg-amber-900 active:bg-amber-950 text-white transition-all duration-200 shadow-sm cursor-pointer font-serif group"
                  >
                    <span>{ctaText}</span>
                    {isExternal ? (
                      <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    ) : (
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
