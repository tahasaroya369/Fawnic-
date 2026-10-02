import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Percent,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import type { Coupon } from '../../types.js';
import { CouponModal } from './CouponModal.js';

interface AdminCouponsTabProps {
  token: string | null;
}

export const AdminCouponsTab: React.FC<AdminCouponsTabProps> = ({ token }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    loadCoupons();
  }, [token]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (res.ok) {
        loadCoupons();
      }
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadCoupons();
      }
    } catch (err) {
      console.error('Delete coupon failed:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Promotional Coupons & Privileges
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Manage checkout voucher codes, cart percentage discounts, and VIP promo thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCoupon(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-serif uppercase tracking-widest font-bold rounded-xl hover:bg-amber-600 dark:hover:bg-amber-500 transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Atelier Coupon</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-500 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl">
            <Tag className="w-8 h-8 mx-auto mb-2 text-stone-400" />
            <p className="font-serif font-semibold">No Atelier Coupons Configured</p>
            <p className="text-xs mt-1">Create your first coupon like FAWNIC10 or WELCOME15.</p>
          </div>
        ) : (
          coupons.map((c) => {
            const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();

            return (
              <div
                key={c.id}
                className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-sm tracking-wider uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {c.code}
                    </span>
                    <p className="text-xs text-stone-500 mt-2">
                      {c.type === 'percentage' ? `${c.value}% Off Order` : `Rs. ${c.value.toLocaleString()} Flat Discount`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(c)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold transition flex items-center gap-1 ${
                      c.isActive && !isExpired
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-stone-200 dark:bg-zinc-800 text-stone-500 hover:bg-stone-300'
                    }`}
                  >
                    {c.isActive && !isExpired ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>{isExpired ? 'Expired' : 'Paused'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-zinc-800 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                  <div className="flex justify-between">
                    <span>Min. Order Value:</span>
                    <span className="font-mono text-stone-900 dark:text-stone-100">
                      Rs. {(c.minOrderAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  {c.maxDiscount && (
                    <div className="flex justify-between">
                      <span>Max Discount Cap:</span>
                      <span className="font-mono text-stone-900 dark:text-stone-100">
                        Rs. {c.maxDiscount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Usage Count:</span>
                    <span className="font-mono text-stone-900 dark:text-stone-100">
                      {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : 'times'}
                    </span>
                  </div>
                  {c.expiryDate && (
                    <div className="flex justify-between text-stone-500">
                      <span>Expires:</span>
                      <span>{new Date(c.expiryDate).toLocaleDateString('en-PK')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCoupon(c);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-amber-600 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <CouponModal
        isOpen={isModalOpen}
        coupon={editingCoupon}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadCoupons()}
        token={token}
      />
    </div>
  );
};
