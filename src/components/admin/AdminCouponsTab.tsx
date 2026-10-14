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
  AlertCircle,
  Loader2,
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
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadCoupons();
  }, [token]);

  const getAuthHeader = () => {
    const effectiveToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('fawnic_auth_token') || sessionStorage.getItem('fawnic_auth_token')
        : null);
    return effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};
  };

  const showNotice = (text: string, type: 'success' | 'error') => {
    setNotice({ text, type });
    setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/coupons', {
        headers: {
          'Cache-Control': 'no-cache',
          ...getAuthHeader(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      } else {
        const errData = await res.json().catch(() => ({}));
        showNotice(errData.error || 'Failed to load coupons from database', 'error');
      }
    } catch (err: any) {
      console.error('Failed to load coupons:', err);
      showNotice(err.message || 'Network error fetching coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    if (processingId) return; // Prevent duplicate requests
    const newStatus = !coupon.isActive;
    try {
      setProcessingId(coupon.id);
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Optimistically update local state immediately
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: newStatus } : c))
        );
        showNotice(
          data.message || `Coupon "${coupon.code}" ${newStatus ? 'activated' : 'deactivated'} successfully.`,
          'success'
        );
        // Refresh to confirm backend persistence
        await loadCoupons();
      } else {
        showNotice(data.error || 'Failed to update coupon status in database', 'error');
      }
    } catch (err: any) {
      console.error('Failed to toggle coupon:', err);
      showNotice(err.message || 'Error occurred while updating coupon status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (processingId) return; // Prevent duplicate requests
    if (!confirm(`Are you sure you want to permanently delete coupon "${coupon.code}"? This cannot be undone.`)) {
      return;
    }

    try {
      setProcessingId(coupon.id);
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Optimistically remove from state immediately
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
        showNotice(data.message || `Coupon "${coupon.code}" permanently deleted.`, 'success');
        // Refresh to confirm database sync
        await loadCoupons();
      } else {
        showNotice(data.error || 'Failed to delete coupon from database', 'error');
      }
    } catch (err: any) {
      console.error('Delete coupon failed:', err);
      showNotice(err.message || 'Error occurred while deleting coupon', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Feedback Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-150 ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-bold ml-2 text-sm leading-none"
          >
            ×
          </button>
        </div>
      )}

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || Boolean(processingId)}
            onClick={() => loadCoupons()}
            className="p-2 rounded-xl border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
            title="Refresh coupons from database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCoupon(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-serif uppercase tracking-widest font-bold rounded-xl hover:bg-amber-600 dark:hover:bg-amber-500 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Atelier Coupon</span>
          </button>
        </div>
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
            const exp = c.expiresAt || c.expiryDate;
            const isExpired = exp ? new Date(exp).getTime() < Date.now() : false;
            const isProcessingThis = processingId === c.id;

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
                    <p className="text-xs text-stone-500 mt-2 font-medium">
                      {c.type === 'percentage' || c.type === 'percent'
                        ? `${c.value}% Off Order`
                        : `Rs. ${Number(c.value).toLocaleString()} Flat Discount`}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(processingId)}
                    onClick={() => handleToggleActive(c)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      c.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-stone-200 dark:bg-zinc-800 text-stone-500 hover:bg-stone-300 dark:hover:bg-zinc-700'
                    }`}
                    title={c.isActive ? 'Click to deactivate coupon' : 'Click to activate coupon'}
                  >
                    {isProcessingThis ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : c.isActive ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    <span>
                      {isProcessingThis
                        ? 'Updating...'
                        : c.isActive
                        ? 'Active'
                        : 'Inactive'}
                    </span>
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
                        Rs. {Number(c.maxDiscount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Usage Count:</span>
                    <span className="font-mono text-stone-900 dark:text-stone-100">
                      {c.usedCount || 0} {c.usageLimit ? `/ ${c.usageLimit}` : 'times'}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Expires:</span>
                    <span className={isExpired ? 'text-rose-600 font-bold' : ''}>
                      {exp ? new Date(exp).toLocaleDateString('en-PK') : 'Never'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
                  <button
                    type="button"
                    disabled={Boolean(processingId)}
                    onClick={() => {
                      setEditingCoupon(c);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-amber-600 transition cursor-pointer disabled:opacity-50"
                    title="Edit coupon"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(processingId)}
                    onClick={() => handleDelete(c)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition cursor-pointer disabled:opacity-50"
                    title="Permanently delete coupon"
                  >
                    {isProcessingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
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
        onSuccess={() => {
          showNotice(
            editingCoupon
              ? `Coupon "${editingCoupon.code}" updated successfully.`
              : 'New coupon created successfully.',
            'success'
          );
          loadCoupons();
        }}
        token={token}
      />
    </div>
  );
};
