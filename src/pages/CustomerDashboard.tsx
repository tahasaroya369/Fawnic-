import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Package,
  MapPin,
  Heart,
  Clock,
  Printer,
  XCircle,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Bell,
  MessageSquare,
  Search,
  Truck,
  ShieldCheck,
  Camera,
  Upload,
  Eye,
  EyeOff,
  ArrowRight,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { useCart } from '../context/CartContext.js';
import { InvoiceModal } from '../components/common/InvoiceModal.js';
import { OrderDetailsModal } from '../components/customer/OrderDetailsModal.js';
import { RequestReturnModal } from '../components/customer/RequestReturnModal.js';
import { CustomerNotificationsTab } from '../components/customer/CustomerNotificationsTab.js';
import { notificationSocketService } from '../services/notificationSocket.js';
import { CustomerQueriesTab } from '../components/customer/CustomerQueriesTab.js';
import type { Order, Address } from '../types.js';

interface CustomerDashboardProps {
  initialTab?: string;
  initialOrderNumber?: string;
  initialQueryId?: string;
  onNavigate: (route: string, param?: any) => void;
}

const PAKISTAN_PROVINCES = [
  'Sindh',
  'Punjab',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu & Kashmir',
  'Gilgit-Baltistan',
];

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  initialTab = 'overview',
  initialOrderNumber,
  initialQueryId,
  onNavigate,
}) => {
  const { user, token, logout, updateProfile, uploadAvatar, removeAvatar, avatarUploading } = useAuth();
  const { wishlistProducts, moveToCart, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  // Navigation tab state (10 sections)
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState<Order | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTargetOrder, setReturnTargetOrder] = useState<Order | null>(null);

  // Filter & Search states for Orders
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('+92 ');
  const [addrProvince, setAddrProvince] = useState('Sindh');
  const [addrCity, setAddrCity] = useState('Karachi');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrPostal, setAddrPostal] = useState('75500');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Profile Settings State
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState<string | null>(null);
  const [passErrorMsg, setPassErrorMsg] = useState<string | null>(null);
  const [passSaving, setPassSaving] = useState(false);

  // Load orders & addresses
  useEffect(() => {
    if (!token) return;
    async function loadData() {
      try {
        setLoading(true);
        const [ordersRes, addrRes] = await Promise.all([
          fetch('/api/customer/orders', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/customer/addresses', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (ordersRes.ok) {
          const contentType = ordersRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const ordData = await ordersRes.json();
            const list = Array.isArray(ordData) ? ordData : [];
            setOrders(list);

            // If initialOrderNumber is passed, open its modal directly
            if (initialOrderNumber) {
              const target = list.find((o: Order) => (o?.orderNumber && o.orderNumber === initialOrderNumber) || (o?.id && o.id === initialOrderNumber));
              if (target) {
                setSelectedDetailsOrder(target);
              }
            }
          }
        }
        if (addrRes.ok) {
          const contentType = addrRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const addrData = await addrRes.json();
            setAddresses(Array.isArray(addrData) ? addrData : []);
          }
        }
      } catch (err) {
        console.error('Failed to load customer profile data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token, initialOrderNumber]);

  // Real-time Order Tracking Subscription via WebSockets & Background Polling
  useEffect(() => {
    if (!token) return;
    notificationSocketService.connect(token);
    const unsubscribe = notificationSocketService.subscribe((event) => {
      if (event.type === 'order:updated' && event.order) {
        const updatedOrder = event.order as Order;
        setOrders((prev) =>
          prev.map((o) =>
            (o?.id && o.id === updatedOrder?.id) || (o?.orderNumber && o.orderNumber === updatedOrder?.orderNumber) ? updatedOrder : o
          )
        );
        setSelectedDetailsOrder((prev) => {
          if (prev && ((prev.id && prev.id === updatedOrder?.id) || (prev.orderNumber && prev.orderNumber === updatedOrder?.orderNumber))) {
            return updatedOrder;
          }
          return prev;
        });
      }
    });

    // Polling sync every 12 seconds to ensure instant status reflections across network changes
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/customer/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const list = await res.json();
            if (Array.isArray(list)) {
              setOrders(list);
              setSelectedDetailsOrder((prev) => {
                if (!prev) return null;
                const match = list.find((o: Order) => (o?.id && o.id === prev.id) || (o?.orderNumber && o.orderNumber === prev.orderNumber));
                return match || prev;
              });
            }
          }
        }
      } catch {
        // silent polling catch
      }
    }, 12000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [token]);

  // Sync profile fields with user
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  // Guest Order Tracking State
  const [guestOrderQuery, setGuestOrderQuery] = useState(initialOrderNumber || '');
  const [guestOrderResult, setGuestOrderResult] = useState<Order | null>(null);
  const [guestTrackingLoading, setGuestTrackingLoading] = useState(false);
  const [guestTrackingError, setGuestTrackingError] = useState<string | null>(null);
  const [guestActiveMode, setGuestActiveMode] = useState<'track' | 'login'>(
    initialTab === 'track' || initialOrderNumber ? 'track' : 'track'
  );

  const handleGuestLookup = async (lookupNum?: string) => {
    const target = (lookupNum || guestOrderQuery).trim();
    if (!target) return;
    setGuestTrackingLoading(true);
    setGuestTrackingError(null);
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(target)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.order) {
          setGuestOrderResult(data.order);
        } else {
          setGuestTrackingError(`Consignment "${target}" could not be located. Please verify the order number.`);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setGuestTrackingError(errData.message || `No consignment found matching "${target}". Please check your order confirmation details.`);
      }
    } catch {
      setGuestTrackingError('Network error while retrieving tracking data. Please try again.');
    } finally {
      setGuestTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (!user && initialOrderNumber) {
      handleGuestLookup(initialOrderNumber);
    }
  }, [user, initialOrderNumber]);

  // Real-time updates for guest order tracking
  useEffect(() => {
    if (!guestOrderResult) return;
    notificationSocketService.connect(null);
    const unsubscribe = notificationSocketService.subscribe((event) => {
      if (event.type === 'order:updated' && event.order) {
        const upd = event.order as Order;
        if ((upd?.id && upd.id === guestOrderResult?.id) || (upd?.orderNumber && upd.orderNumber === guestOrderResult?.orderNumber)) {
          setGuestOrderResult(upd);
        }
      }
    });
    return () => unsubscribe();
  }, [guestOrderResult?.orderNumber, guestOrderResult?.id]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Tab Mode Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-stone-100 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setGuestActiveMode('track')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                guestActiveMode === 'track'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Consignment</span>
            </button>
            <button
              onClick={() => setGuestActiveMode('login')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                guestActiveMode === 'login'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In to Account</span>
            </button>
          </div>
        </div>

        {guestActiveMode === 'track' ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center mx-auto text-amber-800 dark:text-amber-400 shadow-sm">
                <Truck className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-950 dark:text-stone-50">
                Live Consignment Tracking
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Track your handcrafted FAWNIC parcel through quality inspection and nationwide courier dispatch.
              </p>
            </div>

            {/* Tracking Search Input Card */}
            <div className="max-w-xl mx-auto bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGuestLookup();
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={guestOrderQuery}
                    onChange={(e) => setGuestOrderQuery(e.target.value)}
                    placeholder="Enter Order Number (e.g. FWN-2026-XXXX)"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-mono text-stone-900 dark:text-stone-100 uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-amber-700"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  disabled={guestTrackingLoading || !guestOrderQuery.trim()}
                  className="px-6 py-3 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  {guestTrackingLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Tracking...</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Order</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error state */}
              {guestTrackingError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{guestTrackingError}</span>
                </div>
              )}
            </div>

            {/* Tracking Result Card */}
            {guestOrderResult && (
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-serif text-stone-950 dark:text-stone-50">
                        Order #{guestOrderResult.orderNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {guestOrderResult.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Placed on {new Date(guestOrderResult.createdAt).toLocaleDateString()} • {guestOrderResult.paymentMethod.toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedInvoiceOrder(guestOrderResult)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Invoice</span>
                    </button>
                    <button
                      onClick={() => setSelectedDetailsOrder(guestOrderResult)}
                      className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      Full Details Dossier
                    </button>
                  </div>
                </div>

                {/* Dispatch & Courier Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-stone-50 dark:bg-stone-850 rounded-2xl text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">
                      Courier Partner
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100 mt-0.5 block">
                      {guestOrderResult.courier || 'TCS Express'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">
                      Consignment / Tracking #
                    </span>
                    <span className="font-mono font-bold text-amber-800 dark:text-amber-400 mt-0.5 block">
                      {guestOrderResult.trackingNumber || 'Consignment in Prep'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">
                      Estimated Delivery
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100 mt-0.5 block">
                      {guestOrderResult.estimatedDelivery
                        ? new Date(guestOrderResult.estimatedDelivery).toLocaleDateString()
                        : '3 - 5 Business Days'}
                    </span>
                  </div>
                </div>

                {/* 7-Stage Visual Timeline */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 font-mono">
                    Artisanal Journey & Courier Checkpoints
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {[
                      { key: 'pending', label: 'Order Placed', desc: 'Received at Atelier' },
                      { key: 'confirmed', label: 'Confirmed', desc: 'Order Verified' },
                      { key: 'processing', label: 'Crafted / QC', desc: 'Quality Inspected' },
                      { key: 'ready_to_dispatch', label: 'Ready Dispatch', desc: 'Packed for Transit' },
                      { key: 'shipped', label: 'With Courier', desc: 'In Courier Care' },
                      { key: 'out_for_delivery', label: 'Out Delivery', desc: 'With Courier Van' },
                      { key: 'delivered', label: 'Delivered', desc: 'Received at Address' },
                    ].map((step, idx) => {
                      const stages = ['pending', 'confirmed', 'processing', 'ready_to_dispatch', 'shipped', 'out_for_delivery', 'delivered'];
                      const currentIdx = stages.indexOf(guestOrderResult.status.toLowerCase());
                      const isComplete = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div
                          key={step.key}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isCurrent
                              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 shadow-xs ring-1 ring-amber-500/50'
                              : isComplete
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                              : 'bg-stone-50/50 dark:bg-stone-850/50 border-stone-200 dark:border-stone-800 opacity-60'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 mx-auto mb-1.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCurrent
                                ? 'bg-amber-600 text-white animate-pulse'
                                : isComplete
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                            }`}
                          >
                            {isComplete && !isCurrent ? '✓' : idx + 1}
                          </div>
                          <p className="text-[11px] font-bold text-stone-900 dark:text-stone-100 leading-tight">
                            {step.label}
                          </p>
                          <p className="text-[9px] text-stone-400 mt-0.5">{step.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items preview */}
                <div className="divide-y divide-stone-100 dark:divide-stone-800 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 font-mono pb-2">
                    Items in Consignment ({guestOrderResult.items.length})
                  </h3>
                  {guestOrderResult.items.map((item, idx) => (
                    <div key={item.id || `${item.productId || 'guest_it'}_${idx}`} className="py-2.5 flex items-center gap-3 text-xs">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-900 dark:text-stone-100 truncate">{item.name}</p>
                        {(item.selectedVariation?.name || item.variantInfo) && (
                          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400">
                            {item.selectedVariation ? `Color: ${item.selectedVariation.name}` : item.variantInfo}
                          </p>
                        )}
                        {item.sku && (
                          <p className="text-[10px] text-stone-400 font-mono">
                            SKU: {item.selectedVariation?.sku || item.sku}
                          </p>
                        )}
                        <p className="text-[11px] text-stone-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                        Rs. {item.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom summary */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                  <span className="text-stone-500">
                    Consignment Total: <strong className="text-stone-950 dark:text-stone-50 font-serif">Rs. {guestOrderResult.total.toLocaleString()}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedDetailsOrder(guestOrderResult)}
                    className="text-amber-800 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View Checkpoint History & Full Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Helper / Sign in Banner */}
            <div className="p-4 bg-stone-100 dark:bg-stone-850 rounded-2xl border border-stone-200/80 dark:border-stone-800 text-center space-y-1 text-xs text-stone-500">
              <p className="font-medium text-stone-700 dark:text-stone-300">
                Have a registered account with FAWNIC?
              </p>
              <p>
                Sign in to manage addresses, download invoices, request returns, and view your complete acquisition ledger.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setGuestActiveMode('login')}
                  className="text-stone-900 dark:text-white font-bold hover:underline cursor-pointer"
                >
                  Sign In to Account Portal →
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Sign In Card */
          <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4 bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-600 dark:text-stone-300 shadow-inner">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
              Access your orders, saved addresses, returns, and customer portal.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => setGuestActiveMode('track')}
              className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 font-semibold cursor-pointer underline block pt-2"
            >
              ← Back to Consignment Tracking
            </button>
          </div>
        )}

        {/* Render OrderDetailsModal & InvoiceModal for Guest Lookups */}
        {selectedDetailsOrder && (
          <OrderDetailsModal
            order={selectedDetailsOrder}
            onClose={() => setSelectedDetailsOrder(null)}
            onPrintInvoice={(ord) => setSelectedInvoiceOrder(ord)}
            onRequestReturn={(ord) => {
              setReturnTargetOrder(ord);
              setReturnModalOpen(true);
            }}
          />
        )}

        {selectedInvoiceOrder && (
          <InvoiceModal
            order={selectedInvoiceOrder}
            onClose={() => setSelectedInvoiceOrder(null)}
          />
        )}
      </div>
    );
  }

  // Cancel order handler
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Customer requested cancellation from dashboard' }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
        if (selectedDetailsOrder?.id === orderId) {
          setSelectedDetailsOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to cancel order.');
      }
    } catch (e) {
      alert('Error cancelling order. Please check network.');
    }
  };

  // Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddrFullName(user.name || '');
    setAddrPhone(user.phone || '+92 ');
    setAddrProvince('Sindh');
    setAddrCity('Karachi');
    setAddrLine1('');
    setAddrLine2('');
    setAddrLandmark('');
    setAddrPostal('75500');
    setAddrIsDefault(addresses.length === 0);
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrFullName(addr.fullName || addr.recipientName || '');
    setAddrPhone(addr.phone || '+92 ');
    setAddrProvince(addr.province || 'Sindh');
    setAddrCity(addr.city || 'Karachi');
    setAddrLine1(addr.addressLine1 || addr.streetAddress || '');
    setAddrLine2(addr.addressLine2 || addr.houseNumber || '');
    setAddrLandmark(addr.landmark || '');
    setAddrPostal(addr.postalCode || '75500');
    setAddrIsDefault(Boolean(addr.isDefault));
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: addrFullName.trim(),
        recipientName: addrFullName.trim(),
        phone: addrPhone.trim(),
        province: addrProvince,
        city: addrCity.trim(),
        addressLine1: addrLine1.trim(),
        streetAddress: addrLine1.trim(),
        addressLine2: addrLine2.trim() || undefined,
        houseNumber: addrLine2.trim() || undefined,
        landmark: addrLandmark.trim() || undefined,
        postalCode: addrPostal.trim(),
        isDefault: addrIsDefault,
      };

      const url = editingAddressId
        ? `/api/customer/addresses/${editingAddressId}`
        : '/api/customer/addresses';
      const method = editingAddressId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedList = await res.json();
        setAddresses(Array.isArray(updatedList) ? updatedList : []);
        setShowAddressModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save address.');
      }
    } catch (err) {
      alert('Network error saving address.');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to remove this saved address?')) return;
    try {
      const res = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updatedList = await res.json();
        setAddresses(Array.isArray(updatedList) ? updatedList : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefaultAddress = async (addr: Address) => {
    try {
      const res = await fetch(`/api/customer/addresses/${addr.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...addr, isDefault: true }),
      });
      if (res.ok) {
        const updatedList = await res.json();
        setAddresses(Array.isArray(updatedList) ? updatedList : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Profile Picture Upload Handler (Shared by Top Camera icon AND "Change Photo" button)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    const res = await uploadAvatar(file);
    if (res.success) {
      setProfileSuccessMsg('Profile photo updated successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } else {
      setProfileErrorMsg(res.error || 'Failed to upload image.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = async () => {
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);
    const res = await removeAvatar();
    if (res.success) {
      setProfileSuccessMsg('Profile photo removed.');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } else {
      setProfileErrorMsg(res.error || 'Failed to remove photo.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Update Profile Submit (Full name & Mobile number)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const res = await updateProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
    });

    setProfileSaving(false);
    if (res.success) {
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } else {
      setProfileErrorMsg(res.error || 'Failed to update profile.');
    }
  };

  // Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccessMsg(null);
    setPassErrorMsg(null);

    if (newPassword.length < 6) {
      setPassErrorMsg('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('New passwords do not match.');
      return;
    }

    setPassSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      setPassSaving(false);

      if (res.ok && data.success) {
        setPassSuccessMsg('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassSuccessMsg(null), 4000);
      } else {
        setPassErrorMsg(data.error || 'Failed to change password.');
      }
    } catch (err: any) {
      setPassSaving(false);
      setPassErrorMsg('Network error changing password.');
    }
  };

  // Order summary metrics
  const totalOrdersCount = orders.length;
  const activeOrders = orders.filter((o) =>
    ['pending', 'processing', 'ready_to_dispatch', 'shipped', 'out_for_delivery'].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
  const returnOrders = orders.filter(
    (o) =>
      o.returnRequested === true ||
      ['return_requested', 'returned', 'refunded'].includes(o.status) ||
      (o.returnStatus && o.returnStatus !== 'none')
  );

  // Filtered orders for "My Orders" tab
  const filteredOrders = orders.filter((ord) => {
    // Filter tab
    if (orderFilter === 'processing' && !['pending', 'processing'].includes(ord.status)) return false;
    if (orderFilter === 'dispatched' && !['ready_to_dispatch', 'shipped', 'out_for_delivery'].includes(ord.status))
      return false;
    if (orderFilter === 'delivered' && ord.status !== 'delivered') return false;
    if (orderFilter === 'cancelled' && ord.status !== 'cancelled') return false;
    if (orderFilter === 'returned' && !ord.returnRequested && ord.status !== 'returned' && ord.status !== 'refunded')
      return false;

    // Search query
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchNumber = ord?.orderNumber ? ord.orderNumber.toLowerCase().includes(q) : false;
      const matchProduct = ord?.items ? ord.items.some((i: any) => ((i?.productName || i?.name || '') as string).toLowerCase().includes(q)) : false;
      if (!matchNumber && !matchProduct) return false;
    }

    return true;
  });

  // Navigation tabs configuration
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Layers, badge: null },
    { id: 'status', label: 'Order Status', icon: Truck, badge: activeOrders.length || null },
    { id: 'orders', label: 'My Orders', icon: Package, badge: totalOrdersCount || null },
    { id: 'cancelled', label: 'Cancelled Orders', icon: XCircle, badge: cancelledOrders.length || null },
    { id: 'returns', label: 'Returns', icon: RotateCcw, badge: returnOrders.length || null },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin, badge: addresses.length || null },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlistProducts.length || null },
    { id: 'settings', label: 'Account Settings', icon: User, badge: null },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: null },
    { id: 'queries', label: 'Support & Queries', icon: MessageSquare, badge: null },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Central File Input for Avatar Upload (available across all tabs) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/png, image/jpeg, image/webp, image/jpg"
        className="hidden"
      />
      
      {/* =================================================== */}
      {/* 1. TOP PROFILE CARD — 3D LUXURY ELEVATION */}
      {/* =================================================== */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
        {/* Subtle radial depth lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-stone-700/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
            {/* 3D-Rimmed Circular Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-amber-500/60 via-stone-700 to-stone-500 shadow-[0_10px_25px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'Member')}&backgroundColor=292524&textColor=fafaf9`}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover bg-stone-800 border-2 border-stone-900"
                />
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-white text-stone-900 hover:bg-stone-200 transition-transform transform hover:scale-110 shadow-md cursor-pointer disabled:opacity-50"
                title="Change Photo"
              >
                {avatarUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* User Meta */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                  {user.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Verified Member
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">{user.email}</p>
              {user.phone && <p className="text-xs text-stone-400 font-mono">{user.phone}</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-stone-200 hover:text-white transition-all cursor-pointer backdrop-blur-xs flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* =================================================== */}
        {/* SUMMARY CARDS — REAL TIME USER METRICS */}
        {/* =================================================== */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8 pt-6 border-t border-white/10">
          
          {/* TOTAL ORDERS */}
          <div
            onClick={() => {
              setActiveTab('orders');
              setOrderFilter('all');
            }}
            className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer space-y-1 group"
          >
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Total Orders
            </span>
            <div className="text-2xl font-serif font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
              {totalOrdersCount}
            </div>
            <span className="text-[10px] text-stone-400">All consignments</span>
          </div>

          {/* ACTIVE ORDERS */}
          <div
            onClick={() => setActiveTab('status')}
            className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer space-y-1 group"
          >
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Active Orders
            </span>
            <div className="text-2xl font-serif font-bold text-amber-400">
              {activeOrders.length}
            </div>
            <span className="text-[10px] text-stone-400">In transit / processing</span>
          </div>

          {/* DELIVERED */}
          <div
            onClick={() => {
              setActiveTab('orders');
              setOrderFilter('delivered');
            }}
            className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer space-y-1 group"
          >
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Delivered
            </span>
            <div className="text-2xl font-serif font-bold text-emerald-400">
              {deliveredOrders.length}
            </div>
            <span className="text-[10px] text-stone-400">Received successfully</span>
          </div>

          {/* CANCELLED */}
          <div
            onClick={() => setActiveTab('cancelled')}
            className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer space-y-1 group"
          >
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Cancelled
            </span>
            <div className="text-2xl font-serif font-bold text-rose-400">
              {cancelledOrders.length}
            </div>
            <span className="text-[10px] text-stone-400">Discontinued</span>
          </div>

          {/* RETURNS */}
          <div
            onClick={() => setActiveTab('returns')}
            className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer space-y-1 group"
          >
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Returns
            </span>
            <div className="text-2xl font-serif font-bold text-indigo-400">
              {returnOrders.length}
            </div>
            <span className="text-[10px] text-stone-400">7-Day claims</span>
          </div>
        </div>
      </div>

      {/* =================================================== */}
      {/* 2. MAIN DASHBOARD CONTENT AREA & 10-SECTION TABS */}
      {/* =================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION (Desktop & Mobile Scroll) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="p-3 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-3 py-2 block">
              Account Portal
            </span>
            
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-md font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-stone-950' : 'text-stone-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-white/20 text-white dark:bg-stone-950/20 dark:text-stone-950'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Atelier Assistance Card */}
          <div className="p-4 rounded-3xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 text-xs space-y-2 text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Atelier Concierge</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Need personalized bespoke monogramming or courier status assistance? We're active daily 9am - 9pm PKT.
            </p>
            <button
              onClick={() => setActiveTab('queries')}
              className="text-[11px] font-bold text-stone-900 dark:text-stone-100 underline hover:text-amber-700 cursor-pointer"
            >
              Open Direct Query →
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT PANEL */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* ========================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Active Orders Highlight banner */}
              {activeOrders.length > 0 ? (
                <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                      <Truck className="w-4 h-4" />
                      <span>{activeOrders.length} Order(s) Currently In Progress</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('status')}
                      className="text-xs font-bold text-amber-900 dark:text-amber-200 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Track In Real-Time</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeOrders.slice(0, 2).map((ord, oIdx) => (
                      <div
                        key={ord.id || ord.orderNumber || `active_top_${oIdx}`}
                        onClick={() => setSelectedDetailsOrder(ord)}
                        className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                      >
                        {ord.items[0] && (
                          <img
                            src={ord.items[0].image}
                            alt={ord.items[0].name}
                            className="w-12 h-12 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                            {ord.items.map((i) => i.name).join(', ')}
                          </p>
                          <p className="text-[11px] text-stone-400 font-mono">
                            Order #{ord.orderNumber} • Rs. {ord.total.toLocaleString()}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                          {ord.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Recent Orders Section */}
              <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold font-serif text-stone-950 dark:text-stone-50">
                      Recent Orders
                    </h2>
                    <p className="text-xs text-stone-400">Your latest handcrafted acquisitions</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-stone-900 dark:text-stone-100 hover:underline cursor-pointer"
                  >
                    View All ({orders.length}) →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <Package className="w-10 h-10 text-stone-400 mx-auto" />
                    <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">
                      No orders placed yet
                    </h4>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">
                      Explore our handcrafted genuine leather wallets, belts, and accessories.
                    </p>
                    <button
                      onClick={() => onNavigate('shop')}
                      className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Browse Atelier
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((ord, oIdx) => (
                      <div
                        key={ord.id || ord.orderNumber || `recent_${oIdx}`}
                        className="p-4 rounded-2xl border border-stone-100 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {ord.items[0] && (
                            <img
                              src={ord.items[0].image}
                              alt={ord.items[0].name}
                              className="w-12 h-12 rounded-xl object-cover bg-stone-200 dark:bg-stone-800 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate block">
                              {ord.items.map((i) => i.name).join(', ')}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              Order #{ord.orderNumber} • {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
                          <span className="font-serif font-bold text-xs text-stone-950 dark:text-stone-50">
                            Rs. {ord.total.toLocaleString()}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : ord.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {ord.status}
                          </span>

                          <button
                            onClick={() => setSelectedDetailsOrder(ord)}
                            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Address & Wishlist Preview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Default Address Preview */}
                <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Default Shipping Address
                    </h3>
                    <button
                      onClick={() => setActiveTab('addresses')}
                      className="text-xs font-bold text-stone-900 dark:text-stone-100 hover:underline cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                  {addresses.length === 0 ? (
                    <p className="text-xs text-stone-400">No address saved. Add your Pakistani shipping address.</p>
                  ) : (
                    <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
                      <p className="font-bold text-stone-900 dark:text-stone-100">
                        {addresses[0].fullName || addresses[0].recipientName}
                      </p>
                      <p>{addresses[0].addressLine1 || addresses[0].streetAddress}</p>
                      <p>
                        {addresses[0].city}, {addresses[0].province} - {addresses[0].postalCode}
                      </p>
                      <p className="font-mono text-[11px]">{addresses[0].phone}</p>
                    </div>
                  )}
                </div>

                {/* Wishlist Preview */}
                <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Saved Wishlist ({wishlistProducts.length})
                    </h3>
                    <button
                      onClick={() => setActiveTab('wishlist')}
                      className="text-xs font-bold text-stone-900 dark:text-stone-100 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  {wishlistProducts.length === 0 ? (
                    <p className="text-xs text-stone-400">No items saved in wishlist yet.</p>
                  ) : (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {wishlistProducts.slice(0, 4).map((p, pIdx) => (
                        <img
                          key={p.id || p.slug || `wish_preview_${pIdx}`}
                          src={p.mainImage}
                          alt={p.name}
                          className="w-14 h-14 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200 dark:border-stone-800"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: ORDER STATUS & TIMELINE */}
          {/* ========================================== */}
          {(activeTab === 'status' || activeTab === 'track') && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold font-serif text-stone-950 dark:text-stone-50">
                    Live Order Status & Timeline
                  </h2>
                  <p className="text-xs text-stone-400">
                    Track your consignments as they move through FAWNIC Atelier quality control and TCS/Leopards courier delivery.
                  </p>
                </div>
              </div>

              {/* Direct Consignment Quick Search */}
              <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">Direct Consignment Search</h3>
                    <p className="text-[11px] text-stone-400">Track any order by entering its Order # or Consignment Number</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="e.g. FWN-2026-..."
                    className="flex-1 sm:w-56 px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                  {orderSearch && (
                    <button
                      onClick={() => setOrderSearch('')}
                      className="text-xs text-stone-400 hover:text-stone-600 px-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {activeOrders.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <Truck className="w-10 h-10 text-stone-400 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    No active consignments in transit
                  </h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    All your orders have been fulfilled or you have not placed an active order recently.
                  </p>
                  <button
                    onClick={() => onNavigate('shop')}
                    className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Explore Shop
                  </button>
                </div>
              ) : (
                activeOrders.map((ord, oIdx) => {
                  const getProgressPercent = (status: string) => {
                    switch (status.toLowerCase()) {
                      case 'pending':
                        return 15;
                      case 'processing':
                        return 40;
                      case 'ready_to_dispatch':
                      case 'ready':
                        return 65;
                      case 'shipped':
                      case 'out_for_delivery':
                      case 'dispatched':
                        return 85;
                      case 'delivered':
                        return 100;
                      default:
                        return 20;
                    }
                  };

                  return (
                    <div
                      key={ord.id || ord.orderNumber || `active_timeline_${oIdx}`}
                      className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                        <div>
                          <span className="text-sm font-bold font-serif text-stone-950 dark:text-stone-50">
                            Order #{ord.orderNumber}
                          </span>
                          <span className="text-xs text-stone-400 ml-2">
                            Placed {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            Status: {ord.status.replace(/_/g, ' ')}
                          </span>
                          <button
                            onClick={() => setSelectedDetailsOrder(ord)}
                            className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Track Live Order</span>
                          </button>
                        </div>
                      </div>

                      {/* Courier & Dispatch Highlights */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-stone-50 dark:bg-stone-850 rounded-2xl text-xs">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                            Courier Service
                          </span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {ord.courier || 'TCS Express'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                            Consignment / CN #
                          </span>
                          <span className="font-mono font-semibold text-amber-800 dark:text-amber-400">
                            {ord.trackingNumber || 'Tracking in prep'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                            Est. Delivery
                          </span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {ord.estimatedDelivery ? new Date(ord.estimatedDelivery).toLocaleDateString() : '3-5 Business Days'}
                          </span>
                        </div>
                      </div>

                      {/* 5-Stage Visual Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold text-stone-500">
                          <span>Progress</span>
                          <span>{getProgressPercent(ord.status)}%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 rounded-full transition-all duration-700"
                            style={{ width: `${getProgressPercent(ord.status)}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-5 text-center text-[10px] sm:text-[11px] font-semibold text-stone-500 pt-2 gap-1">
                          <span className={getProgressPercent(ord.status) >= 15 ? 'text-stone-900 dark:text-stone-100 font-bold' : ''}>
                            Placed
                          </span>
                          <span className={getProgressPercent(ord.status) >= 40 ? 'text-stone-900 dark:text-stone-100 font-bold' : ''}>
                            Processing
                          </span>
                          <span className={getProgressPercent(ord.status) >= 65 ? 'text-stone-900 dark:text-stone-100 font-bold' : ''}>
                            Ready to Dispatch
                          </span>
                          <span className={getProgressPercent(ord.status) >= 85 ? 'text-stone-900 dark:text-stone-100 font-bold' : ''}>
                            Dispatched
                          </span>
                          <span className={getProgressPercent(ord.status) >= 100 ? 'text-stone-900 dark:text-stone-100 font-bold' : ''}>
                            Delivered
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-stone-100 dark:divide-stone-800">
                        {ord.items.map((it, itIdx) => (
                          <div key={it.id || `${it.productId || 'active_it'}_${itIdx}`} className="py-2.5 flex items-center gap-3 text-xs">
                            <img
                              src={it.image}
                              alt={it.name}
                              className="w-12 h-12 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                                {it.name}
                              </p>
                              <p className="text-[11px] text-stone-400">Qty: {it.quantity}</p>
                            </div>
                            <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                              Rs. {it.total.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                        <span className="text-stone-500">
                          Total Amount: <strong className="text-stone-900 dark:text-stone-100 font-serif">Rs. {ord.total.toLocaleString()}</strong> ({ord.paymentMethod.toUpperCase()})
                        </span>
                        {ord.status === 'pending' && (
                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            className="text-rose-600 hover:underline font-semibold cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: MY ORDERS (WITH FILTER TABS & SEARCH) */}
          {/* ========================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold font-serif text-stone-950 dark:text-stone-50">
                    My Orders
                  </h2>
                  <p className="text-xs text-stone-400">
                    Comprehensive ledger of your orders, invoices, and consignment histories.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by Order # or item..."
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-200 dark:border-stone-800 text-xs">
                {[
                  { key: 'all', label: 'All Orders' },
                  { key: 'processing', label: 'Processing' },
                  { key: 'dispatched', label: 'Dispatched' },
                  { key: 'delivered', label: 'Delivered' },
                  { key: 'cancelled', label: 'Cancelled' },
                  { key: 'returned', label: 'Returned' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setOrderFilter(tab.key)}
                    className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      orderFilter === tab.key
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 font-bold'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Order Cards */}
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <Package className="w-10 h-10 text-stone-400 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">
                    No matching orders found
                  </h4>
                  <p className="text-xs text-stone-400">
                    Try adjusting your search query or switching to another filter.
                  </p>
                </div>
              ) : (
                filteredOrders.map((ord, oIdx) => (
                  <div
                    key={ord.id || ord.orderNumber || `filt_ord_${oIdx}`}
                    className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                      <div>
                        <span className="text-xs font-bold text-stone-950 dark:text-stone-50">
                          Order #{ord.orderNumber}
                        </span>
                        <span className="text-xs text-stone-400 ml-2">
                          Placed on {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : ord.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {ord.status}
                        </span>

                        <button
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="px-2.5 sm:px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>

                        <button
                          onClick={() => setSelectedDetailsOrder(ord)}
                          className="px-2.5 sm:px-3 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-amber-800/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Truck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Track Order</span>
                        </button>

                        <button
                          onClick={() => setSelectedDetailsOrder(ord)}
                          className="px-2.5 sm:px-3 py-1 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-lg text-xs font-bold cursor-pointer transition"
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="space-y-3">
                      {ord.items.map((item, itIdx) => (
                        <div key={item.id || `${item.productId || 'ord_it'}_${itIdx}`} className="flex gap-4 items-center text-xs">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                              {item.name}
                            </p>
                            {(item.selectedVariation?.name || item.variantInfo) && (
                              <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400">
                                {item.selectedVariation ? `Color: ${item.selectedVariation.name}` : item.variantInfo}
                              </p>
                            )}
                            {item.sku && (
                              <p className="text-[10px] text-stone-400 font-mono">
                                SKU: {item.selectedVariation?.sku || item.sku}
                              </p>
                            )}
                            <p className="text-[11px] text-stone-400">
                              FAWNIC Atelier • Qty: {item.quantity}
                            </p>
                          </div>
                          <span className="font-serif font-bold text-stone-950 dark:text-stone-50">
                            Rs. {item.total.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                      <span className="text-stone-500">
                        Total: <strong className="text-stone-900 dark:text-stone-100 font-serif">Rs. {ord.total.toLocaleString()}</strong> ({ord.paymentMethod.toUpperCase()})
                      </span>

                      <div className="flex items-center gap-3">
                        {ord.status === 'pending' && (
                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            className="text-rose-600 hover:underline font-semibold cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}

                        {ord.status === 'delivered' && !ord.returnRequested && (
                          <button
                            onClick={() => {
                              setReturnTargetOrder(ord);
                              setReturnModalOpen(true);
                            }}
                            className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Request 7-Day Return</span>
                          </button>
                        )}

                        {ord.returnRequested && (
                          <span className="text-amber-600 font-semibold text-[11px] flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return Status: {ord.returnStatus}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 4: CANCELLED ORDERS */}
          {/* ========================================== */}
          {activeTab === 'cancelled' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold font-serif text-stone-950 dark:text-stone-50">
                  Cancelled Orders
                </h2>
                <p className="text-xs text-stone-400">
                  Record of orders that were cancelled prior to dispatch.
                </p>
              </div>

              {cancelledOrders.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    No cancelled orders
                  </h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    You have no cancelled orders in your FAWNIC account ledger.
                  </p>
                  <button
                    onClick={() => onNavigate('shop')}
                    className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cancelledOrders.map((ord, oIdx) => (
                  <div
                    key={ord.id || ord.orderNumber || `canc_ord_${oIdx}`}
                    className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                      <div>
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          Order #{ord.orderNumber}
                        </span>
                        <span className="text-xs text-stone-400 ml-2">
                          Cancelled on {new Date(ord.updatedAt || ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        Cancelled
                      </span>
                    </div>

                    <div className="space-y-3">
                      {ord.items.map((item, itIdx) => (
                        <div key={item.id || `${item.productId || 'canc_it'}_${itIdx}`} className="flex gap-4 items-center text-xs">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0 opacity-70"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-stone-400">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-serif font-bold text-stone-500">
                            Rs. {item.total.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                      <span className="text-stone-500">
                        Total: <strong className="text-stone-900 dark:text-stone-100 font-serif">Rs. {ord.total.toLocaleString()}</strong>
                      </span>
                      <button
                        onClick={() => setSelectedDetailsOrder(ord)}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        View Order
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 5: RETURNS & REFUNDS */}
          {/* ========================================== */}
          {activeTab === 'returns' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold font-serif text-stone-950 dark:text-stone-50">
                    Returns & Guarantee Claims
                  </h2>
                  <p className="text-xs text-stone-400">
                    FAWNIC 7-day hassle-free return and exchange management portal.
                  </p>
                </div>

                {deliveredOrders.length > 0 && (
                  <button
                    onClick={() => {
                      setReturnTargetOrder(deliveredOrders[0]);
                      setReturnModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Return</span>
                  </button>
                )}
              </div>

              {returnOrders.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <RotateCcw className="w-10 h-10 text-stone-400 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    No active returns
                  </h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    All delivered items are in good order. You can request a 7-day return on any delivered item whenever needed.
                  </p>
                  {deliveredOrders.length > 0 ? (
                    <button
                      onClick={() => {
                        setReturnTargetOrder(deliveredOrders[0]);
                        setReturnModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Request Return for Delivered Order
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate('shop')}
                      className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Explore Products
                    </button>
                  )}
                </div>
              ) : (
                returnOrders.map((ord, oIdx) => {
                  const statusBadgeColor = (status: string) => {
                    switch (status?.toLowerCase()) {
                      case 'approved':
                      case 'refunded':
                        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                      case 'rejected':
                        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
                      default:
                        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                    }
                  };

                  return (
                    <div
                      key={ord.id || ord.orderNumber || `ret_ord_${oIdx}`}
                      className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                        <div>
                          <span className="text-xs font-bold text-stone-950 dark:text-stone-50">
                            Return Claim • Order #{ord.orderNumber}
                          </span>
                          <span className="text-xs text-stone-400 ml-2">
                            Requested {new Date(ord.updatedAt || ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadgeColor(
                            ord.returnStatus || 'pending'
                          )}`}
                        >
                          {ord.returnStatus || 'Return Requested'}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {ord.items.map((item, itIdx) => (
                          <div key={item.id || `${item.productId || 'ret_it'}_${itIdx}`} className="flex gap-4 items-center text-xs">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-stone-400">FAWNIC Atelier</p>
                            </div>
                            <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                              Rs. {item.total.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Return Reason Box */}
                      {ord.returnReason && (
                        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl text-xs space-y-1">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                            Claim Reason & Notes
                          </span>
                          <p className="text-stone-700 dark:text-stone-300 italic">{ord.returnReason}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                        <span className="text-stone-500">
                          Refund Amount: <strong className="text-stone-900 dark:text-stone-100 font-serif">Rs. {ord.total.toLocaleString()}</strong>
                        </span>
                        <button
                          onClick={() => setSelectedDetailsOrder(ord)}
                          className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          View Order Details
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 6: SAVED ADDRESSES */}
          {/* ========================================== */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-serif text-stone-950 dark:text-stone-50">
                    Saved Addresses in Pakistan
                  </h2>
                  <p className="text-xs text-stone-400">
                    Manage delivery destinations for fast courier checkout across all provinces.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddAddress}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Address</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <MapPin className="w-10 h-10 text-stone-400 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    No shipping addresses saved
                  </h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Save your residence or office address to enable one-click courier checkout.
                  </p>
                  <button
                    onClick={handleOpenAddAddress}
                    className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add Address Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr, aIdx) => (
                    <div
                      key={addr.id || `addr_${aIdx}`}
                      className={`p-5 bg-white dark:bg-stone-900 rounded-3xl border transition-all space-y-3 relative ${
                        addr.isDefault
                          ? 'border-stone-900 dark:border-stone-400 shadow-md ring-1 ring-stone-900/10'
                          : 'border-stone-200/80 dark:border-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {addr.fullName || addr.recipientName}
                        </span>
                        {addr.isDefault ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefaultAddress(addr)}
                            className="text-[11px] text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 underline cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
                        <p>{addr.addressLine1 || addr.streetAddress}</p>
                        {(addr.addressLine2 || addr.houseNumber) && (
                          <p>{addr.addressLine2 || addr.houseNumber}</p>
                        )}
                        {addr.landmark && (
                          <p className="italic text-stone-400">Near: {addr.landmark}</p>
                        )}
                        <p>
                          {addr.city}, {addr.province} - {addr.postalCode}
                        </p>
                        <p className="font-mono text-[11px] text-stone-900 dark:text-stone-100 pt-1">
                          {addr.phone}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditAddress(addr)}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          title="Edit Address"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 7: WISHLIST */}
          {/* ========================================== */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold font-serif text-stone-950 dark:text-stone-50">
                  Wishlist & Saved Pieces
                </h2>
                <p className="text-xs text-stone-400">
                  Items you have bookmarked for future atelier orders.
                </p>
              </div>

              {wishlistProducts.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <Heart className="w-10 h-10 text-stone-400 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    Your wishlist is empty
                  </h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Click the heart icon on any leather product to save it here for later.
                  </p>
                  <button
                    onClick={() => onNavigate('shop')}
                    className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Browse Collections
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistProducts.map((prod, pIdx) => (
                    <div
                      key={prod.id || prod.slug || `wish_prod_${pIdx}`}
                      className="p-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 flex gap-4 items-center shadow-xs"
                    >
                      <img
                        src={prod.mainImage}
                        alt={prod.name}
                        className="w-20 h-20 rounded-2xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-100 dark:border-stone-800"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4
                          onClick={() => onNavigate('product', prod.slug)}
                          className="text-xs font-bold text-stone-900 dark:text-stone-100 hover:text-amber-700 truncate cursor-pointer"
                        >
                          {prod.name}
                        </h4>
                        <p className="text-xs font-serif font-bold text-stone-950 dark:text-stone-50">
                          Rs. {prod.salePrice.toLocaleString()}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-block">
                          {prod.stock > 0 ? 'In Stock' : 'Made to Order'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => moveToCart(prod)}
                          className="px-3 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Move to Bag
                        </button>
                        <button
                          onClick={() => removeFromWishlist(prod.id)}
                          className="text-[11px] text-stone-400 hover:text-rose-600 transition-colors cursor-pointer text-center"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 8: ACCOUNT SETTINGS & PHOTO UPLOAD */}
          {/* ========================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-2xl">
              
              {/* Profile Photo & Info Card */}
              <div className="p-6 sm:p-8 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold font-serif text-stone-950 dark:text-stone-50">
                    Profile Photo & Information
                  </h2>
                  <p className="text-xs text-stone-400">
                    Update your profile avatar, full name, and mobile number.
                  </p>
                </div>

                {profileSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs">
                  
                  {/* Photo Upload Area */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
                    {/* 3D Circular Avatar Preview */}
                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-amber-500/50 via-stone-400 to-stone-200 shadow-[0_8px_20px_rgba(0,0,0,0.15)] shrink-0 relative overflow-hidden">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editName || user.name || 'Member')}&backgroundColor=292524&textColor=fafaf9`}
                        alt="Profile Preview"
                        className="w-full h-full rounded-full object-cover bg-white dark:bg-stone-800"
                      />
                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={avatarUploading}
                          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {avatarUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{avatarUploading ? 'Uploading...' : 'Change Photo'}</span>
                        </button>
                        {user.avatar && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={avatarUploading}
                            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400">
                        Supports JPG, PNG, WebP up to 5MB. Resized automatically.
                      </p>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-300"
                    />
                  </div>

                  {/* Email (Read only) */}
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full p-3 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Mobile Number (Pakistan format)
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+92 3XX XXXXXXX"
                      required
                      className="w-full p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono focus:outline-none focus:border-stone-900 dark:focus:border-stone-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-3 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>

              {/* Change Password Card */}
              <div className="p-6 sm:p-8 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold font-serif text-stone-950 dark:text-stone-50">
                    Change Password
                  </h2>
                  <p className="text-xs text-stone-400">
                    Update your account security password. Minimum 6 characters.
                  </p>
                </div>

                {passSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passSuccessMsg}</span>
                  </div>
                )}

                {passErrorMsg && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900"
                      />
                      <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowCurPass(!showCurPass)}
                        className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showCurPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder="Min 6 characters"
                          className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900"
                        />
                        <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900"
                        />
                        <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passSaving}
                    className="px-6 py-3 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {passSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 9: NOTIFICATIONS */}
          {/* ========================================== */}
          {activeTab === 'notifications' && (
            <CustomerNotificationsTab token={token} onNavigate={onNavigate} />
          )}

          {/* ========================================== */}
          {/* TAB 10: CUSTOMER SUPPORT & QUERIES */}
          {/* ========================================== */}
          {activeTab === 'queries' && (
            <CustomerQueriesTab initialQueryId={initialQueryId} onNavigate={onNavigate} />
          )}

        </div>
      </div>

      {/* =================================================== */}
      {/* 3. MODALS & OVERLAYS */}
      {/* =================================================== */}
      
      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedDetailsOrder}
        onClose={() => setSelectedDetailsOrder(null)}
        onPrintInvoice={(ord) => setSelectedInvoiceOrder(ord)}
        onCancelOrder={handleCancelOrder}
        onRequestReturn={(ord) => {
          setReturnTargetOrder(ord);
          setReturnModalOpen(true);
        }}
      />

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* Request Return Modal */}
      <RequestReturnModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        order={returnTargetOrder}
        deliveredOrders={deliveredOrders}
        onOrderSelect={(ord) => setReturnTargetOrder(ord)}
        token={token}
        onSuccess={(updatedOrder) => {
          setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
          setActiveTab('returns');
        }}
      />

      {/* Add / Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-[0_25px_60px_rgba(0,0,0,0.3)] my-8 overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold font-serif text-stone-950 dark:text-stone-50 mb-4">
              {editingAddressId ? 'Edit Shipping Address' : 'Add New Shipping Address in Pakistan'}
            </h3>

            <form onSubmit={handleSaveAddress} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={addrFullName}
                    onChange={(e) => setAddrFullName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    required
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Province *
                  </label>
                  <select
                    value={addrProvince}
                    onChange={(e) => setAddrProvince(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl cursor-pointer"
                  >
                    {PAKISTAN_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    required
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Street Address / House / Flat # *
                </label>
                <input
                  type="text"
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  placeholder="e.g. House 42, Street 7, Block 4"
                  required
                  className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    value={addrLandmark}
                    onChange={(e) => setAddrLandmark(e.target.value)}
                    placeholder="e.g. Near Shell Pump"
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={addrPostal}
                    onChange={(e) => setAddrPostal(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addrDefaultChk"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 cursor-pointer"
                />
                <label htmlFor="addrDefaultChk" className="text-stone-700 dark:text-stone-300 cursor-pointer">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
