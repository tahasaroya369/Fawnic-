import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Calendar,
  Sparkles,
  Tag,
  Package,
  Truck,
  Flame,
  Link as LinkIcon,
  Users,
  Eye,
  Clock,
  ArrowRight,
  AlertCircle,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import type {
  NotificationRecord,
  NotificationType,
  NotificationAudience,
  NotificationStatus,
} from '../../types.js';
import { emitSyncEvent } from '../../services/notificationSocket.js';

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface NotificationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string;
  editingNotification: NotificationRecord | null;
}

const NOTIFICATION_TYPES: NotificationType[] = [
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

export const NotificationFormModal: React.FC<NotificationFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  token,
  editingNotification,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('General');
  const [audience, setAudience] = useState<NotificationAudience>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  const [image, setImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [link, setLink] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [status, setStatus] = useState<NotificationStatus>('published');
  const [scheduledAt, setScheduledAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewTab, setPreviewTab] = useState<'card' | 'dropdown'>('card');

  // Load registered customers for "Specific Customer" audience
  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/notifications/customers', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setCustomers(data);
        })
        .catch((err) => console.error('Error loading customers:', err));
    }
  }, [isOpen, token]);

  // Populate when editing or reset when creating
  useEffect(() => {
    if (editingNotification) {
      setTitle(editingNotification.title || '');
      setMessage(editingNotification.message || '');
      setType(editingNotification.type || 'General');
      setAudience(editingNotification.audience || 'all');
      setSelectedCustomerId(
        editingNotification.targetUserIds && editingNotification.targetUserIds[0]
          ? editingNotification.targetUserIds[0]
          : ''
      );
      setSelectedCustomerName(
        editingNotification.targetUserNames && editingNotification.targetUserNames[0]
          ? editingNotification.targetUserNames[0]
          : ''
      );
      setImage(editingNotification.image || '');
      setLink(editingNotification.link || '');
      setButtonText(editingNotification.buttonText || '');
      setStatus(editingNotification.status || 'published');
      setScheduledAt(
        editingNotification.scheduledAt
          ? new Date(editingNotification.scheduledAt).toISOString().slice(0, 16)
          : ''
      );
      setExpiresAt(
        editingNotification.expiresAt
          ? new Date(editingNotification.expiresAt).toISOString().slice(0, 16)
          : ''
      );
    } else {
      setTitle('');
      setMessage('');
      setType('General');
      setAudience('all');
      setSelectedCustomerId('');
      setSelectedCustomerName('');
      setImage('');
      setLink('');
      setButtonText('');
      setStatus('published');
      setScheduledAt('');
      setExpiresAt('');
    }
    setErrorMessage('');
  }, [editingNotification, isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch('/api/admin/notifications/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: file.name,
            data: base64Data,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setImage(data.url);
        } else {
          setErrorMessage('Failed to upload image file.');
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setErrorMessage('Failed to read image file.');
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a notification title.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Please enter the notification message body.');
      return;
    }

    if (audience === 'specific' && !selectedCustomerId) {
      setErrorMessage('Please choose a specific customer for this notification.');
      return;
    }

    if (status === 'scheduled' && !scheduledAt) {
      setErrorMessage('Please pick a schedule date & time.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const targetUserIds = audience === 'specific' && selectedCustomerId ? [selectedCustomerId] : [];
      const targetUserNames =
        audience === 'specific' && selectedCustomerName ? [selectedCustomerName] : [];

      const payload = {
        title: title.trim(),
        message: message.trim(),
        type,
        audience,
        targetUserIds,
        targetUserNames,
        image: image.trim() || undefined,
        link: link.trim() || undefined,
        buttonText: buttonText.trim() || undefined,
        status,
        scheduledAt: status === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      const url = editingNotification
        ? `/api/admin/notifications/${editingNotification.id}`
        : '/api/admin/notifications';
      const method = editingNotification ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save notification');
      }

      const savedNotif = await res.json();
      emitSyncEvent({
        type: editingNotification ? 'notification:update' : 'notification:new',
        notification: savedNotif,
        notificationId: savedNotif?.id,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/30">
          <div>
            <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
              {editingNotification ? 'Edit Notification' : 'Create New Notification'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Configure announcement and target audience with live customer preview.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns: Form on Left, Live Preview on Right */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-100 dark:divide-stone-800">
          {/* Left Column: Form Controls (7 cols) */}
          <form onSubmit={handleSubmit} className="p-6 lg:col-span-7 space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Notification Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Notification Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Winter Sale: Up to 40% Off Leather Goods"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50"
              />
            </div>

            {/* Notification Message */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Notification Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement details, discount codes, or important delivery updates here..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50 resize-y"
              />
            </div>

            {/* Type & Target Audience Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Notification Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50 cursor-pointer"
                >
                  {NOTIFICATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => {
                    const aud = e.target.value as NotificationAudience;
                    setAudience(aud);
                    if (aud !== 'specific') {
                      setSelectedCustomerId('');
                      setSelectedCustomerName('');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50 cursor-pointer"
                >
                  <option value="all">All Customers (Public)</option>
                  <option value="registered">Registered Customers Only</option>
                  <option value="specific">Specific Customer</option>
                </select>
              </div>
            </div>

            {/* Specific Customer Selection if selected */}
            {audience === 'specific' && (
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Select Specific Customer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Search customer by name, email, or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100"
                />
                <div className="max-h-36 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-xs text-stone-400 text-center">No customers found.</div>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          setSelectedCustomerId(cust.id);
                          setSelectedCustomerName(cust.name);
                        }}
                        className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition ${
                          selectedCustomerId === cust.id
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-bold'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-700/50 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div>
                          <div>{cust.name}</div>
                          <div className="text-[11px] text-stone-400 font-normal">
                            {cust.email} &bull; {cust.phone}
                          </div>
                        </div>
                        {selectedCustomerId === cust.id && (
                          <CheckCircle2 className="w-4 h-4 text-amber-700" />
                        )}
                      </div>
                    ))
                  )}
                </div>
                {selectedCustomerName && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Selected: <strong>{selectedCustomerName}</strong> (Private notification)
                  </p>
                )}
              </div>
            )}

            {/* Notification Image Upload or URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Notification Banner Image (Optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://... or upload below"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50"
                />
                <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 transition cursor-pointer border border-stone-200 dark:border-stone-700">
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingImage ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Action Link & Button Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Action Link (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="e.g. /shop or /collections/wallets"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50"
                  />
                  <LinkIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Button Text (Optional)
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="e.g. SHOP WINTER SALE"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50"
                />
              </div>
            </div>

            {/* Publication Status & Scheduling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Publication Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as NotificationStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50 cursor-pointer"
                >
                  <option value="published">Publish Now (Immediate Real-Time Broadcast)</option>
                  <option value="scheduled">Schedule for Future</option>
                  <option value="draft">Save as Draft (Do Not Publish)</option>
                  <option value="expired">Mark as Expired</option>
                </select>
              </div>

              {/* Scheduled Date/Time if scheduled */}
              {status === 'scheduled' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                    Schedule Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50"
                  />
                </div>
              )}

              {/* Expiration Date/Time */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Expiration Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase bg-amber-700 hover:bg-amber-800 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingNotification ? 'Save Changes' : 'Create Notification'}
              </button>
            </div>
          </form>

          {/* Right Column: Live Customer Preview (5 cols) */}
          <div className="p-6 lg:col-span-5 bg-stone-50/60 dark:bg-stone-950/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                <Eye className="w-4 h-4 text-amber-700" />
                <span>Live Customer Preview</span>
              </div>
              <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewTab('card')}
                  className={`px-2 py-1 rounded-md transition font-medium ${
                    previewTab === 'card'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Modal View
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('dropdown')}
                  className={`px-2 py-1 rounded-md transition font-medium ${
                    previewTab === 'dropdown'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Dropdown View
                </button>
              </div>
            </div>

            {/* Render Selected Preview */}
            {previewTab === 'card' ? (
              /* Full Detail Modal Preview */
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-md border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in duration-150 flex flex-col">
                {image ? (
                  <div className="w-full h-36 bg-stone-950 overflow-hidden flex items-center justify-center border-b border-stone-200 dark:border-stone-800">
                    <img
                      src={image}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}

                <div className="p-5 space-y-3 flex-1">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                      {type}
                    </span>
                    <span className="text-[11px] text-stone-400">Just now</span>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base leading-snug">
                      {title || 'Winter Sale Is Here ❄️'}
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed whitespace-pre-wrap">
                      {message || 'Your notification body text will be formatted here.'}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40 flex items-center justify-between gap-2">
                  {(link || buttonText) ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-700 text-white shadow-xs font-serif">
                      <span>{buttonText || 'Discover Now'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  ) : <div />}
                  <span className="text-xs text-stone-400 font-medium px-2">Close</span>
                </div>
              </div>
            ) : (
              /* Bell Dropdown Item Preview */
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-md border border-stone-200 dark:border-stone-800 p-4 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover border border-stone-200 dark:border-stone-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-700">
                      <Bell className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        {type}
                      </span>
                      <span className="text-[10px] text-stone-400">Just now</span>
                    </div>
                    <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                      {title || 'Notification Title'}
                    </h5>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">
                      {message || 'Notification message description...'}
                    </p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                </div>
              </div>
            )}

            {/* Target Audience Summary Note */}
            <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 text-xs text-stone-600 dark:text-stone-400 space-y-1">
              <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span>Audience Target:</span>
                <span className="font-bold text-amber-700 capitalize">
                  {audience === 'all'
                    ? 'All Website Visitors & Customers'
                    : audience === 'registered'
                    ? 'Registered Account Holders Only'
                    : `Specific: ${selectedCustomerName || 'Select Customer'}`}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                {status === 'published'
                  ? 'Will broadcast instantly via WebSockets to connected browsers.'
                  : status === 'scheduled'
                  ? `Scheduled for delivery on ${scheduledAt || 'selected date'}.`
                  : 'Will remain private in your admin drafts.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
