import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Package,
  ShoppingBag,
  Layers,
  Users,
  FileText,
  Tag,
  TrendingUp,
  ShieldCheck,
  Settings,
  Bell,
  Search,
  LogOut,
  ExternalLink,
  Menu,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Plus,
  Moon,
  Sun,
  Truck,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { notificationSocket } from '../services/notificationSocket.js';
import type { Order, Product, Category } from '../types.js';

// Modular Tab Components
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab.js';
import { AdminProductsTab } from '../components/admin/AdminProductsTab.js';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab.js';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab.js';
import { AdminInventoryTab } from '../components/admin/AdminInventoryTab.js';
import { AdminCRMTab } from '../components/admin/AdminCRMTab.js';
import { AdminQueriesTab } from '../components/admin/AdminQueriesTab.js';
import { AdminInvoicesTab } from '../components/admin/AdminInvoicesTab.js';
import { AdminCouponsTab } from '../components/admin/AdminCouponsTab.js';
import { AdminAnalyticsTab } from '../components/admin/AdminAnalyticsTab.js';
import { AdminTeamTab } from '../components/admin/AdminTeamTab.js';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab.js';
import { AdminNotificationsTab } from '../components/admin/AdminNotificationsTab.js';

// Modals
import { StockAdjustmentModal } from '../components/admin/StockAdjustmentModal.js';
import { InvoiceViewModal } from '../components/admin/InvoiceViewModal.js';
import { OrderDetailModal } from '../components/admin/OrderDetailModal.js';
import { CustomerDetailModal } from '../components/admin/CustomerDetailModal.js';
import { GlobalSearchModal } from '../components/admin/GlobalSearchModal.js';
import { PrivateAdminLogin } from '../components/admin/PrivateAdminLogin.js';

interface AdminDashboardProps {
  onNavigate: (route: string, param?: any) => void;
  subRoute?: string;
}

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'inventory'
  | 'crm'
  | 'queries'
  | 'invoices'
  | 'coupons'
  | 'analytics'
  | 'notifications'
  | 'team'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, subRoute }) => {
  const { user, token, logout, loading: authLoading } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orderSubFilter, setOrderSubFilter] = useState<string>('all');
  const [unreadQueriesCount, setUnreadQueriesCount] = useState<number>(0);

  useEffect(() => {
    if (subRoute) {
      const normalized = subRoute.toLowerCase();
      if (normalized === 'dashboard' || normalized === 'overview') setActiveTab('overview');
      else if (normalized === 'products') setActiveTab('products');
      else if (normalized === 'categories') setActiveTab('categories');
      else if (normalized === 'orders') setActiveTab('orders');
      else if (normalized === 'inventory') setActiveTab('inventory');
      else if (normalized === 'crm') setActiveTab('crm');
      else if (normalized === 'queries' || normalized === 'customer-queries' || normalized === 'contact-queries') setActiveTab('queries');
      else if (normalized === 'invoices') setActiveTab('invoices');
      else if (normalized === 'coupons') setActiveTab('coupons');
      else if (normalized === 'analytics') setActiveTab('analytics');
      else if (normalized === 'notifications') setActiveTab('notifications');
      else if (normalized === 'team') setActiveTab('team');
      else if (normalized === 'settings') setActiveTab('settings');
    }
  }, [subRoute]);

  const handleLogout = async () => {
    await logout();
    onNavigate('aliadmin');
  };

  // Collapsible sidebar groups
  const [productsMenuOpen, setProductsMenuOpen] = useState(true);
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(true);

  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [adjustStockProduct, setAdjustStockProduct] = useState<Product | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Global hotkey: Ctrl+K or Cmd+K to trigger search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshAllData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [statsRes, prodsRes, ordsRes, catRes, notifRes, queryStatsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/products/categories'),
        fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/queries/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (prodsRes.ok) setProducts(await prodsRes.json());
      if (ordsRes.ok) setOrders(await ordsRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(Array.isArray(notifData) ? notifData : (notifData?.notifications || []));
      }
      if (queryStatsRes.ok) {
        const qStats = await queryStatsRes.json();
        if (qStats && typeof qStats.unread === 'number') {
          setUnreadQueriesCount(qStats.unread);
        }
      }
    } catch (err) {
      console.error('Failed to load atelier admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();

    // Subscribe to real-time query events
    const unsubscribe = notificationSocket.subscribe((event) => {
      if (event.type && event.type.startsWith('query:')) {
        // Fetch updated query stats
        if (token) {
          fetch('/api/admin/queries/stats', { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.ok ? r.json() : null)
            .then((st) => {
              if (st && typeof st.unread === 'number') {
                setUnreadQueriesCount(st.unread);
              }
            })
            .catch(() => {});
        }
      }
    });

    return unsubscribe;
  }, [token]);

  if (authLoading && token) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center items-center">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-mono text-stone-400">Verifying Atelier Credentials...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return (
      <PrivateAdminLogin
        onSuccess={() => {
          refreshAllData();
        }}
        onReturnToStore={() => onNavigate('home')}
      />
    );
  }

  const handleSearchResultSelect = (type: string, item: any) => {
    if (type === 'product') {
      setActiveTab('products');
    } else if (type === 'order') {
      const matched = orders.find((o) => (o?.id && o.id === item?.id) || (o?.orderNumber && o.orderNumber === item?.orderNumber));
      if (matched) {
        setSelectedDetailOrder(matched);
      }
      setActiveTab('orders');
    } else if (type === 'customer') {
      setSelectedCustomerId(item?.id);
      setActiveTab('crm');
    } else if (type === 'invoice') {
      const matched = orders.find((o) => (o?.id && o.id === item?.orderId) || (o?.orderNumber && o.orderNumber === item?.orderNumber));
      if (matched) {
        setSelectedInvoiceOrder(matched);
      }
      setActiveTab('invoices');
    } else if (type === 'team') {
      setActiveTab('team');
    }
  };

  const handleNavigateOrders = (filter: string) => {
    setOrderSubFilter(filter);
    setActiveTab('orders');
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-zinc-950 text-stone-900 dark:text-stone-100 flex flex-col antialiased">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-serif font-bold text-sm tracking-wider shadow-sm">
              F
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif font-bold text-base tracking-wider text-stone-900 dark:text-stone-100 uppercase">
                  FAWNIC
                </h1>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                  Atelier Operations
                </span>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 hidden sm:block">
                Artisan Leather Atelier • Pakistan
              </p>
            </div>
          </div>
        </div>

        {/* Global search trigger */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-3 px-4 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs w-80 transition"
        >
          <Search className="w-4 h-4 text-amber-500" />
          <span className="flex-1 text-left">Search catalog, orders, customers...</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-stone-400">
            Ctrl+K
          </span>
        </button>

        {/* Right action group */}
        <div className="flex items-center gap-2">
          {/* Quick Action: Add Product */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('products');
              setIsAddProductModalOpen(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold uppercase tracking-wider bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl hover:bg-amber-600 dark:hover:bg-amber-500 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>

          {/* Theme Toggle (Dark/Light Switch) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-600 dark:text-stone-300 transition"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          {/* Notifications button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-600 dark:text-stone-300 relative transition"
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
              {Array.isArray(notifications) && notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-3 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950 flex items-center justify-between">
                  <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                    Atelier Alerts ({Array.isArray(notifications) ? notifications.length : 0})
                  </span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 dark:divide-zinc-800">
                  {!Array.isArray(notifications) || notifications.length === 0 ? (
                    <p className="p-4 text-center text-stone-500">No new alerts at this time.</p>
                  ) : (
                    (Array.isArray(notifications) ? notifications : []).map((n) => (
                      <div
                        key={n.id}
                        className="p-3 hover:bg-stone-50/80 dark:hover:bg-zinc-800/50 transition cursor-pointer"
                        onClick={() => {
                          setShowNotifications(false);
                          if (n.type === 'low_stock') setActiveTab('inventory');
                          else if (n.type === 'pending_order') setActiveTab('orders');
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          {n.type === 'low_stock' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-semibold text-stone-900 dark:text-stone-100">{n.title}</p>
                            <p className="text-stone-500 text-[11px] mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-950/40 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      setActiveTab('notifications');
                    }}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Open Notification Center &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Visit Live Storefront */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition border border-stone-200 dark:border-zinc-800"
          >
            <span>Live Boutique</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Staff profile & logout */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-200 dark:border-zinc-700 shrink-0 bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-serif font-bold text-stone-700 dark:text-stone-300">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                  {user.adminRole === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : (user.adminRole || 'Staff')}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Sidebar + Dashboard Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Desktop */}
        <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-stone-200 dark:border-zinc-800 hidden lg:flex flex-col justify-between p-3.5 shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <div className="px-3 text-[10px] uppercase font-serif font-bold tracking-widest text-stone-400">
              Navigation
            </div>

            <div className="space-y-1">
              {/* Dashboard / Overview */}
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'overview'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span>Dashboard</span>
                </div>
              </button>

              {/* Products Group */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setProductsMenuOpen(!productsMenuOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>Products</span>
                  </div>
                  {productsMenuOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  )}
                </button>

                {productsMenuOpen && (
                  <div className="pl-6 pt-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'products'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>All Products</span>
                      <span className="font-mono text-[10px] text-stone-400">{products.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('products');
                        setIsAddProductModalOpen(true);
                      }}
                      className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Product</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('categories')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'categories'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>Categories</span>
                      <span className="font-mono text-[10px] text-stone-400">{categories.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('inventory')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'inventory'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>Inventory</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Orders Group */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setOrdersMenuOpen(!ordersMenuOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>Orders</span>
                  </div>
                  {ordersMenuOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  )}
                </button>

                {ordersMenuOpen && (
                  <div className="pl-6 pt-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => handleNavigateOrders('all')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'orders' && orderSubFilter === 'all'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>All Orders</span>
                      <span className="font-mono text-[10px] text-stone-400">{orders.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateOrders('new')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'orders' && orderSubFilter === 'new'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>New Orders</span>
                      <span className="font-mono text-[10px] text-amber-600 font-bold">
                        {orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateOrders('processing')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'orders' && orderSubFilter === 'processing'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>Processing</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateOrders('ready_dispatch')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'orders' && orderSubFilter === 'ready_dispatch'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>Ready to Dispatch</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateOrders('dispatched')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'orders' && orderSubFilter === 'dispatched'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>Dispatched</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateOrders('delivered')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'orders' && orderSubFilter === 'delivered'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>Delivered</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateOrders('completed')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'orders' && orderSubFilter === 'completed'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>Completed</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateOrders('cancelled')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                        activeTab === 'orders' && orderSubFilter === 'cancelled'
                          ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>Cancelled / Returns</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Customers (CRM) */}
              <button
                type="button"
                onClick={() => setActiveTab('crm')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'crm'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>Customers (CRM)</span>
                </div>
              </button>

              {/* Customer Queries */}
              <button
                type="button"
                onClick={() => setActiveTab('queries')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'queries'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <span>Customer Queries</span>
                </div>
                {unreadQueriesCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white font-mono">
                    {unreadQueriesCount}
                  </span>
                )}
              </button>

              {/* Marketing (Coupons) */}
              <button
                type="button"
                onClick={() => setActiveTab('coupons')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'coupons'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span>Marketing & Coupons</span>
                </div>
              </button>

              {/* Notifications */}
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'notifications'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Notifications</span>
                </div>
              </button>

              {/* Tax Invoices */}
              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'invoices'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Tax Invoices</span>
                </div>
              </button>

              {/* Analytics */}
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'analytics'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span>Analytics</span>
                </div>
              </button>

              {/* Atelier Team (RBAC) */}
              {(user?.role === 'admin' || user?.adminRole === 'super_admin' || user?.permissions?.pages?.includes('team')) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('team')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'team'
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>Atelier Staff Roles</span>
                  </div>
                </button>
              )}

              {/* Settings */}
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'settings'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-amber-500" />
                  <span>Store Settings</span>
                </div>
              </button>
            </div>
          </div>

          {/* Footer in sidebar */}
          <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 space-y-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 text-[10px] text-stone-500">
              <span className="font-serif font-bold text-stone-800 dark:text-stone-200 block">FAWNIC Atelier</span>
              Pakistani Handcrafted Leather
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-zinc-900 border-r border-stone-200 dark:border-zinc-800 h-full p-4 flex flex-col justify-between z-10 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-amber-600 flex items-center justify-center text-white font-serif font-bold text-xs">
                      F
                    </div>
                    <span className="font-serif font-bold uppercase tracking-wider text-xs">
                      FAWNIC Menu
                    </span>
                  </div>
                  <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-stone-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => {
                      setActiveTab('overview');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('products');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Products Catalog
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('categories');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Categories
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('orders');
                      setOrderSubFilter('all');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Orders & Logistics
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('inventory');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('crm');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Customers (CRM)
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('queries');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between"
                  >
                    <span>Customer Queries</span>
                    {unreadQueriesCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white font-mono">
                        {unreadQueriesCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('invoices');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Tax Invoices
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('coupons');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Marketing & Coupons
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('notifications');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Notifications
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('analytics');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Store Settings
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Active Tab Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden max-w-7xl mx-auto w-full min-w-0">
          {activeTab === 'overview' && (
            <AdminOverviewTab
              stats={stats}
              products={products}
              orders={orders}
              onNavigateTab={(t: any, subFilter?: string) => {
                if (subFilter) setOrderSubFilter(subFilter);
                setActiveTab(t);
              }}
              onOpenAddProduct={() => {
                setActiveTab('products');
                setIsAddProductModalOpen(true);
              }}
              onOpenAdjustStock={(p) => setAdjustStockProduct(p)}
              onViewOrder={(o) => setSelectedDetailOrder(o)}
              token={token}
            />
          )}

          {activeTab === 'products' && (
            <AdminProductsTab
              products={products}
              categories={categories}
              token={token}
              onRefreshProducts={refreshAllData}
              onOpenAdjustStock={(p) => setAdjustStockProduct(p)}
              isAddModalOpen={isAddProductModalOpen}
              onCloseAddModal={() => setIsAddProductModalOpen(false)}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategoriesTab
              token={token}
              onRefreshCategories={refreshAllData}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              orders={orders}
              token={token}
              initialFilter={orderSubFilter}
              onRefreshOrders={refreshAllData}
              onViewOrder={(o) => setSelectedDetailOrder(o)}
              onViewInvoice={(o) => setSelectedInvoiceOrder(o)}
            />
          )}

          {activeTab === 'inventory' && (
            <AdminInventoryTab
              products={products}
              token={token}
              onOpenAdjustStock={(p) => setAdjustStockProduct(p)}
              onRefreshProducts={refreshAllData}
            />
          )}

          {activeTab === 'crm' && (
            <AdminCRMTab
              token={token}
              onOpenCustomerProfile={(cid) => setSelectedCustomerId(cid)}
            />
          )}

          {activeTab === 'queries' && (
            <AdminQueriesTab
              token={token}
              onOpenCustomerProfile={(cid) => setSelectedCustomerId(cid)}
              onOpenOrder={(orderNumber) => {
                const found = orders.find((o) => o?.orderNumber && o.orderNumber === orderNumber);
                if (found) setSelectedDetailOrder(found);
                else setActiveTab('orders');
              }}
            />
          )}

          {activeTab === 'invoices' && (
            <AdminInvoicesTab
              token={token}
              orders={orders}
              products={products}
              onViewInvoiceByOrder={(o) => setSelectedInvoiceOrder(o)}
            />
          )}

          {activeTab === 'coupons' && <AdminCouponsTab token={token} />}

          {activeTab === 'notifications' && <AdminNotificationsTab token={token} />}

          {activeTab === 'analytics' && <AdminAnalyticsTab token={token} />}

          {activeTab === 'team' && <AdminTeamTab token={token} />}

          {activeTab === 'settings' && <AdminSettingsTab token={token} />}
        </main>
      </div>

      {/* Global Modals */}

      {/* 1. Stock Adjustment Modal */}
      <StockAdjustmentModal
        product={adjustStockProduct}
        isOpen={Boolean(adjustStockProduct)}
        onClose={() => setAdjustStockProduct(null)}
        token={token}
        onStockUpdated={refreshAllData}
      />

      {/* 2. Official Tax Invoice Modal */}
      <InvoiceViewModal
        order={selectedInvoiceOrder}
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
        token={token}
      />

      {/* 3. Order Details & History Modal */}
      <OrderDetailModal
        order={selectedDetailOrder}
        isOpen={Boolean(selectedDetailOrder)}
        onClose={() => setSelectedDetailOrder(null)}
        token={token}
        onOrderUpdated={refreshAllData}
        onViewInvoice={(o) => {
          setSelectedDetailOrder(null);
          setSelectedInvoiceOrder(o);
        }}
      />

      {/* 4. Customer CRM Profile Modal */}
      <CustomerDetailModal
        customerId={selectedCustomerId}
        isOpen={Boolean(selectedCustomerId)}
        onClose={() => setSelectedCustomerId(null)}
        token={token}
        onViewOrder={(o) => {
          setSelectedCustomerId(null);
          setSelectedDetailOrder(o);
        }}
      />

      {/* 5. Global Command-Palette Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        token={token}
        onSelectResult={handleSearchResultSelect}
      />
    </div>
  );
};
