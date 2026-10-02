import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Ban,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  FileCheck2,
  AlertTriangle,
  Save,
  Maximize2,
} from 'lucide-react';
import type { Order } from '../../types.js';

interface PaymentVerificationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated: (updatedOrder: Order) => void;
  token: string | null;
}

export const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentUpdated,
  token,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Rejection sub-form
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    'Transaction reference (TID) could not be verified in Meezan Bank account statement or amount mismatch.'
  );

  // Status update form
  const [customStatus, setCustomStatus] = useState<string>('pending_verification');
  const [customVerificationNotes, setCustomVerificationNotes] = useState('');

  // Copy TID state
  const [copiedTid, setCopiedTid] = useState(false);

  // Lightbox Zoom state
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    if (order) {
      setCustomStatus(order.paymentStatus || 'pending');
      setCustomVerificationNotes(order.paymentVerificationNotes || order.paymentRejectionReason || '');
      setShowRejectForm(false);
      setErrorMessage('');
      setSuccessMessage('');
      setZoomScale(1);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const tid =
    order.bankTxRef ||
    order.transactionId ||
    order.transactionReference ||
    'Not Provided';

  const proofUrl = order.paymentProof || order.paymentProofUrl;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-PK', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  // Formatted shipping location
  let formattedLocation = 'Delivery address on file (Pakistan)';
  let cityStr = 'Pakistan';
  let provinceStr = 'PK';
  let postalCodeStr = '';

  if (typeof (order.shippingAddress as any) === 'string' && (order.shippingAddress as any).trim()) {
    formattedLocation = (order.shippingAddress as any).trim();
  } else if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    const s = order.shippingAddress as any;
    cityStr = s.city || cityStr;
    provinceStr = s.province || provinceStr;
    postalCodeStr = s.postalCode || '';
    const parts = [
      s.addressLine1 || s.streetAddress || s.houseNumber,
      s.addressLine2,
      s.landmark ? `Near ${s.landmark}` : null,
      s.area,
      s.city,
      s.province,
      s.postalCode ? `Postal: ${s.postalCode}` : null,
      'Pakistan',
    ].filter(Boolean);
    if (parts.length > 0) {
      formattedLocation = parts.join(', ');
    }
  }

  const handleCopyTid = () => {
    if (!tid || tid === 'Not Provided') return;
    navigator.clipboard?.writeText(tid);
    setCopiedTid(true);
    setTimeout(() => setCopiedTid(false), 2000);
  };

  const handleVerify = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const res = await fetch(`/api/admin/orders/${order.id}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'verify',
          notes: 'Bank transfer payment verified and authenticated against Meezan Bank statement.',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to verify payment');
      }

      setSuccessMessage('Payment marked as Verified & Paid. Order status set to Confirmed.');
      if (data.order) {
        onPaymentUpdated(data.order);
      }
      setTimeout(() => {
        setSuccessMessage('');
      }, 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while verifying payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const res = await fetch(`/api/admin/orders/${order.id}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'reject',
          reason: rejectReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to reject payment');
      }

      setShowRejectForm(false);
      setSuccessMessage('Payment marked as Rejected (Pending Action). Order record preserved.');
      if (data.order) {
        onPaymentUpdated(data.order);
      }
      setTimeout(() => {
        setSuccessMessage('');
      }, 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while rejecting payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomStatus = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const res = await fetch(`/api/admin/orders/${order.id}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update_status',
          paymentStatus: customStatus,
          paymentVerificationStatus: customStatus,
          notes: customVerificationNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to update payment status');
      }

      setSuccessMessage(`Payment status updated to "${customStatus}" successfully.`);
      if (data.order) {
        onPaymentUpdated(data.order);
      }
      setTimeout(() => {
        setSuccessMessage('');
      }, 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while updating payment verification status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-stone-50/80 dark:bg-zinc-900/60 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                Payment Verification • #{order.orderNumber}
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : order.paymentStatus === 'rejected' || order.paymentStatus === 'failed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                    : order.paymentStatus === 'pending_verification'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 animate-pulse'
                    : 'bg-stone-200 text-stone-700 dark:bg-zinc-800 dark:text-stone-300'
                }`}
              >
                {order.paymentStatus === 'paid'
                  ? '✓ Verified & Paid'
                  : order.paymentStatus === 'rejected' || order.paymentStatus === 'failed'
                  ? '✕ Payment Rejected (Action Required)'
                  : order.paymentStatus === 'pending_verification'
                  ? '⏳ Pending Verification'
                  : 'Pending Payment'}
              </span>
              <span className="text-[11px] font-serif uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-stone-300">
                Order: {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-2 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Order Date: <strong>{formatDate(order.createdAt)}</strong></span>
              {order.paymentProofSubmittedAt && (
                <>
                  <span>•</span>
                  <span>Proof Uploaded: <strong>{formatDate(order.paymentProofSubmittedAt)}</strong></span>
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Key Payment Badges & TID Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* TID Card */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-200 uppercase tracking-wider font-semibold">
                <span>Transaction ID / TID</span>
                <button
                  type="button"
                  onClick={handleCopyTid}
                  className="p-1 rounded hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition cursor-pointer flex items-center gap-1 text-[10px]"
                  title="Copy TID to clipboard"
                >
                  {copiedTid ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono font-bold text-stone-900 dark:text-stone-100 text-base break-all">
                {tid}
              </p>
              <p className="text-[10px] text-stone-500">
                Cross-check this TID in Meezan Bank Internet Banking.
              </p>
            </div>

            {/* Payment Method */}
            <div className="p-3.5 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl space-y-1">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold block">
                Payment Method
              </span>
              <p className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Direct Bank Transfer (IBFT)</span>
              </p>
              <p className="text-[10px] text-stone-500">
                Target: Meezan Bank • 28020115438839
              </p>
            </div>

            {/* Total Order Amount */}
            <div className="p-3.5 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl space-y-1">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold block">
                Total Order Amount
              </span>
              <p className="font-mono font-bold text-amber-600 dark:text-amber-400 text-lg">
                Rs. {(order.total ?? 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-stone-500">
                Subtotal: Rs. {(order.subtotal ?? 0).toLocaleString()}
                {order.discount ? ` • Disc: -Rs. ${order.discount.toLocaleString()}` : ''}
              </p>
            </div>
          </div>

          {/* Screenshot / Proof Image Section */}
          <div className="p-4 bg-stone-50 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider">
                  Payment Screenshot / Receipt Proof
                </h4>
              </div>

              {proofUrl && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setZoomScale(1);
                      setIsZoomOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom & Inspect</span>
                  </button>
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Tab</span>
                  </a>
                </div>
              )}
            </div>

            {proofUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-950 flex items-center justify-center min-h-[260px] max-h-[420px]">
                <img
                  src={proofUrl}
                  alt="Customer Bank Transfer Payment Proof"
                  className="w-full h-full object-contain max-h-[420px] transition cursor-zoom-in"
                  onClick={() => {
                    setZoomScale(1);
                    setIsZoomOpen(true);
                  }}
                />
                <div
                  onClick={() => {
                    setZoomScale(1);
                    setIsZoomOpen(true);
                  }}
                  className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-semibold cursor-zoom-in"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Click to Zoom & Inspect Proof</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-stone-100/50 dark:bg-zinc-950 rounded-xl border border-dashed border-stone-300 dark:border-zinc-800 text-stone-500 space-y-2">
                <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 opacity-80" />
                <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  No screenshot uploaded by customer.
                </p>
                <p className="text-[11px] text-stone-500 max-w-md mx-auto">
                  The customer submitted transaction reference TID: <strong className="font-mono text-stone-800 dark:text-stone-200">{tid}</strong> manually. You can still verify the TID against your Meezan Bank statement.
                </p>
              </div>
            )}
          </div>

          {/* Customer Profile & Shipping Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-serif font-bold text-[11px] uppercase tracking-wider">
                <User className="w-3.5 h-3.5" />
                <span>Customer Profile</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Name</span>
                <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                  {order.customerName || 'Valued Patron'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{order.customerEmail || 'No email specified'}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="font-mono font-semibold">{order.customerPhone || 'No phone'}</span>
              </div>
            </div>

            {/* Shipping Location */}
            <div className="p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-serif font-bold text-[11px] uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>Shipping Location</span>
              </div>
              <p className="font-semibold text-stone-900 dark:text-stone-100 leading-relaxed">
                {formattedLocation}
              </p>
              <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                <span>City: <strong className="text-stone-700 dark:text-stone-300">{cityStr}</strong></span>
                <span>•</span>
                <span>Province: <strong className="text-stone-700 dark:text-stone-300">{provinceStr}</strong></span>
                {postalCodeStr && (
                  <>
                    <span>•</span>
                    <span>Postal: <strong className="text-stone-700 dark:text-stone-300">{postalCodeStr}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ordered Products Table */}
          <div className="border border-stone-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-stone-50 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between text-xs font-serif font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Items in Order ({(order.items || []).length})</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                Total: Rs. {(order.total ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="divide-y divide-stone-200 dark:divide-zinc-800">
              {(order.items || []).map((it, idx) => {
                const img = it.productImage || it.image || '/fawnic-logo.jpg';
                const title = it.productName || it.name || 'Leather Article';
                const sku = it.sku || 'FWN-ART';
                const qty = it.quantity || 1;
                const unitPrice = it.price ?? it.unitPrice ?? 0;
                const sub = it.subtotal ?? it.total ?? (qty * unitPrice);

                return (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={img}
                        alt={title}
                        className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-zinc-800 bg-stone-100 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/fawnic-logo.jpg';
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-serif font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono mt-0.5">
                          <span>SKU: {sku}</span>
                          <span>•</span>
                          <span className="font-bold text-stone-700 dark:text-stone-300">Qty: {qty}</span>
                          {it.variantInfo && (
                            <>
                              <span>•</span>
                              <span>{it.variantInfo}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-stone-500 text-[11px]">
                        {qty} × Rs. {Number(unitPrice).toLocaleString()}
                      </p>
                      <p className="font-mono font-bold text-stone-900 dark:text-stone-100 text-xs">
                        Rs. {Number(sub).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Status & History Note if already verified or rejected */}
          {(order.paymentVerificationStatus || order.paymentVerifiedBy || order.paymentRejectionReason) && (
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-xs space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                Verification Audit Record
              </span>
              {order.paymentVerifiedBy && (
                <p className="text-stone-700 dark:text-stone-300">
                  Verified by: <strong>{order.paymentVerifiedBy}</strong> on {formatDate(order.paymentVerifiedAt)}
                </p>
              )}
              {order.paymentRejectionReason && (
                <p className="text-red-700 dark:text-red-400">
                  Rejection Reason: <strong>{order.paymentRejectionReason}</strong>
                </p>
              )}
              {order.paymentVerificationNotes && (
                <p className="text-stone-600 dark:text-stone-400">
                  Notes: {order.paymentVerificationNotes}
                </p>
              )}
            </div>
          )}

          {/* Rejection Form Drawer */}
          {showRejectForm && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-serif font-bold text-xs uppercase tracking-wider">
                  <Ban className="w-4 h-4" />
                  <span>Specify Reason for Rejecting Payment</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                The order will NOT be deleted. Its payment status will be updated to <strong>Rejected (Action Required)</strong>, allowing you to follow up with the customer or request a fresh payment proof.
              </p>

              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason for customer and timeline..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-red-300 dark:border-red-800 rounded-xl text-stone-900 dark:text-stone-100"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3.5 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReject}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Rejecting...' : 'Confirm Payment Rejection'}
                </button>
              </div>
            </div>
          )}

          {/* Add / Update Verification Status Drawer */}
          <div className="p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl space-y-3 text-xs">
            <span className="font-serif font-bold uppercase tracking-wider text-[11px] text-stone-800 dark:text-stone-200 block">
              Add / Update Payment Verification Status
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-stone-500 uppercase font-semibold mb-1">
                  Payment Verification Status
                </label>
                <select
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-stone-100 font-semibold"
                >
                  <option value="pending_verification">Pending Verification (Under Review)</option>
                  <option value="paid">Verified & Paid (Approved)</option>
                  <option value="rejected">Rejected (Action Required / Pending Resolution)</option>
                  <option value="pending">Pending Payment (Unpaid)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 uppercase font-semibold mb-1">
                  Verification Notes / Atelier Memo
                </label>
                <input
                  type="text"
                  value={customVerificationNotes}
                  onChange={(e) => setCustomVerificationNotes(e.target.value)}
                  placeholder="e.g. Verified against Meezan Bank statement ref 9281"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleUpdateCustomStatus}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Verification Status & Notes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-zinc-800 bg-stone-50/80 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>Current Status:</span>
            <strong className="capitalize text-stone-800 dark:text-stone-200">
              {order.paymentStatus.replace(/_/g, ' ')}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {order.paymentStatus !== 'paid' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleVerify}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-serif font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Mark as Verified</span>
              </button>
            )}

            {order.paymentStatus !== 'rejected' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowRejectForm(true)}
                className="px-4 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 text-xs font-serif font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>Mark as Rejected</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl hover:bg-stone-300 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Lightbox Modal */}
      {isZoomOpen && proofUrl && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-60 bg-stone-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          {/* Zoom controls header */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 inset-x-4 max-w-2xl mx-auto flex items-center justify-between p-3 rounded-2xl bg-stone-900/90 border border-stone-800 text-white z-10"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="font-serif font-bold">Screenshot Lightbox</span>
              <span className="text-stone-400 font-mono">TID: {tid}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(0.6, s - 0.25))}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-1">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(3, s + 0.25))}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1 text-xs px-2.5 font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Original</span>
              </a>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] overflow-auto rounded-2xl flex items-center justify-center p-2"
          >
            <img
              src={proofUrl}
              alt="Payment Screenshot Zoom"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
              className="max-h-[80vh] w-auto rounded-xl object-contain transition-transform duration-150"
            />
          </div>
        </div>
      )}
    </div>
  );
};
