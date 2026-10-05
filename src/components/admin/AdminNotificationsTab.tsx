import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  AlertCircle,
  FileText,
  Flame,
  Tag,
  Package,
  Truck,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type {
  NotificationRecord,
  NotificationType,
  NotificationStatus,
} from '../../types.js';
import { notificationSocket, emitSyncEvent } from '../../services/notificationSocket.js';
import { NotificationFormModal } from './NotificationFormModal.js';
import { NotificationDetailModal } from '../common/NotificationDetailModal.js';

interface AdminNotificationsTabProps {
  token: string;
}

const NOTIFICATION_TYPES: (NotificationType | 'all')[] = [
  'all',
  'General',
  'New Arrival',
  'Winter Sale',
  'Summer Sale',
  'Discount',
  'Promotion',
  'Flash Sale',
  'Order Update',
  'Shipping Update',
  'Announcement',
  'Stock Alert',
  'Website Update',
];

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({ token }) => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    scheduled: 0,
    draft: 0,
    expired: 0,
    unreadActive: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<NotificationRecord | null>(null);
  const [previewNotification, setPreviewNotification] = useState<NotificationRecord | null>(null);

  // Delete confirmation
  const [deletingNotification, setDeletingNotification] = useState<NotificationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action status message
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const res = await fetch(`/api/admin/notifications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : (data?.notifications || []));
        if (data?.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token, statusFilter, typeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Real-time synchronization via WebSocket
  useEffect(() => {
    notificationSocket.connect(token);

    const unsubscribe = notificationSocket.subscribe((event) => {
      if (
        event.type === 'notification:new' ||
        event.type === 'notification:update' ||
        event.type === 'notification:delete' ||
        event.type === 'admin:stats_update'
      ) {
        // Automatically sync admin view without full reload
        fetchNotifications();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [token, statusFilter, typeFilter, searchQuery]);

  // Toggle publish / unpublish
  const handleTogglePublish = async (notif: NotificationRecord) => {
    const isCurrentlyPublished = notif.status === 'published';
    const endpoint = isCurrentlyPublished ? 'unpublish' : 'publish';

    try {
      const res = await fetch(`/api/admin/notifications/${notif.id}/${endpoint}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const updatedData = await res.json();
        emitSyncEvent({
          type: 'notification:update',
          notification: updatedData,
          notificationId: notif.id,
        });
        setActionMessage({
          type: 'success',
          text: `Notification "${notif.title}" is now ${isCurrentlyPublished ? 'saved as Draft' : 'Published live'}.`,
        });
        setTimeout(() => setActionMessage(null), 4000);
        fetchNotifications();
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to update publication status' });
    }
  };

  // Duplicate notification
  const handleDuplicate = async (notif: NotificationRecord) => {
    try {
      const res = await fetch(`/api/admin/notifications/${notif.id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const dupData = await res.json();
        emitSyncEvent({
          type: 'notification:new',
          notification: dupData,
          notificationId: dupData?.id,
        });
        setActionMessage({
          type: 'success',
          text: `Duplicated "${notif.title}" as a new draft.`,
        });
        setTimeout(() => setActionMessage(null), 4000);
        fetchNotifications();
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to duplicate notification' });
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deletingNotification) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/notifications/${deletingNotification.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        emitSyncEvent({
          type: 'notification:delete',
          notificationId: deletingNotification.id,
        });
        setActionMessage({
          type: 'success',
          text: `Notification "${deletingNotification.title}" deleted.`,
        });
        setTimeout(() => setActionMessage(null), 4000);
        setDeletingNotification(null);
        fetchNotifications();
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to delete notification' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeBadgeClass = (type: NotificationType | string) => {
    switch (type) {
      case 'Order Update':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'Shipping Update':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'Winter Sale':
      case 'Summer Sale':
      case 'Flash Sale':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
      case 'Discount':
      case 'Promotion':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'New Arrival':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/20';
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Published
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3" />
            Scheduled
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            Draft
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Expired
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-amber-700 dark:text-amber-500" />
            <span>Notification Center</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Broadcast atelier announcements, seasonal sales, discounts, and real-time order alerts to customers.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchNotifications}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingNotification(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold tracking-wider uppercase transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notification</span>
          </button>
        </div>
      </div>

      {/* Real-Time Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Total</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {stats.total}
          </div>
          <span className="text-[11px] text-stone-400">All announcements</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Published</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-emerald-700 dark:text-emerald-300">
            {stats.published}
          </div>
          <span className="text-[11px] text-stone-400">Live on website</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Scheduled</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-blue-700 dark:text-blue-300">
            {stats.scheduled}
          </div>
          <span className="text-[11px] text-stone-400">Future automated</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Drafts</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400">
              <Edit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-stone-800 dark:text-stone-200">
            {stats.draft}
          </div>
          <span className="text-[11px] text-stone-400">Unpublished drafts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Expired</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-rose-700 dark:text-rose-300">
            {stats.expired}
          </div>
          <span className="text-[11px] text-stone-400">Past validity</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications by title, message, or customer..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/40"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
          {['all', 'published', 'scheduled', 'draft', 'expired'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Type Filter Dropdown */}
        <div className="w-full md:w-48">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden cursor-pointer"
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Types' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40 text-[11px] uppercase tracking-wider font-bold text-stone-500 dark:text-stone-400">
                <th className="py-3.5 px-4">Notification</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Target Audience</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Schedule / Published</th>
                <th className="py-3.5 px-3 text-center">Reads</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/70 text-xs">
              {isLoading && notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading notifications...
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                      <Bell className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                      No notifications found
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                      Create your first notification to inform website visitors about new arrivals, sales, or order status.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotification(null);
                        setIsFormModalOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Notification</span>
                    </button>
                  </td>
                </tr>
              ) : (
                (Array.isArray(notifications) ? notifications : []).map((notif) => (
                  <tr
                    key={notif.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition group"
                  >
                    {/* Notification info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        {notif.image ? (
                          <img
                            src={notif.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-stone-200 dark:border-stone-700 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0 text-stone-500">
                            <Bell className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-semibold text-stone-900 dark:text-stone-100 line-clamp-1">
                            {notif.title}
                          </h4>
                          <p className="text-stone-500 dark:text-stone-400 line-clamp-1 text-[11px] mt-0.5">
                            {notif.message}
                          </p>
                          {notif.link && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-mono">
                              <ExternalLink className="w-2.5 h-2.5" />
                              {notif.link}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getTypeBadgeClass(
                          notif.type
                        )}`}
                      >
                        {notif.type}
                      </span>
                    </td>

                    {/* Target Audience */}
                    <td className="py-3.5 px-3">
                      {notif.audience === 'all' ? (
                        <span className="inline-flex items-center gap-1 text-stone-700 dark:text-stone-300 font-medium">
                          <Users className="w-3.5 h-3.5 text-stone-400" />
                          All Customers
                        </span>
                      ) : notif.audience === 'registered' ? (
                        <span className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-300 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                          Registered Users
                        </span>
                      ) : (
                        <div className="text-amber-800 dark:text-amber-300">
                          <span className="font-semibold block">Specific Customer</span>
                          <span className="text-[10px] text-stone-500">
                            {notif.targetUserNames?.[0] || '1 Selected'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">{getStatusBadge(notif.status)}</td>

                    {/* Schedule / Published Date */}
                    <td className="py-3.5 px-3 text-stone-500 dark:text-stone-400 text-[11px]">
                      {notif.status === 'scheduled' && notif.scheduledAt ? (
                        <div>
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {new Date(notif.scheduledAt).toLocaleDateString('en-PK', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px]">
                            {new Date(notif.scheduledAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ) : notif.publishedAt ? (
                        <div>
                          <div>
                            {new Date(notif.publishedAt).toLocaleDateString('en-PK', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {new Date(notif.publishedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    {/* Read count */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
                        {notif.readCount || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewNotification(notif)}
                          title="Preview notification"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Publish / Unpublish Toggle */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(notif)}
                          title={notif.status === 'published' ? 'Unpublish (Draft)' : 'Publish immediately'}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            notif.status === 'published'
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => handleDuplicate(notif)}
                          title="Duplicate notification"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotification(notif);
                            setIsFormModalOpen(true);
                          }}
                          title="Edit notification"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeletingNotification(notif)}
                          title="Delete notification"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <NotificationFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingNotification(null);
        }}
        onSaved={fetchNotifications}
        token={token}
        editingNotification={editingNotification}
      />

      {/* Preview Modal */}
      <NotificationDetailModal
        notification={previewNotification}
        onClose={() => setPreviewNotification(null)}
      />

      {/* Delete Confirmation Modal */}
      {deletingNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Delete Notification?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                Are you sure you want to delete &ldquo;{deletingNotification.title}&rdquo;? This will immediately remove it from all connected customer devices in real-time.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingNotification(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
