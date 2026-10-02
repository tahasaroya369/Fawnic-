import React, { useState, useEffect } from 'react';
import { X, Tag, Percent, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Coupon } from '../../types.js';

interface CouponModalProps {
  coupon?: Coupon | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (coupon: Coupon) => void;
  token: string | null;
}

export const CouponModal: React.FC<CouponModalProps> = ({
  coupon,
  isOpen,
  onClose,
  onSuccess,
  token,
}) => {
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [value, setValue] = useState(15);
  const [minOrder, setMinOrder] = useState(3000);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(5000);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(100);
  const [expiryDate, setExpiryDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        setCode(coupon.code);
        setType(coupon.type === 'percent' || coupon.type === 'percentage' ? 'percentage' : 'fixed_amount');
        setValue(coupon.value);
        setMinOrder(coupon.minOrderAmount || 0);
        setMaxDiscount(coupon.maxDiscount);
        setUsageLimit(coupon.usageLimit);
        setExpiryDate(coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '');
        setIsActive(coupon.isActive);
      } else {
        setCode('');
        setType('percentage');
        setValue(15);
        setMinOrder(3000);
        setMaxDiscount(3000);
        setUsageLimit(100);
        setExpiryDate('');
        setIsActive(true);
      }
      setError('');
    }
  }, [isOpen, coupon]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Coupon code is required.');
      return;
    }
    if (value <= 0) {
      setError('Discount value must be greater than zero.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: Number(value),
          minOrderAmount: Number(minOrder) || 0,
          maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save coupon');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      console.error('Coupon creation error:', err);
      setError(err.message || 'Error occurred while saving coupon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              {coupon ? 'Edit Atelier Coupon' : 'Create Atelier Coupon'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Coupon Code
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
              placeholder="e.g. FAWNIC15 or LUXURY10"
              className="w-full px-3 py-2 font-mono font-bold text-sm uppercase bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Discount Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount (PKR)</option>
              </select>
            </div>

            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Discount Value
              </label>
              <input
                type="number"
                min="1"
                required
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono font-bold bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Min. Order (PKR)
              </label>
              <input
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Max Cap (PKR)
              </label>
              <input
                type="number"
                value={maxDiscount || ''}
                onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional cap"
                className="w-full px-3 py-2 font-mono bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                value={usageLimit || ''}
                onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Unlimited if blank"
                className="w-full px-3 py-2 font-mono bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="couponActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="couponActive" className="text-stone-800 dark:text-stone-200 cursor-pointer font-medium">
              Active & ready for checkout validation
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 uppercase tracking-wider font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 uppercase tracking-wider font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Coupon</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
