import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Truck,
  Plus,
  ArrowRight,
  Download,
  Layers,
  Sparkles,
  RotateCcw,
  CreditCard,
  Eye,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import type { Order, Product } from '../../types.js';

interface AdminOverviewTabProps {
  stats: any;
  products: Product[];
  orders: Order[];
  onNavigateTab: (tab: string, subFilter?: string) => void;
  onOpenAddProduct: () => void;
  onOpenAdjustStock: (product: Product) => void;
  onViewOrder: (order: Order) => void;
  token: string | null;
}

type ChartPeriod = 'today' | '7d' | '30d' | '3m' | '6m' | '1y';
type ChartMetric = 'sales' | 'orders';

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  stats,
  products,
  orders,
  onNavigateTab,
  onOpenAddProduct,
  onOpenAdjustStock,
  onViewOrder,
  token,
}) => {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('7d');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('sales');

  // 3D Card Interactive Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0, shineX: 50, shineY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setTilt({
      x: rotateX,
      y: rotateY,
      shineX: (x / rect.width) * 100,
      shineY: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, shineX: 50, shineY: 50 });
  };

  // Real KPI Computations
  const totalSales = stats?.totalSales || orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : 0), 0);
  const todaySales = stats?.todaySales || 0;
  const totalOrdersCount = stats?.totalOrders || orders.length;

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const processingOrders = orders.filter((o) => o.status === 'processing' || o.status === 'confirmed');
  const readyToDispatchOrders = orders.filter((o) => o.status === 'packed');
  const completedOrders = orders.filter((o) => o.status === 'delivered' && o.paymentStatus === 'paid');
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
  const pendingIbftOrders = orders.filter((o) => o.paymentMethod === 'ibft' && o.paymentStatus === 'pending');

  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);
  const recentOrders = orders.slice(0, 6);
  const featuredProduct = products.find((p) => p.isFeatured) || products[0];

  // Dynamic Chart Generation Based on Period & Real Order Timestamps
  const chartData = useMemo(() => {
    const now = new Date();
    let points: { label: string; sales: number; ordersCount: number }[] = [];

    if (chartPeriod === 'today') {
      // 6-hour blocks for today
      for (let h = 0; h < 24; h += 4) {
        const label = `${h.toString().padStart(2, '0')}:00`;
        const periodOrders = orders.filter((o) => {
          const d = new Date(o.createdAt);
          return (
            d.toDateString() === now.toDateString() &&
            d.getHours() >= h &&
            d.getHours() < h + 4
          );
        });
        const sales = periodOrders.reduce((sum, o) => sum + o.total, 0);
        points.push({ label, sales, ordersCount: periodOrders.length });
      }
    } else if (chartPeriod === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayOrders = orders.filter((o) => o.createdAt.startsWith(dateStr));
        const sales = dayOrders.reduce((sum, o) => sum + o.total, 0);
        points.push({ label, sales, ordersCount: dayOrders.length });
      }
    } else if (chartPeriod === '30d') {
      // 6 blocks of 5 days
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i * 5);
        const label = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
        const blockOrders = orders.filter((o) => {
          const od = new Date(o.createdAt);
          const diffDays = (now.getTime() - od.getTime()) / (1000 * 3600 * 24);
          return diffDays >= i * 5 && diffDays < (i + 1) * 5;
        });
        const sales = blockOrders.reduce((sum, o) => sum + o.total, 0);
        points.push({ label, sales, ordersCount: blockOrders.length });
      }
    } else if (chartPeriod === '3m' || chartPeriod === '6m' || chartPeriod === '1y') {
      const monthsCount = chartPeriod === '3m' ? 3 : chartPeriod === '6m' ? 6 : 12;
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const m = d.getMonth();
        const y = d.getFullYear();
        const monthOrders = orders.filter((o) => {
          const od = new Date(o.createdAt);
          return od.getMonth() === m && od.getFullYear() === y;
        });
        const sales = monthOrders.reduce((sum, o) => sum + o.total, 0);
        points.push({ label, sales, ordersCount: monthOrders.length });
      }
    }

    return points;
  }, [orders, chartPeriod]);

  const maxVal = useMemo(() => {
    if (chartMetric === 'sales') {
      return Math.max(...chartData.map((p) => p.sales), 10000);
    }
    return Math.max(...chartData.map((p) => p.ordersCount), 5);
  }, [chartData, chartMetric]);

  const handleExport = (type: string) => {
    window.open(`/api/admin/reports/export?type=${type}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Atelier Executive Operations
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Real-time telemetry, Pakistani consignment fulfillment, and artisanal inventory tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="px-3.5 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-serif uppercase tracking-wider font-bold rounded-xl hover:bg-amber-600 dark:hover:bg-amber-500 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Leather Article</span>
          </button>

          <button
            type="button"
            onClick={() => handleExport('orders')}
            className="px-3 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-stone-200 dark:border-zinc-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {/* SECTION 6: Important Alerts / Attention Required */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-stone-50 to-stone-100 dark:from-amber-950/20 dark:via-zinc-900 dark:to-zinc-900/60 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-serif font-bold text-xs uppercase tracking-wider">
              Attention Required
            </h3>
          </div>
          <span className="text-[10px] font-mono text-stone-500 uppercase">Actionable items</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Alert 1: Ready to Dispatch */}
          <button
            type="button"
            onClick={() => onNavigateTab('orders', 'ready_dispatch')}
            className="p-3 bg-white dark:bg-zinc-900/90 border border-stone-200 dark:border-zinc-800 rounded-xl text-left hover:border-amber-500 transition group flex items-start justify-between"
          >
            <div>
              <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                {readyToDispatchOrders.length} Consignments
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Waiting for courier dispatch</p>
            </div>
            <Truck className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition" />
          </button>

          {/* Alert 2: Low Stock */}
          <button
            type="button"
            onClick={() => onNavigateTab('inventory')}
            className="p-3 bg-white dark:bg-zinc-900/90 border border-stone-200 dark:border-zinc-800 rounded-xl text-left hover:border-rose-500 transition group flex items-start justify-between"
          >
            <div>
              <p className="font-serif font-bold text-sm text-rose-600 dark:text-rose-400">
                {lowStockProducts.length} Articles
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Low atelier stock threshold</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition" />
          </button>

          {/* Alert 3: Return & Cancellation */}
          <button
            type="button"
            onClick={() => onNavigateTab('orders', 'cancelled')}
            className="p-3 bg-white dark:bg-zinc-900/90 border border-stone-200 dark:border-zinc-800 rounded-xl text-left hover:border-amber-500 transition group flex items-start justify-between"
          >
            <div>
              <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                {cancelledOrders.length} Returns / Cancelled
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Check inventory restock</p>
            </div>
            <RotateCcw className="w-4 h-4 text-stone-400 group-hover:rotate-45 transition" />
          </button>

          {/* Alert 4: Bank Transfer Pending */}
          <button
            type="button"
            onClick={() => onNavigateTab('orders', 'new')}
            className="p-3 bg-white dark:bg-zinc-900/90 border border-stone-200 dark:border-zinc-800 rounded-xl text-left hover:border-amber-500 transition group flex items-start justify-between"
          >
            <div>
              <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                {pendingIbftOrders.length} Bank Transfers
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Awaiting deposit verification</p>
            </div>
            <CreditCard className="w-4 h-4 text-emerald-500 group-hover:scale-105 transition" />
          </button>
        </div>
      </div>

      {/* SECTION 3: Top KPI Cards Grid (All 9 Requested Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {/* 1. Total Sales */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-widest font-serif font-bold">Total Sales</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Rs. {totalSales.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500">Gross revenue across lifetime</p>
        </div>

        {/* 2. Today's Sales */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-widest font-serif font-bold">Today's Sales</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-emerald-600 dark:text-emerald-400">
            Rs. {todaySales.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500">Recorded since 00:00 PST</p>
        </div>

        {/* 3. Total Orders */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-widest font-serif font-bold">Total Orders</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            {totalOrdersCount}
          </div>
          <p className="text-[11px] text-stone-500">Client consignments logged</p>
        </div>

        {/* 4. Pending Orders */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-widest font-serif font-bold">Pending Orders</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-amber-600 dark:text-amber-400">
            {pendingOrders.length}
          </div>
          <p className="text-[11px] text-stone-500">Awaiting phone/address confirmation</p>
        </div>

        {/* 5. Processing Orders */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-widest font-serif font-bold">Processing Orders</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-blue-600 dark:text-blue-400">
            {processingOrders.length}
          </div>
          <p className="text-[11px] text-stone-500">In atelier tailoring or boxing</p>
        </div>

        {/* 6. Completed Orders */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-widest font-serif font-bold">Completed Orders</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            {completedOrders.length}
          </div>
          <p className="text-[11px] text-stone-500">Delivered & verified paid</p>
        </div>

        {/* 7. Total Products */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-widest font-serif font-bold">Total Products</span>
            <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            {products.length}
          </div>
          <p className="text-[11px] text-stone-500">Active catalog articles</p>
        </div>

        {/* 8. Total Customers */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-widest font-serif font-bold">Total Customers</span>
            <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            {stats?.totalCustomers || 12}
          </div>
          <p className="text-[11px] text-stone-500">Registered customers</p>
        </div>

        {/* 9. Low Stock Products */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase tracking-widest font-serif font-bold">Low Stock Products</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-rose-600 dark:text-rose-400">
            {lowStockProducts.length}
          </div>
          <p className="text-[11px] text-stone-500">At or below reorder threshold</p>
        </div>
      </div>

      {/* SECTION 4 & 36: Interactive Sales Chart & 3D Atelier Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart with Period & Metric Selector */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  Revenue & Consignment Velocity
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Dynamic telemetry reflecting live order records
              </p>
            </div>

            {/* Metric Toggle: Sales vs Orders */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setChartMetric('sales')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  chartMetric === 'sales'
                    ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Sales (PKR)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  chartMetric === 'orders'
                    ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Orders
              </button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-stone-100 dark:border-zinc-800">
            {(['today', '7d', '30d', '3m', '6m', '1y'] as ChartPeriod[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setChartPeriod(period)}
                className={`px-3 py-1 text-xs font-serif font-semibold rounded-lg transition uppercase tracking-wider ${
                  chartPeriod === period
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                {period === 'today'
                  ? 'Today'
                  : period === '7d'
                  ? '7 Days'
                  : period === '30d'
                  ? '30 Days'
                  : period === '3m'
                  ? '3 Months'
                  : period === '6m'
                  ? '6 Months'
                  : '1 Year'}
              </button>
            ))}
          </div>

          {/* Render Visual Bar Chart */}
          <div className="h-52 flex items-end justify-between gap-3 pt-4 px-2">
            {chartData.map((d, idx) => {
              const val = chartMetric === 'sales' ? d.sales : d.ordersCount;
              const heightPct = Math.max(8, Math.round((val / maxVal) * 100));

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                >
                  <div className="text-[10px] font-mono text-stone-500 opacity-0 group-hover:opacity-100 transition truncate text-center">
                    {chartMetric === 'sales'
                      ? `Rs. ${val > 1000 ? `${Math.round(val / 1000)}k` : val}`
                      : `${val} orders`}
                  </div>
                  <div className="w-full max-w-[40px] bg-stone-100 dark:bg-zinc-800 rounded-t-xl h-full flex items-end overflow-hidden p-0.5">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full transition-all duration-300 rounded-t-lg ${
                        val > 0
                          ? 'bg-gradient-to-t from-amber-700 to-amber-500 group-hover:from-amber-600 group-hover:to-amber-400'
                          : 'bg-stone-200 dark:bg-zinc-700'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 whitespace-nowrap">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 36: 3D Leather Showcase Card */}
        <div
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: isHovered
              ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
              : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
            transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease',
          }}
          className="relative p-6 bg-gradient-to-br from-stone-900 via-stone-950 to-zinc-950 text-white rounded-2xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col justify-between select-none"
        >
          {/* Specular Lighting Glow Effect */}
          <div
            style={{
              background: `radial-gradient(circle at ${tilt.shineX}% ${tilt.shineY}%, rgba(217, 119, 6, 0.25), transparent 60%)`,
            }}
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
          />

          {/* Card Top Label */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">
                Atelier 3D Showcase
              </span>
            </div>
            <span className="text-[10px] font-mono text-stone-400">FAWNIC Signature</span>
          </div>

          {/* Product Center 3D Preview */}
          <div className="relative z-10 py-6 text-center space-y-4">
            <div className="relative mx-auto w-36 h-36 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-2xl group">
              <img
                src={
                  featuredProduct?.mainImage ||
                  'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80'
                }
                alt={featuredProduct?.name || 'Leather article'}
                className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
            </div>

            <div>
              <h4 className="font-serif font-bold text-base text-stone-100 truncate px-2">
                {featuredProduct?.name || 'Artisanal Cowhide Article'}
              </h4>
              <p className="text-xs text-amber-400 font-mono font-bold mt-0.5">
                Rs. {featuredProduct?.salePrice.toLocaleString() || '4,500'}
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                {featuredProduct?.leatherType || 'Full-Grain Pakistani Leather'}
              </p>
            </div>
          </div>

          {/* Card Bottom Actions */}
          <div className="relative z-10 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs">
            <span className="text-[11px] text-stone-400">
              Stock: {featuredProduct?.stock || 0} units
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-serif text-[11px] font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1 shadow-xs"
            >
              <span>Inspect Article</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 5: Recent Orders Feed */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              Recent Client Consignments
            </h3>
            <p className="text-xs text-stone-500">Live feed of orders placed through the atelier storefront</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-serif font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>All Consignments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Order Number</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Articles</th>
                <th className="px-4 py-2.5">Amount (PKR)</th>
                <th className="px-4 py-2.5">Payment</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-stone-500">
                    No recent consignments logged.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => {
                  const dateStr = new Date(o.createdAt).toLocaleDateString('en-PK', {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/40 transition"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                        #{o.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-serif font-semibold text-stone-900 dark:text-stone-100">
                          {o.customerName}
                        </p>
                        <p className="text-stone-400 text-[10px] font-mono">{o.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                        {o.items.length} item{o.items.length > 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        Rs. {o.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-stone-300">
                          {o.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                            o.status === 'delivered'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : o.status === 'dispatched'
                              ? 'bg-purple-500/10 text-purple-600'
                              : o.status === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500 font-mono text-[11px]">{dateStr}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onViewOrder(o)}
                          className="px-2.5 py-1 text-xs font-semibold bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 rounded-lg transition"
                        >
                          View Order
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
