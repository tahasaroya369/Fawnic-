import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, ShoppingBag, Clock, DollarSign, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { CustomerCRM, Order } from '../../types.js';

interface CustomerDetailModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onViewOrder: (order: Order) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customerId,
  isOpen,
  onClose,
  token,
  onViewOrder,
}) => {
  const [customer, setCustomer] = useState<CustomerCRM | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !customerId || !token) {
      setCustomer(null);
      return;
    }

    async function loadCustomer() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: CustomerCRM = await res.json();
          setCustomer(data);
          setNotes(data.notes || '');
        }
      } catch (err) {
        console.error('Failed to load customer profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [isOpen, customerId, token]);

  if (!isOpen) return null;

  const handleSaveNotes = async () => {
    if (!customer) return;
    try {
      setIsSavingNotes(true);
      const res = await fetch(`/api/admin/customers/${customer.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const isVip = (customer?.totalSpent || 0) > 25000;
  const aov = customer && customer.ordersCount > 0 ? Math.round(customer.totalSpent / customer.ordersCount) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-stone-200 dark:border-zinc-800 shrink-0">
              <img
                src={customer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                alt={customer?.name || 'Customer'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  {customer?.name || 'Customer Profile'}
                </h3>
                {isVip && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    VIP Member
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Member since {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' }) : '2024'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-serif text-stone-500">Retrieving customer atelier records...</p>
          </div>
        ) : customer ? (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">Total Spend</span>
                <p className="font-serif font-bold text-lg text-amber-600 dark:text-amber-400 mt-1">
                  Rs. {customer.totalSpent.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">Orders Placed</span>
                <p className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mt-1">
                  {customer.ordersCount}
                </p>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">Average Order Value</span>
                <p className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mt-1">
                  Rs. {aov.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Contact details */}
            <div className="p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-stone-700 dark:text-stone-300">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-mono text-stone-700 dark:text-stone-300">{customer.phone}</span>
              </div>
            </div>

            {/* Saved Addresses */}
            {customer.addresses && customer.addresses.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-serif font-bold tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Saved Addresses ({customer.addresses.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customer.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-3 text-xs bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl"
                    >
                      <p className="font-semibold text-stone-900 dark:text-stone-100">
                        {addr.label.toUpperCase()} {addr.isDefault && '• (Default)'}
                      </p>
                      <p className="text-stone-600 dark:text-stone-400 mt-1">
                        {addr.houseNumber} {addr.streetAddress}, {addr.area}
                      </p>
                      <p className="text-stone-500">
                        {addr.city}, {addr.province}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Internal CRM Concierge Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase font-serif font-bold tracking-wider text-stone-700 dark:text-stone-300">
                  Concierge Notes (Atelier Staff Only)
                </label>
                {savedSuccess && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Notes Saved
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record customer preferences (e.g., prefers vegetable-tanned leather, gift box packaging, custom initials)..."
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-4 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold rounded-lg hover:bg-amber-600 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                </button>
              </div>
            </div>

            {/* Orders History Table */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-serif font-bold tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>Order History ({customer.orders?.length || 0})</span>
              </h4>

              {customer.orders && customer.orders.length > 0 ? (
                <div className="border border-stone-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Order</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Items</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
                      {customer.orders.map((o) => (
                        <tr key={o.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-900/50">
                          <td className="px-4 py-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                            #{o.orderNumber}
                          </td>
                          <td className="px-4 py-3 text-stone-500">
                            {new Date(o.createdAt).toLocaleDateString('en-PK')}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-stone-200 dark:bg-zinc-800">
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                            {o.items.length} item{o.items.length > 1 ? 's' : ''}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                            Rs. {o.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onViewOrder(o);
                              }}
                              className="text-xs font-semibold text-amber-600 hover:underline"
                            >
                              Inspect →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-stone-500 py-4 text-center">No orders found for this customer.</p>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end px-6 py-3 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
