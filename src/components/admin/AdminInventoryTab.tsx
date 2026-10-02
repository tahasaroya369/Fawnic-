import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Download,
  History,
  RefreshCw,
  Plus,
} from 'lucide-react';
import type { Product, InventoryTransaction } from '../../types.js';

interface AdminInventoryTabProps {
  products: Product[];
  token: string | null;
  onOpenAdjustStock: (product: Product) => void;
  onRefreshProducts: () => void;
}

export const AdminInventoryTab: React.FC<AdminInventoryTabProps> = ({
  products,
  token,
  onOpenAdjustStock,
  onRefreshProducts,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [token]);

  const loadTransactions = async () => {
    try {
      setLoadingTx(true);
      const res = await fetch('/api/admin/inventory/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleExport = () => {
    window.open('/api/admin/reports/export?type=inventory', '_blank');
  };

  // Calculations
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.stock * p.salePrice, 0);
  const totalCostValuation = products.reduce(
    (acc, p) => acc + p.stock * (p.costPrice || p.salePrice * 0.5),
    0
  );
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    if (filter === 'low') return matchesSearch && p.stock > 0 && p.stock <= p.lowStockThreshold;
    if (filter === 'out') return matchesSearch && p.stock === 0;
    if (filter === 'healthy') return matchesSearch && p.stock > p.lowStockThreshold;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Atelier Stock & Inventory Control
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Reorder thresholds, physical craft counts, valuation, and transaction audit logs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-stone-200 dark:border-zinc-700"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Stock Valuation CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            Total Available Units
          </span>
          <p className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1">
            {totalUnits} items
          </p>
          <p className="text-[11px] text-stone-400 mt-1">Across {products.length} articles</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            Retail Valuation (PKR)
          </span>
          <p className="font-serif font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
            Rs. {totalRetailValuation.toLocaleString()}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Cost Basis: Rs. {Math.round(totalCostValuation).toLocaleString()}
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            Low Stock Alerts
          </span>
          <p className="font-serif font-bold text-2xl text-amber-600 mt-1">
            {lowStockCount} articles
          </p>
          <p className="text-[11px] text-stone-400 mt-1">At or below reorder threshold</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            Out of Stock
          </span>
          <p className="font-serif font-bold text-2xl text-rose-600 dark:text-rose-400 mt-1">
            {outOfStockCount} articles
          </p>
          <p className="text-[11px] text-stone-400 mt-1">Immediate atelier crafting needed</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search article by title or SKU code..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              filter === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              filter === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilter('out')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              filter === 'out'
                ? 'bg-rose-600 text-white'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            Out ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Leather Article</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">In Stock</th>
                <th className="px-5 py-3">Alert Threshold</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Retail Valuation</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
              {filteredProducts.map((p) => {
                const isOut = p.stock === 0;
                const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;

                return (
                  <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-900/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.mainImage}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg border border-stone-200 dark:border-zinc-800"
                        />
                        <div>
                          <p className="font-serif font-semibold text-stone-900 dark:text-stone-100">{p.name}</p>
                          <p className="text-[11px] text-stone-500">{p.categoryName}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono font-bold text-stone-600 dark:text-stone-400">
                      {p.sku}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                        {p.stock} units
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-stone-500">
                      {p.lowStockThreshold} units
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                          isOut
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : isLow
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono font-bold text-stone-700 dark:text-stone-300">
                      Rs. {(p.stock * p.salePrice).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenAdjustStock(p)}
                        className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold rounded-lg hover:bg-amber-600 dark:hover:bg-amber-500 transition flex items-center gap-1.5 ml-auto"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Adjust</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History Audit Log */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              Recent Inventory Audit & Adjustment Log
            </h3>
          </div>
          <button
            onClick={loadTransactions}
            className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
            title="Refresh log"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTx ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-stone-500 py-6 text-center">No recent stock adjustments recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Article</th>
                  <th className="px-4 py-2.5">Change</th>
                  <th className="px-4 py-2.5">New Balance</th>
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Notes</th>
                  <th className="px-4 py-2.5">Craftsman / Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
                {transactions.slice(0, 10).map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-2.5 text-stone-500">
                      {new Date(t.timestamp).toLocaleString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2.5 font-serif font-medium text-stone-900 dark:text-stone-100">
                      {t.productName}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold">
                      <span
                        className={
                          t.changeAmount > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {t.changeAmount > 0 ? `+${t.changeAmount}` : t.changeAmount}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-stone-700 dark:text-stone-300">
                      {t.newStock} units
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-100 dark:bg-zinc-800">
                        {t.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-stone-500 max-w-xs truncate">
                      {t.notes || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-stone-400 text-[11px]">
                      {t.performedByName || 'Staff'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
