import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Tag,
  Package,
  Truck,
  Sparkles,
  Flame,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';
import type { NotificationItem } from '../../types.js';
import { notificationSocket } from '../../services/notificationSocket.js';
import { NotificationDetailModal } from '../common/NotificationDetailModal.js';

interface CustomerNotificationsTabProps {
  token: string | null;
  onNavigate: (route: string, param?: any) => void;
}

// Helper to strictly ensure query replies and support tickets NEVER enter customer notifications list
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

export const CustomerNotificationsTab: React.FC<CustomerNotificationsTabProps> = ({
  token,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const fetchNotifications = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/customer/notifications', { headers });
      if (res.ok) {
        const data = await res.json();
        const raw = (Array.isArray(data) ? data : (data?.notifications || [])) as NotificationItem[];
        const filtered = Array.isArray(raw) ? raw.filter((n) => !isQueryNotification(n)) : [];
        setNotifications(filtered);
        setUnreadCount(filtered.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (token) {
      notificationSocket.connect(token);
    }

    const unsubscribe = notificationSocket.subscribe((event) => {
      if (event.type === 'notification:new' || event.type === 'notification:update') {
        fetchNotifications();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [token]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/customer/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers,
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/customer/notifications/mark-all-read', {
        method: 'PUT',
        headers,
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getTypeIcon = (type: string) => {
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
        return <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'New Arrival':
        return <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-stone-600 dark:text-stone-400" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-700" /> Notifications & Alerts
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Stay updated with atelier new releases, limited sales, order logistics, and exclusive member privileges.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-semibold text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark all as read</span>
            </button>
          )}

          {/* Filter Pills */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                filter === 'unread'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-400">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading updates...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {filter === 'unread'
                ? 'You have read all received updates.'
                : 'Atelier announcements and order progress updates will appear here.'}
            </p>
          </div>
        ) : (
          (Array.isArray(filteredNotifications) ? filteredNotifications : []).map((notif) => (
            <div
              key={notif.id}
              className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 ${
                !notif.isRead
                  ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.03] border-l-4 border-l-amber-600'
                  : ''
              }`}
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {notif.image ? (
                  <img
                    src={notif.image}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    {getTypeIcon(notif.type)}
                  </div>
                )}

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {notif.type}
                    </span>
                    {!notif.isRead && (
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-600" />
                    )}
                    <span className="text-[11px] text-zinc-400">
                      {new Date(notif.publishedAt).toLocaleDateString('en-PK', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {notif.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    handleMarkAsRead(notif.id);
                    setSelectedNotification(notif);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {notif.link && (
                  <button
                    type="button"
                    onClick={() => {
                      handleMarkAsRead(notif.id);
                      if (notif.link?.startsWith('/')) {
                        const route = notif.link.replace(/^\//, '');
                        onNavigate(route);
                      } else {
                        window.location.href = notif.link!;
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onNavigate={onNavigate}
        onActionClick={(link) => {
          if (!link) {
            onNavigate('shop');
            return;
          }
          const trimmed = link.trim();
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            window.open(trimmed, '_blank', 'noopener,noreferrer');
            return;
          }
          const clean = trimmed.replace(/^\/+/, '');
          if (clean === 'products' || clean.startsWith('products/') || clean === 'shop' || clean.startsWith('shop/')) {
            const parts = clean.split('/');
            onNavigate('shop', parts[1] || undefined);
          } else if (clean.startsWith('aliadmin') || clean.startsWith('#admin')) {
            onNavigate('aliadmin');
          } else if (clean.startsWith('track')) {
            const parts = clean.split('/');
            onNavigate('track', parts[1] || undefined);
          } else if (clean.startsWith('profile')) {
            onNavigate('profile');
          } else {
            onNavigate(clean || 'home');
          }
        }}
      />
    </div>
  );
};
