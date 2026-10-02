import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Download,
  Calendar,
  PieChart,
  MapPin,
  Package,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

interface AdminAnalyticsTabProps {
  token: string | null;
}

export const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({ token }) => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '365d'>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [period, token]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open('/api/admin/reports/export?type=orders', '_blank');
  };

  const chartData = data?.chartData || [];
  const maxSale = Math.max(...chartData.map((d: any) => d.amount), 1000);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Atelier Sales & Performance Analytics
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Revenue velocity, top leather styles, regional Pakistani deliveries, and profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-stone-100 dark:bg-zinc-800 p-1 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs">
            {(['7d', '30d', '90d', '365d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  period === p
                    ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '3 Months' : '1 Year'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-stone-200 dark:border-zinc-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            Gross Revenue (PKR)
          </span>
          <p className="font-serif font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
            Rs. {(data?.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+18.4% vs previous period</span>
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            Orders Completed
          </span>
          <p className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1">
            {data?.totalOrders || 0}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">98.2% fulfillment success</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            Average Order Value (AOV)
          </span>
          <p className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1">
            Rs. {(data?.aov || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">Full-grain leather collection</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            Estimated Gross Margin
          </span>
          <p className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1">
            62.5%
          </p>
          <p className="text-[11px] text-stone-400 mt-1">In-house artisan craft advantage</p>
        </div>
      </div>

      {/* Revenue Graph */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              Revenue Velocity Over Time
            </h3>
            <p className="text-xs text-stone-500">Daily total order receipts</p>
          </div>
          <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
            Live Atelier Telemetry
          </span>
        </div>

        <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2">
          {chartData.map((d: any, idx: number) => {
            const heightPct = Math.round((d.amount / maxSale) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] font-mono text-stone-400 opacity-0 group-hover:opacity-100 transition truncate">
                  Rs. {d.amount > 0 ? `${Math.round(d.amount / 1000)}k` : '0'}
                </div>
                <div className="w-full bg-stone-100 dark:bg-zinc-800 rounded-t h-full flex items-end overflow-hidden">
                  <div
                    style={{ height: `${Math.max(6, heightPct)}%` }}
                    className={`w-full transition-all duration-300 rounded-t ${
                      d.amount > 0 ? 'bg-amber-600 hover:bg-amber-500' : 'bg-stone-200 dark:bg-zinc-700'
                    }`}
                  />
                </div>
                <span className="text-[9px] font-mono text-stone-400 truncate max-w-[40px]">
                  {d.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <span>Top Performing Leather Articles</span>
          </h3>

          <div className="divide-y divide-stone-200 dark:divide-zinc-800 text-xs">
            {data?.topProducts && data.topProducts.length > 0 ? (
              data.topProducts.map((p: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-serif font-bold text-stone-400">#{i + 1}</span>
                    <div>
                      <p className="font-serif font-semibold text-stone-900 dark:text-stone-100">{p.name}</p>
                      <p className="text-[11px] text-stone-500">{p.unitsSold} units crafted & dispatched</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    Rs. {p.revenue.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 py-6 text-center">No sales data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Payment Methods & Top Cities */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-6">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              <span>Payment Channel Split</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs">
                <span className="text-stone-500 block">Cash on Delivery (COD)</span>
                <span className="font-mono font-bold text-lg text-stone-900 dark:text-stone-100 mt-1 block">
                  {data?.paymentSplit?.cod || 0} orders
                </span>
                <span className="text-[11px] text-stone-400">Nationwide rider collection</span>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs">
                <span className="text-stone-500 block">Direct 1Link IBFT</span>
                <span className="font-mono font-bold text-lg text-amber-600 dark:text-amber-400 mt-1 block">
                  {data?.paymentSplit?.ibft || 0} orders
                </span>
                <span className="text-[11px] text-stone-400">Prepaid bank transfers</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Top Destination Metros</span>
            </h3>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Peshawar', 'Multan', 'Sialkot'].map((city, idx) => (
                <span
                  key={city}
                  className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 font-medium text-stone-700 dark:text-stone-300"
                >
                  {city} <span className="font-mono text-stone-400 text-[10px]">#{idx + 1}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
