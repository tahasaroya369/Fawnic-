import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Check,
  Sparkles,
  Tag,
  Package,
  Truck,
  Flame,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { NotificationItem, NotificationType } from '../../types.js';
import { notificationSocket } from '../../services/notificationSocket.js';
import { NotificationDetailModal } from './NotificationDetailModal.js';
import { fetchWithRetry } from '../../utils/apiClient.js';

interface NotificationBellProps {
  token?: string | null;
  onNavigate?: (route: string, param?: any) => void;
  className?: string;
}

const GUEST_READS_KEY = 'fawnic_guest_reads';

// Helper to strictly ensure query replies and support tickets NEVER enter customer notifications popup
const isQueryNotification = (n: any) => {
  if (!n) return false;
  return (
    n.type === 'Customer Service' ||
    n.type === 'Query Reply' ||
    n.type === 'QUERY_REPLY' ||
    n.id?.includes('_reply') ||
    n.id?.includes('_qry') ||
    n.id?.includes('_creply') ||
    n.title?.toLowerCase().includes('query') ||
    n.link?.includes('tab=queries') ||
    n.link?.includes('/queries')
  );
};

// Formats timestamps into natural relative strings ("Just now", "2 min ago", "1 hour ago", "Yesterday", etc.)
const formatRelativeTime = (timestamp: string): string => {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Just now';

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour === 1) return '1 hour ago';
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return '';
  }
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
  token,
  onNavigate,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDetailNotification, setSelectedDetailNotification] =
    useState<NotificationItem | null>(null);
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveToken =
    token || (typeof window !== 'undefined' ? localStorage.getItem('fawnic_token') : null);

  const getGuestReadIds = (): string[] => {
    try {
      const stored = localStorage.getItem(GUEST_READS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const addGuestReadId = (id: string) => {
    try {
      const current = getGuestReadIds();
      if (!current.includes(id)) {
        localStorage.setItem(GUEST_READS_KEY, JSON.stringify([...current, id]));
      }
    } catch {}
  };

  // Close dropdown on outside click (No intrusive backdrop!)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Fetch initial notifications from API (strictly filtering out any query items)
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (effectiveToken) {
        headers['Authorization'] = `Bearer ${effectiveToken}`;
      }

      const res = await fetchWithRetry('/api/customer/notifications', { headers }, 2, 500);
      if (res.ok) {
        const data = await res.json();
        const rawList = (Array.isArray(data) ? data : (data?.notifications || [])) as NotificationItem[];

        // Strictly exclude customer query replies
        const filtered = Array.isArray(rawList) ? rawList.filter((n) => !isQueryNotification(n)) : [];

        const guestReads = getGuestReadIds();
        const processed = filtered.map((item) => ({
          ...item,
          isRead: effectiveToken ? item.isRead : guestReads.includes(item.id),
        }));

        setNotifications(processed);
        const unread = processed.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Temporary delay fetching notifications, will retry automatically:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [effectiveToken]);

  // Real-time WebSocket connection
  useEffect(() => {
    notificationSocket.connect(effectiveToken);

    const unsubscribe = notificationSocket.subscribe((event) => {
      if (event.type === 'notification:new' && event.notification) {
        const newNotif = event.notification;

        // Strictly reject if this is a query reply
        if (isQueryNotification(newNotif)) {
          return;
        }

        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((c) => c + 1);

        // Realtime floating toast alert (subtle, non-intrusive)
        setToastNotification(newNotif);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
          setToastNotification(null);
        }, 4500);
      } else if (event.type === 'notification:updated' && event.notification) {
        const updated = event.notification;
        if (isQueryNotification(updated)) return;

        setNotifications((prev) =>
          prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
        );
      } else if (event.type === 'notification:deleted' && event.notificationId) {
        const deletedId = event.notificationId;
        setNotifications((prev) => {
          const target = prev.find((n) => n.id === deletedId);
          if (target && !target.isRead) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n.id !== deletedId);
        });
      } else if (event.type === 'notification:read' && event.notificationId) {
        const readId = event.notificationId;
        setNotifications((prev) =>
          prev.map((n) => {
            if (n.id === readId && !n.isRead) {
              setUnreadCount((c) => Math.max(0, c - 1));
              return { ...n, isRead: true };
            }
            return n;
          })
        );
      } else if (event.type === 'notification:read_all') {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [effectiveToken]);

  // Mark single as read
  const markAsRead = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      addGuestReadId(notif.id);

      if (effectiveToken) {
        try {
          await fetch(`/api/customer/notifications/${notif.id}/read`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${effectiveToken}`,
            },
          });
        } catch (err) {
          console.error('Failed to mark read:', err);
        }
      }
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    notifications.forEach((n) => addGuestReadId(n.id));

    if (effectiveToken) {
      try {
        await fetch('/api/customer/notifications/read-all', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
          },
        });
      } catch (err) {
        console.error('Failed to mark all as read:', err);
      }
    }
  };

  // Click on a notification inside the dropdown (LEVEL 2 INTERACTION)
  const handleItemClick = (notif: NotificationItem) => {
    markAsRead(notif);
    setIsOpen(false);
    setSelectedDetailNotification(notif);
  };

  const getTypeFallbackIcon = (type?: NotificationType | string) => {
    switch (type) {
      case 'Order Update':
        return <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Shipping Update':
        return <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Winter Sale':
      case 'Summer Sale':
      case 'Flash Sale':
        return <Flame className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'Discount':
      case 'Promotion':
        return <Tag className="w-5 h-5 text-amber-700 dark:text-amber-400" />;
      case 'New Arrival':
        return <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Stock Alert':
        return <ShieldCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-stone-500 dark:text-stone-400" />;
    }
  };

  return (
    <>
      <div ref={containerRef} className={`relative inline-block ${className}`}>
        {/* Header Bell Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Notifications"
          aria-expanded={isOpen}
          className={`relative p-1 min-[360px]:p-1.5 sm:p-2.5 rounded-full transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
            isOpen
              ? 'text-amber-800 dark:text-amber-400 bg-stone-100 dark:bg-stone-800'
              : 'text-stone-700 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-5 sm:h-5 stroke-[1.8]" />

          {/* Unread Count Badge - Only shown when unreadCount > 0 */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] min-[360px]:min-w-[16px] min-[360px]:h-[16px] sm:min-w-[18px] sm:h-[18px] px-0.5 sm:px-1 bg-amber-600 dark:bg-amber-500 text-white text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs border border-white dark:border-stone-900 animate-in zoom-in duration-150">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* LEVEL 1: COMPACT FLOATING NOTIFICATION DROPDOWN */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="fawnic-notification-dropdown"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[70px] left-3 right-3 max-w-[400px] mx-auto sm:mx-0 sm:left-auto sm:right-0 sm:top-full sm:absolute sm:mt-2 sm:w-[385px] max-h-[70vh] sm:max-h-[480px] bg-white dark:bg-stone-900 rounded-2xl shadow-xl dark:shadow-stone-950/70 border border-stone-200/90 dark:border-stone-800 overflow-hidden flex flex-col z-50"
              role="region"
              aria-label="Notifications Dropdown"
            >
              {/* DROPDOWN HEADER */}
              <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-950/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-stone-900 dark:text-stone-100 text-[15px]">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition cursor-pointer flex items-center gap-1"
                      title="Mark all notifications as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
                    aria-label="Close notifications dropdown"
                  >
                    <X className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* SCROLLABLE NOTIFICATIONS LIST (PREVIEW ITEMS) */}
              <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/80">
                {isLoading && notifications.length === 0 ? (
                  <div className="py-10 text-center text-xs text-stone-400">
                    <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Checking for updates...
                  </div>
                ) : notifications.length === 0 ? (
                  /* COMPACT EMPTY STATE */
                  <div className="py-10 px-4 text-center">
                    <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                      <Bell className="w-5 h-5 stroke-[1.6]" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 font-serif">
                      No new notifications
                    </h4>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                      You’re all caught up.
                    </p>
                  </div>
                ) : (
                  (Array.isArray(notifications) ? notifications : []).map((notif) => {
                    const isUnread = !notif.isRead;
                    const relativeTime = formatRelativeTime(notif.createdAt);
                    const hasValidImage = Boolean(
                      notif.image && !failedImageIds.has(notif.id)
                    );

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleItemClick(notif)}
                        className={`p-3 sm:p-3.5 flex items-start gap-3 cursor-pointer transition-colors duration-150 ${
                          isUnread
                            ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.07] hover:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.12]'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                        }`}
                      >
                        {/* LEFT: Small square thumbnail (approx 52px × 52px) */}
                        <div className="w-[52px] h-[52px] rounded-lg shrink-0 overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200/70 dark:border-stone-800 flex items-center justify-center">
                          {hasValidImage ? (
                            <img
                              src={notif.image}
                              alt=""
                              className="w-full h-full object-cover object-center"
                              onError={() => {
                                setFailedImageIds(
                                  (prev) => new Set([...prev, notif.id])
                                );
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800/70">
                              {getTypeFallbackIcon(notif.type)}
                            </div>
                          )}
                        </div>

                        {/* RIGHT: Title, 1-2 lines description preview, and relative time */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <h4
                                className={`text-[13.5px] sm:text-[14px] leading-snug line-clamp-1 ${
                                  isUnread
                                    ? 'font-semibold text-stone-950 dark:text-stone-50'
                                    : 'font-medium text-stone-800 dark:text-stone-200'
                                }`}
                              >
                                {notif.title}
                              </h4>
                              {isUnread && (
                                <span
                                  className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-500 shrink-0 ml-1 shadow-2xs"
                                  title="Unread"
                                />
                              )}
                            </div>

                            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed mt-0.5">
                              {notif.message}
                            </p>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500">
                            <span className="capitalize font-medium text-stone-600 dark:text-stone-400">
                              {notif.type || 'Notice'}
                            </span>
                            <span>{relativeTime}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* DROPDOWN FOOTER: "View all notifications →" */}
              <div className="px-4 py-2.5 border-t border-stone-100 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-950/60 text-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (onNavigate) {
                      onNavigate('profile', { tab: 'notifications' });
                    }
                  }}
                  className="text-xs font-semibold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition cursor-pointer inline-flex items-center gap-1 group"
                >
                  <span>View all notifications</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LEVEL 2: COMPACT DETAIL POPOVER (Max 480px–500px, 180-200px image, comfortable luxury popup) */}
      <NotificationDetailModal
        notification={selectedDetailNotification}
        onClose={() => setSelectedDetailNotification(null)}
        onNavigate={onNavigate}
      />

      {/* Subtle Real-Time Incoming Toast Alert */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl p-3.5 flex items-start gap-3 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-600">
            {getTypeFallbackIcon(toastNotification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                New Alert
              </span>
              <button
                type="button"
                onClick={() => setToastNotification(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1 mt-0.5">
              {toastNotification.title}
            </h5>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
              {toastNotification.message}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setToastNotification(null);
                  setSelectedDetailNotification(toastNotification);
                }}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View Details</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
