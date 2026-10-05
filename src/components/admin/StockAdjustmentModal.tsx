import React, { useState, useEffect } from 'react';
import { X, Layers, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import type { Product, InventoryReason } from '../../types.js';
import { emitSyncEvent } from '../../services/notificationSocket.js';

interface StockAdjustmentModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedProduct: Product, txn: any) => void;
  onStockUpdated?: () => void | Promise<void>;
  token: string | null;
}

const REASONS: { label: string; value: InventoryReason }[] = [
  { label: 'Craft Workshop Production (+)', value: 'Production' },
  { label: 'Raw Leather / Stock Purchase (+)', value: 'Purchase' },
  { label: 'Customer Return / Restock (+)', value: 'Returned' },
  { label: 'Damaged / Atelier Quality Reject (-)', value: 'Damaged' },
  { label: 'Inventory Audit Correction', value: 'Correction' },
  { label: 'Manual Adjustment', value: 'Manual Adjustment' },
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
  onStockUpdated,
  token,
}) => {
  const [change, setChange] = useState<number>(0);
  const [reason, setReason] = useState<InventoryReason>('Manual Adjustment');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setChange(0);
      setReason('Manual Adjustment');
      setNotes('');
      setError('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentStock = product.stock;
  const projectedStock = Math.max(0, currentStock + change);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (change === 0) {
      setError('Please specify a non-zero stock adjustment quantity.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          change,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to adjust stock');
      }

      emitSyncEvent({
        type: 'product:change',
        action: 'inventory',
        productId: product.id,
        product: data.product,
      });

      if (onSuccess) onSuccess(data.product, data.transaction);
      if (onStockUpdated) onStockUpdated();
      onClose();
    } catch (err: any) {
      console.error('Adjustment error:', err);
      setError(err.message || 'Server error occurred while adjusting inventory.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Adjust Atelier Stock
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                SKU: <span className="font-mono font-bold text-stone-700 dark:text-stone-300">{product.sku}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product summary card */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-zinc-950/50 border-b border-stone-200 dark:border-zinc-800 flex items-center gap-4">
          <img
            src={product.mainImage}
            alt={product.name}
            className="w-14 h-14 object-cover rounded-lg border border-stone-200 dark:border-zinc-800 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
              {product.name}
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {product.leatherType} • {product.categoryName}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="text-stone-500">Current Stock:</span>
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-stone-200 dark:bg-zinc-800 text-stone-800 dark:text-stone-200">
                {currentStock} units
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Adjustment Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as InventoryReason)}
              className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment quantity */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Stock Change Quantity
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChange((prev) => prev - 5)}
                className="px-2.5 py-2 text-xs font-mono font-bold bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded border border-stone-300 dark:border-zinc-700"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setChange((prev) => prev - 1)}
                className="px-2.5 py-2 text-xs font-mono font-bold bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded border border-stone-300 dark:border-zinc-700"
              >
                -1
              </button>
              <input
                type="number"
                value={change}
                onChange={(e) => setChange(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 text-center font-mono font-bold text-base bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setChange((prev) => prev + 1)}
                className="px-2.5 py-2 text-xs font-mono font-bold bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded border border-stone-300 dark:border-zinc-700"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setChange((prev) => prev + 5)}
                className="px-2.5 py-2 text-xs font-mono font-bold bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded border border-stone-300 dark:border-zinc-700"
              >
                +5
              </button>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Use positive numbers to add crafted pieces, or negative to deduct rejects.
            </p>
          </div>

          {/* Real-time Calculation Card */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
            <div className="text-center">
              <span className="block text-[10px] text-stone-500 uppercase tracking-wider">Current</span>
              <span className="font-mono font-bold text-sm text-stone-800 dark:text-stone-200">{currentStock}</span>
            </div>
            <div className="font-bold text-stone-400">{change >= 0 ? `+${change}` : change}</div>
            <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <div className="text-center">
              <span className="block text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold">
                Projected New Stock
              </span>
              <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
                {projectedStock} units
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Internal Audit Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Master craftsman inspected batch #44"
              className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || change === 0}
              className="px-5 py-2 text-xs uppercase tracking-wider font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Stock Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
