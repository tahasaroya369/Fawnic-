import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Truck,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Calendar,
  DollarSign,
  Building2,
  ExternalLink,
  ImageIcon,
  Check,
  Ban,
  FileCheck2,
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types.js';
import { PaymentVerificationModal } from './PaymentVerificationModal.js';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order) => void;
  token: string | null;
  onViewInvoice: (order: Order) => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Atelier Crafting' },
  { key: 'packed', label: 'Packed & Inspected' },
  { key: 'dispatched', label: 'Dispatched / Courier' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const COURIERS = [
  'TCS Express',
  'Leopards Courier',
  'Trax Logistics',
  'M&P Express',
  'Rider Courier',
  'PostEx',
  'Atelier Concierge / Self Dispatch',
];

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
  token,
  onViewInvoice,
}) => {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('pending');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'pending_verification' | 'paid' | 'failed' | 'rejected' | 'refunded'>('pending');
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [courierName, setCourierName] = useState('TCS Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Transaction reference not found in bank statement or proof unreadable.');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const formatDateSafe = (d?: string) => {
    if (!d) return 'Recent';
    try {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return String(d);
      return parsed.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return 'Recent';
    }
  };

  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status || 'pending');
      setPaymentStatus((order.paymentStatus as any) || 'pending');
      setCourierName(order.courierName || order.courier || 'TCS Express');
      setTrackingNumber(order.trackingNumber || '');
      setDispatchDate(order.dispatchDate || '');
      setExpectedDelivery(order.expectedDelivery || '');
      setInternalNotes(order.internalNotes || '');
      setCustomerNotes(order.notes || '');
      setSaveMessage('');
      setErrorMessage('');
      setShowRejectModal(false);
    }
  }, [order]);

  const handleVerifyPayment = async (action: 'approve' | 'reject', reason?: string) => {
    if (!order) return;
    try {
      setVerifyingPayment(true);
      setErrorMessage('');
      const res = await fetch(`/api/admin/orders/${order.id}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, reason }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to verify payment');
      }

      if (data.order) {
        onOrderUpdated(data.order);
        setPaymentStatus(data.order.paymentStatus);
        setCurrentStatus(data.order.status);
      }
      setShowRejectModal(false);
      setSaveMessage(`Payment ${action === 'approve' ? 'approved & marked Verified Paid' : 'marked Rejected'} successfully.`);
      setTimeout(() => setSaveMessage(''), 3500);
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setErrorMessage('Error updating payment: ' + (err?.message || 'Network error'));
    } finally {
      setVerifyingPayment(false);
    }
  };

  if (!isOpen || !order) return null;

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setSaveMessage('');
      setErrorMessage('');

      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: currentStatus,
          paymentStatus,
          courierName,
          trackingNumber,
          dispatchDate,
          expectedDelivery,
          internalNotes,
          notes: customerNotes,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update order');
      }

      const updated = await res.json();
      onOrderUpdated(updated);
      setSaveMessage('Order updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      console.error('Order update error:', err);
      setErrorMessage('Error updating order: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  let fullAddress = '';
  let cityDisplay = 'Pakistan';
  let provinceDisplay = 'PK';
  let postalCodeDisplay = '';

  if (typeof (order.shippingAddress as any) === 'string' && (order.shippingAddress as any).trim()) {
    fullAddress = (order.shippingAddress as any).trim();
  } else if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    const s = order.shippingAddress as any;
    cityDisplay = s.city || cityDisplay;
    provinceDisplay = s.province || provinceDisplay;
    postalCodeDisplay = s.postalCode || '';
    const parts = [
      s.fullName || s.recipientName || order.customerName,
      s.addressLine1 || s.streetAddress || s.houseNumber,
      s.addressLine2,
      s.landmark ? `Near: ${s.landmark}` : null,
      s.area,
      s.city,
      s.province,
      s.postalCode,
    ].filter(Boolean);
    fullAddress = parts.join(', ');
  }

  if (!fullAddress && (order as any).customerAddress) {
    fullAddress = String((order as any).customerAddress);
  }
  if (!fullAddress) {
    fullAddress = 'Address details on file';
  }

  const isBankTransfer = order?.paymentMethod === 'bank_transfer' || order?.paymentMethod === 'ibft';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  Order #{order.orderNumber || '0000'}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-stone-300">
                  {order.status || 'pending'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Placed on {formatDateSafe(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewInvoice(order)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-serif tracking-wider font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Official Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Status & Payment Controllers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Order Fulfillment Status
              </label>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              >
                {STATUS_STEPS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label} ({s.key})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Payment Status ({order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Direct Bank Transfer (Meezan Bank)'})
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              >
                <option value="pending">Pending (Unpaid)</option>
                <option value="pending_verification">Pending Verification (Bank Transfer / Proof Uploaded)</option>
                <option value="paid">Paid (Verified in Bank / COD Collected)</option>
                <option value="rejected">Rejected (Action Required / Pending Resolution)</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Payment Information Section (Prominent for all orders) */}
          <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-serif font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Payment Information
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : paymentStatus === 'rejected' || paymentStatus === 'failed'
                      ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                      : paymentStatus === 'pending_verification'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                      : 'bg-stone-200 text-stone-700 dark:bg-zinc-800 dark:text-stone-300'
                  }`}
                >
                  {paymentStatus === 'paid'
                    ? '✓ Payment Verified & Paid'
                    : paymentStatus === 'rejected' || paymentStatus === 'failed'
                    ? '✕ Payment Rejected (Action Required)'
                    : paymentStatus === 'pending_verification'
                    ? '⏳ Pending Verification'
                    : 'Pending Payment'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-amber-500/20">
                <span className="text-[10px] text-stone-500 block uppercase tracking-wider">Payment Method</span>
                <span className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm mt-0.5 block">
                  {order.paymentMethod === 'cod'
                    ? 'Cash on Delivery (COD)'
                    : 'Direct Bank Transfer (Meezan Bank)'}
                </span>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-amber-500/20">
                <span className="text-[10px] text-stone-500 block uppercase tracking-wider">
                  {isBankTransfer ? 'Transaction ID (TID)' : 'Billing Type'}
                </span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm mt-0.5 block break-all">
                  {isBankTransfer
                    ? (order.bankTxRef || order.transactionReference || 'Not provided')
                    : 'Pay on Doorstep Delivery'}
                </span>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-amber-500/20">
                <span className="text-[10px] text-stone-500 block uppercase tracking-wider">Payable Amount</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5 block">
                  Rs. {(order.total ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bank Transfer Specific Details: Screenshot Proof & Verification Actions */}
            {isBankTransfer ? (
              <div className="space-y-4 pt-1">
                {/* Uploaded Receipt / Payment Proof */}
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-amber-500/20">
                  <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 block mb-2">
                    Customer Uploaded Payment Proof (Screenshot)
                  </span>
                  {order.paymentProof || order.paymentProofUrl ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div
                        onClick={() => setZoomedImage(order.paymentProof || order.paymentProofUrl || null)}
                        className="group relative block rounded-lg overflow-hidden border border-stone-200 dark:border-zinc-800 cursor-pointer"
                      >
                        <img
                          src={order.paymentProof || order.paymentProofUrl}
                          alt="Payment Receipt"
                          className="w-40 h-28 object-cover group-hover:scale-105 transition duration-200 bg-stone-100"
                        />
                        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Zoom Proof</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                        <p className="font-semibold text-stone-800 dark:text-stone-200">
                          Payment receipt screenshot attached by patron
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Inspect the Meezan Bank transaction receipt screenshot to verify TID matches bank statement.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setZoomedImage(order.paymentProof || order.paymentProofUrl || null)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] transition cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Zoom Screenshot</span>
                          </button>
                          <a
                            href={order.paymentProof || order.paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-800 dark:text-stone-200 font-semibold text-[11px] transition"
                          >
                            <span>Open Tab</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-stone-50 dark:bg-zinc-950 rounded-lg text-center text-stone-500 text-xs">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <span>No screenshot image provided. Customer entered reference: {order.bankTxRef || order.transactionReference || 'None'}</span>
                    </div>
                  )}
                </div>

                {/* Quick Approval / Rejection Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPaymentProofModal(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-serif font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Open Payment Proof Inspector</span>
                  </button>

                  {paymentStatus !== 'paid' && (
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment('approve')}
                      disabled={verifyingPayment}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-serif font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Verify</span>
                    </button>
                  )}

                  {paymentStatus !== 'rejected' && paymentStatus !== 'failed' && (
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      disabled={verifyingPayment}
                      className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 text-xs font-serif font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 border border-red-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Reject Payment</span>
                    </button>
                  )}
                </div>

                {/* Rejection Reason Sub-Modal / Drawer */}
                {showRejectModal && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-xs text-red-900 dark:text-red-200 uppercase tracking-wider">
                        Specify Payment Rejection Reason
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(false)}
                        className="text-stone-400 hover:text-stone-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Transaction reference not found in Meezan Bank account statement."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-red-300 dark:border-red-800 rounded-lg text-stone-900 dark:text-stone-100"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(false)}
                        className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={verifyingPayment}
                        onClick={() => handleVerifyPayment('reject', rejectionReason)}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        {verifyingPayment ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-amber-500/20 text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between">
                <span>
                  Cash on Delivery (COD): Consignment courier (TCS/Leopards) will collect <strong>Rs. {(order.total ?? 0).toLocaleString()}</strong> upon delivery.
                </span>
                {paymentStatus !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStatus('paid');
                      handleSaveChanges();
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg transition cursor-pointer"
                  >
                    Mark COD Collected
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pakistan Logistics & Courier Assignment */}
          <div className="p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Truck className="w-4 h-4" />
              <span>Courier & Consignment Tracking (Pakistan)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-stone-500 font-semibold mb-1">Courier Partner</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded focus:ring-1 focus:ring-amber-500"
                >
                  {COURIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 font-semibold mb-1">Tracking / CN Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 7829104839"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 font-semibold mb-1">Dispatch Date</label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 font-semibold mb-1">Expected Delivery</label>
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Customer & Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 bg-stone-50 dark:bg-zinc-900/40 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs">
              <h4 className="font-serif font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Customer Profile</span>
              </h4>
              <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm">{order.customerName || 'Valued Patron'}</p>
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>{order.customerEmail || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono">{order.customerPhone || 'No phone'}</span>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-stone-50 dark:bg-zinc-900/40 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs">
              <h4 className="font-serif font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Shipping Address</span>
              </h4>
              <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                {fullAddress || 'Address on file'}
              </p>
              <p className="text-stone-500">
                City: <span className="font-semibold text-stone-700 dark:text-stone-300">{cityDisplay}</span> • Province:{' '}
                <span className="font-semibold text-stone-700 dark:text-stone-300">{provinceDisplay}</span>
              </p>
              {postalCodeDisplay && (
                <p className="text-stone-500">Postal Code: {postalCodeDisplay}</p>
              )}
            </div>
          </div>

          {/* Ordered Products Table */}
          <div className="border border-stone-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-stone-50 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 text-xs font-serif font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              Items in Order ({(order.items || []).length})
            </div>
            <div className="divide-y divide-stone-200 dark:divide-zinc-800">
              {(order.items || []).map((it: any, idx: number) => {
                const name = it.name || it.productName || 'Bespoke Leather Article';
                const image = it.image || it.productImage || '/fawnic-logo.jpg';
                const qty = it.quantity || 1;
                const unitPrice = it.price ?? it.unitPrice ?? 0;
                const lineTotal = it.subtotal ?? it.total ?? (qty * unitPrice);

                return (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={image}
                        alt={name}
                        className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-zinc-800 shrink-0 bg-stone-100 dark:bg-zinc-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/fawnic-logo.jpg';
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-serif font-semibold text-stone-900 dark:text-stone-100 truncate">{name}</p>
                        {(it.selectedColor || it.selectedVariation?.color || (it.selectedVariation && it.selectedVariation.type !== 'size' && !it.selectedVariation.size && it.selectedVariation.name)) && (
                          <p className="text-amber-800 dark:text-amber-400 font-semibold text-[11px]">
                            Color: {it.selectedColor || it.selectedVariation?.color || it.selectedVariation?.name}
                          </p>
                        )}
                        {(it.selectedSize || it.selectedVariation?.size || (it.selectedVariation && it.selectedVariation.type === 'size' && it.selectedVariation.name)) && (
                          <p className="text-stone-700 dark:text-stone-300 font-semibold text-[11px]">
                            Size: {it.selectedSize || it.selectedVariation?.size || it.selectedVariation?.name}
                          </p>
                        )}
                        {!it.selectedColor && !it.selectedSize && !it.selectedVariation && it.variantInfo && (
                          <p className="text-amber-800 dark:text-amber-400 font-semibold text-[11px]">
                            {it.variantInfo}
                          </p>
                        )}
                        <p className="text-stone-500 font-mono text-[11px]">SKU: {it.selectedVariation?.sku || it.sku || 'FWN-ART'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-stone-500">
                        {qty} × Rs. {Number(unitPrice || 0).toLocaleString()}
                      </p>
                      <p className="font-mono font-bold text-stone-900 dark:text-stone-100">
                        Rs. {Number(lineTotal || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Breakdown Footer */}
            <div className="p-4 bg-stone-50 dark:bg-zinc-900/60 border-t border-stone-200 dark:border-zinc-800 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Subtotal:</span>
                  <span className="font-mono">Rs. {Number(order.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Shipping Fee:</span>
                  <span className="font-mono">
                    {Number(order.shippingFee || 0) === 0 ? 'FREE' : `Rs. ${Number(order.shippingFee || 0).toLocaleString()}`}
                  </span>
                </div>
                {Boolean(order.discount && Number(order.discount) > 0) && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">-Rs. {Number(order.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-serif font-bold text-sm pt-2 border-t border-stone-300 dark:border-zinc-700 text-stone-900 dark:text-stone-100">
                  <span>Total (PKR):</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    Rs. {Number(order.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Notes & Customer Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Internal Atelier Notes (Staff Only)
              </label>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add private craftsman note, inspection details, or special requests..."
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Customer Delivery Instructions
              </label>
              <textarea
                rows={3}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Notes provided by customer at checkout..."
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Order Timeline History */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Order Timeline & Audit History</span>
              </div>
              <div className="space-y-2 text-xs">
                {order.timeline.map((evt, i) => (
                  <div key={i} className="flex items-start gap-3 py-1 border-l-2 border-amber-500 pl-3">
                    <div>
                      <p className="font-semibold text-stone-800 dark:text-stone-200">
                        Status: <span className="font-mono uppercase text-amber-600 dark:text-amber-400">{evt.status}</span>
                      </p>
                      {evt.note && <p className="text-stone-500 text-[11px] mt-0.5">{evt.note}</p>}
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {formatDateSafe(evt.timestamp)} • By {evt.updatedBy || 'Staff'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg transition"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-6 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-serif uppercase tracking-widest font-bold rounded-xl hover:bg-amber-600 dark:hover:bg-amber-500 transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Order Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Image Zoom Lightbox Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-stone-950 p-2 rounded-2xl border border-stone-800 shadow-2xl overflow-hidden"
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImage}
              alt="Payment Screenshot Zoom"
              className="max-h-[85vh] w-auto mx-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
      {/* Dedicated Bank Transfer Payment Verification Modal */}
      <PaymentVerificationModal
        order={order}
        isOpen={showPaymentProofModal}
        onClose={() => setShowPaymentProofModal(false)}
        onPaymentUpdated={(updated) => {
          onOrderUpdated(updated);
          setPaymentStatus(updated.paymentStatus as any);
          setCurrentStatus(updated.status);
        }}
        token={token}
      />
    </div>
  );
};
