import React, { useState } from 'react';
import {
  X,
  Package,
  MapPin,
  Printer,
  RotateCcw,
  Clock,
  CheckCircle2,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  History,
  Copy,
  Check,
  Navigation,
} from 'lucide-react';
import type { Order } from '../../types.js';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onPrintInvoice: (order: Order) => void;
  onCancelOrder?: (orderId: string) => void;
  onRequestReturn?: (order: Order) => void;
}

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Order Confirmed', icon: ShieldCheck },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'ready', label: 'Ready to Dispatch', icon: ShieldCheck },
  { key: 'dispatched', label: 'Dispatched', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onPrintInvoice,
  onCancelOrder,
  onRequestReturn,
}) => {
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  if (!order) return null;

  // Determine active step index for progress tracker
  const getStepIndex = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'processing':
        return 2;
      case 'packed':
      case 'ready':
      case 'ready_to_dispatch':
        return 3;
      case 'dispatched':
      case 'shipped':
      case 'in_transit':
        return 4;
      case 'out_for_delivery':
        return 5;
      case 'delivered':
      case 'completed':
        return 6;
      default:
        return 0;
    }
  };

  const isCancelled = order.status === 'cancelled';
  const currentStep = isCancelled ? -1 : getStepIndex(order.status);
  const hasTrackingInfo = Boolean(
    order.trackingNumber ||
    order.courier ||
    order.courierName ||
    order.dispatchDate ||
    order.expectedDelivery ||
    order.estimatedDelivery ||
    order.deliveryDate
  );

  const trackingHistory = (order.timeline && order.timeline.length > 0)
    ? order.timeline
    : (order.trackingHistory && order.trackingHistory.length > 0)
    ? order.trackingHistory
    : [
        {
          status: order.status,
          timestamp: order.createdAt,
          updatedBy: 'System',
          note: 'Order placed by customer',
          location: order.shippingAddress?.city ? `${order.shippingAddress.city}, Pakistan` : 'Karachi, Pakistan',
        },
      ];

  const handleCopyTracking = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-[0_25px_60px_rgba(0,0,0,0.3)] my-6 sm:my-8 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold font-serif text-stone-950 dark:text-stone-50">
                Order #{order.orderNumber}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                  isCancelled
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : order.status === 'delivered'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintInvoice(order)}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
              title="Print / View Invoice"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[calc(85vh-110px)] overflow-y-auto">
          
          {/* Visual Order Timeline */}
          {isCancelled ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-xs text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">This consignment has been cancelled</p>
                <p className="text-rose-600 dark:text-rose-400 text-[11px] mt-0.5">
                  No payment was charged, or any prepaid amount has been queued for immediate reversal.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block">
                  Live Order Status & Timeline
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold capitalize flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Mobile Vertical Timeline (sm:hidden) */}
              <div className="sm:hidden space-y-0 relative pl-1 py-1">
                {TIMELINE_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  const isLast = idx === TIMELINE_STEPS.length - 1;

                  return (
                    <div key={step.key} className="relative flex items-start gap-3 pb-4 last:pb-0">
                      {!isLast && (
                        <div
                          className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${
                            idx < currentStep ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-700'
                          }`}
                        />
                      )}
                      <div
                        className={`relative z-10 w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-400'
                        } ${isCurrent ? 'ring-4 ring-emerald-100 dark:ring-emerald-950 scale-105' : ''}`}
                      >
                        {isDone && !isCurrent ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p
                          className={`text-xs ${
                            isCurrent
                              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                              : isDone
                              ? 'text-stone-900 dark:text-stone-100 font-semibold'
                              : 'text-stone-400'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Horizontal Progress Bar (hidden sm:block) */}
              <div className="hidden sm:block relative pt-2 pb-1 overflow-x-auto">
                <div className="min-w-[500px] relative">
                  {/* Progress Line */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-stone-200 dark:bg-stone-700 z-0" />
                  <div
                    className="absolute top-4 left-4 h-0.5 bg-emerald-600 transition-all duration-500 z-0"
                    style={{
                      width: `${(currentStep / (TIMELINE_STEPS.length - 1)) * 95}%`,
                    }}
                  />

                  <div className="relative z-10 flex items-start justify-between">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isDone = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center w-16">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-400'
                            } ${isCurrent ? 'ring-4 ring-emerald-100 dark:ring-emerald-950 scale-110' : ''}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span
                            className={`mt-2 text-[10px] leading-tight ${
                              isCurrent
                                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                                : isDone
                                ? 'text-stone-900 dark:text-stone-100 font-semibold'
                                : 'text-stone-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Details Card (Requirement 12) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-700/60 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                <Truck className="w-4 h-4 text-amber-600" />
                <span className="text-xs uppercase tracking-wider">Consignment Tracking Details</span>
              </div>
              {order.updatedAt && (
                <span className="text-[11px] text-stone-400">
                  Last Updated: {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {hasTrackingInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Current Status */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                    Current Status
                  </span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100 capitalize text-xs">
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Tracking Number */}
                {order.trackingNumber && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                      Tracking / Consignment #
                    </span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-stone-900 dark:text-stone-100">
                      <span>{order.trackingNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyTracking(order.trackingNumber!)}
                        className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded transition"
                        title="Copy tracking number"
                      >
                        {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Courier / Delivery Partner */}
                {(order.courier || order.courierName) && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                      Courier Partner
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                      {order.courier || order.courierName}
                    </span>
                  </div>
                )}

                {/* Estimated Delivery */}
                {(order.expectedDelivery || order.estimatedDelivery) && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                      Estimated Delivery
                    </span>
                    <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{order.expectedDelivery || order.estimatedDelivery}</span>
                    </div>
                  </div>
                )}

                {/* Dispatch Date */}
                {order.dispatchDate && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                      Dispatch Date
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                      {order.dispatchDate}
                    </span>
                  </div>
                )}

                {/* Delivery Date */}
                {order.deliveryDate && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                      Delivery Date
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                      {order.deliveryDate}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-stone-100/70 dark:bg-stone-800/70 rounded-xl text-stone-500 dark:text-stone-400 text-xs leading-relaxed">
                Tracking information will appear here once your order has been dispatched.
              </div>
            )}
          </div>

          {/* Tracking Event History (Requirement 15) */}
          {trackingHistory.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                  <History className="w-4 h-4 text-stone-500" />
                  <span>Tracking Milestone History</span>
                </div>
                {trackingHistory.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowFullHistory(!showFullHistory)}
                    className="text-[11px] text-amber-600 hover:underline font-semibold"
                  >
                    {showFullHistory ? 'Show Less' : `View All (${trackingHistory.length})`}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {(showFullHistory ? [...trackingHistory].reverse() : [...trackingHistory].reverse().slice(0, 3)).map((ev, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      idx === 0
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-100">
                        {idx === 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping mr-0.5" />}
                        <span className="capitalize">{ev.status.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(ev.timestamp).toLocaleString('en-PK', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {ev.note && (
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                        {ev.note}
                      </p>
                    )}

                    {ev.location && (
                      <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-1">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{ev.location}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold mb-1">
                <MapPin className="w-4 h-4 text-stone-500" />
                <span>Shipping Destination</span>
              </div>
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                {order.shippingAddress.fullName || order.customerName}
              </p>
              <p className="text-stone-500 dark:text-stone-400">
                {order.shippingAddress.addressLine1 || order.shippingAddress.streetAddress || ''}
                {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
              </p>
              <p className="text-stone-500 dark:text-stone-400">
                {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode ? `- ${order.shippingAddress.postalCode}` : ''}
              </p>
              <p className="text-stone-600 dark:text-stone-300 font-mono text-[11px]">
                {order.shippingAddress.phone || order.customerPhone}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 text-xs space-y-2">
              <div className="text-stone-900 dark:text-stone-100 font-bold mb-1">
                Payment & Billing
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Payment Method:</span>
                <span className="font-bold text-stone-900 dark:text-stone-100 uppercase">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Payment Status:</span>
                <span className="font-bold text-stone-900 dark:text-stone-100 capitalize">
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Courier Service:</span>
                <span className="font-semibold text-emerald-600">
                  {order.courier || order.courierName || 'Insured Delivery'}
                </span>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
              Items Ordered ({order.items.length})
            </span>
            <div className="divide-y divide-stone-100 dark:divide-stone-800 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={item.id || `${item.productId || 'modal_it'}_${idx}`} className="p-3.5 flex items-center gap-3 text-xs">
                  <img
                    src={item.image || item.productImage}
                    alt={item.name || item.productName}
                    className="w-14 h-14 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-100 dark:border-stone-800"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                      {item.name || item.productName}
                    </p>
                    {(item.selectedColor || item.selectedVariation?.color || (item.selectedVariation && item.selectedVariation.type !== 'size' && !item.selectedVariation.size && item.selectedVariation.name)) && (
                      <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400">
                        Color: {item.selectedColor || item.selectedVariation?.color || item.selectedVariation?.name}
                      </p>
                    )}
                    {(item.selectedSize || item.selectedVariation?.size || (item.selectedVariation && item.selectedVariation.type === 'size' && item.selectedVariation.name)) && (
                      <p className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                        Size: {item.selectedSize || item.selectedVariation?.size || item.selectedVariation?.name}
                      </p>
                    )}
                    {!item.selectedColor && !item.selectedSize && !item.selectedVariation && item.variantInfo && (
                      <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400">
                        {item.variantInfo}
                      </p>
                    )}
                    <p className="text-[10px] text-stone-400 font-mono">
                      SKU: {item.selectedVariation?.sku || item.sku || 'FWN-ART'}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Qty: {item.quantity} × Rs. {(item.price || item.unitPrice).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-serif font-bold text-stone-950 dark:text-stone-50 text-xs">
                    Rs. {(item.subtotal || item.total || (item.quantity * (item.price || item.unitPrice))).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span>Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            {order.discountAmount && order.discountAmount > 0 ? (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Savings</span>
                <span>- Rs. {order.discountAmount.toLocaleString()}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-stone-500">
              <span>Nationwide Courier Shipping</span>
              <span>
                {order.shippingFee === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE</span>
                ) : (
                  `Rs. ${order.shippingFee.toLocaleString()}`
                )}
              </span>
            </div>
            <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between font-bold text-stone-950 dark:text-stone-50 text-sm">
              <span>Total Paid / Payable</span>
              <span className="font-serif">Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              {order.returnRequested && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Return Request: {order.returnStatus}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {order.status === 'pending' && onCancelOrder && (
                <button
                  onClick={() => {
                    onCancelOrder(order.id);
                    onClose();
                  }}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel Order
                </button>
              )}

              {order.status === 'delivered' && !order.returnRequested && onRequestReturn && (
                <button
                  onClick={() => {
                    onRequestReturn(order);
                    onClose();
                  }}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Request 7-Day Return
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

