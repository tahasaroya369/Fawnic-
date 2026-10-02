import React, { useState } from 'react';
import { X, RotateCcw, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { Order } from '../../types.js';

interface RequestReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  deliveredOrders: Order[];
  onOrderSelect?: (order: Order) => void;
  token: string | null;
  onSuccess: (updatedOrder: Order) => void;
}

const RETURN_REASONS = [
  'Size / Dimensions not as expected',
  'Leather texture or color difference from listing',
  'Received incorrect item or variation',
  'Manufacturing defect or stitching imperfection',
  'Damaged in transit by courier',
  'Quality does not meet expectation',
  'Change of mind / Other',
];

export const RequestReturnModal: React.FC<RequestReturnModalProps> = ({
  isOpen,
  onClose,
  order,
  deliveredOrders,
  onOrderSelect,
  token,
  onSuccess,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(order);
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedOrder(order || (deliveredOrders.length > 0 ? deliveredOrders[0] : null));
      setReason(RETURN_REASONS[0]);
      setDescription('');
      setErrorMsg(null);
      setSuccess(false);
    }
  }, [isOpen, order, deliveredOrders]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) {
      setErrorMsg('Please choose an eligible delivered order for return.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please provide a brief description explaining your return reason.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch(`/api/orders/${selectedOrder.id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: `${reason} - ${description.trim()}`,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok && data.order) {
        setSuccess(true);
        onSuccess(data.order);
      } else {
        setErrorMsg(data.error || 'Failed to submit return request. Please try again.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message || 'Connection error. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-[0_25px_60px_rgba(0,0,0,0.3)] my-8 overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif text-stone-950 dark:text-stone-50">
              Return Request Submitted
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
              Our Karachi Atelier concierge will review your claim within 24-48 hours. A reverse courier pickup will be scheduled upon approval.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>FAWNIC 7-Day Guarantee</span>
              </div>
              <h2 className="text-xl font-bold font-serif text-stone-950 dark:text-stone-50">
                Request an Item Return
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Submit an exchange or return claim for your delivered order.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Select Delivered Order */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  1. Select Delivered Order
                </label>
                {deliveredOrders.length === 0 ? (
                  <p className="text-stone-400 italic">No delivered orders found eligible for return.</p>
                ) : (
                  <select
                    value={selectedOrder?.id || ''}
                    onChange={(e) => {
                      const found = deliveredOrders.find((o) => o.id === e.target.value);
                      if (found) {
                        setSelectedOrder(found);
                        if (onOrderSelect) onOrderSelect(found);
                      }
                    }}
                    className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-medium cursor-pointer"
                  >
                    {deliveredOrders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        Order #{ord.orderNumber} (Rs. {ord.total.toLocaleString()} - {ord.items.map(i => i.name).join(', ')})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Order preview thumbnail */}
              {selectedOrder && selectedOrder.items.length > 0 && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-100 dark:border-stone-800 flex items-center gap-3">
                  <img
                    src={selectedOrder.items[0].image}
                    alt={selectedOrder.items[0].name}
                    className="w-12 h-12 rounded-lg object-cover bg-stone-100 dark:bg-stone-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                      {selectedOrder.items[0].name}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Rs. {selectedOrder.total.toLocaleString()} • Delivered
                    </p>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  2. Select Primary Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 cursor-pointer"
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  3. Description & Notes *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe why you are requesting a return and if you prefer a replacement or refund..."
                  rows={3}
                  required
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-stone-300"
                />
              </div>

              {/* Policy note */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl text-[11px] text-stone-500 leading-relaxed">
                Items must be unused in their original FAWNIC box with warranty tags attached. Courier reverse pick-up is free of charge for defective items.
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !selectedOrder}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Return Request</span>
                    <RotateCcw className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
