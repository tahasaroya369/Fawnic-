import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Package,
  Printer,
  Truck,
  ArrowRight,
  Store,
  MapPin,
  Calendar,
  Building,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { InvoiceModal } from '../components/common/InvoiceModal.js';
import type { Order } from '../types.js';

interface OrderSuccessPageProps {
  order?: Order | string | null;
  onNavigate: (route: string, param?: any) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ order: initialOrder, onNavigate }) => {
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(() => {
    if (initialOrder && typeof initialOrder === 'object' && initialOrder.orderNumber) {
      return initialOrder;
    }
    // Try to load from session or local storage
    try {
      const stored = sessionStorage.getItem('fawnic_last_order') || localStorage.getItem('fawnic_last_order');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.orderNumber) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialOrder && typeof initialOrder === 'object' && initialOrder.orderNumber) {
      setCurrentOrder(initialOrder);
      return;
    }

    // If initialOrder is a string (e.g. order number passed via route param #order-success/FWN-12345)
    if (typeof initialOrder === 'string' && initialOrder.trim()) {
      setLoading(true);
      fetch(`/api/orders/${encodeURIComponent(initialOrder.trim())}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Not found');
        })
        .then((data) => {
          if (data && data.orderNumber) {
            setCurrentOrder(data);
          }
        })
        .catch(() => {
          // fallback gracefully
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [initialOrder]);

  // Fallback state if order is completely undefined or unavailable
  if (!currentOrder && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-stone-100">
            Order Confirmation
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            No active order was found in your current browser session. If you recently placed an order, our atelier is already preparing it. You can check all your past orders, real-time tracking, and invoices in your customer portal.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onNavigate('shop')}
            className="w-full sm:w-auto px-6 py-3 bg-amber-800 hover:bg-amber-700 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => onNavigate('profile', { tab: 'orders' })}
            className="w-full sm:w-auto px-6 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            View Customer Portal & Orders
          </button>
        </div>
      </div>
    );
  }

  if (loading || !currentOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500">Retrieving your atelier order confirmation...</p>
      </div>
    );
  }

  const shipping = currentOrder.shippingAddress || ({} as any);
  const orderNumber = currentOrder.orderNumber || 'FWN-ORDER';
  const totalFormatted = typeof currentOrder.total === 'number' ? currentOrder.total.toLocaleString() : '0';
  const subtotalFormatted = typeof currentOrder.subtotal === 'number' ? currentOrder.subtotal.toLocaleString() : '0';
  const shippingFeeFormatted = typeof currentOrder.shippingFee === 'number' ? currentOrder.shippingFee.toLocaleString() : '0';
  const discountFormatted = typeof currentOrder.discount === 'number' && currentOrder.discount > 0 ? currentOrder.discount.toLocaleString() : null;

  const isBankTransfer = currentOrder.paymentMethod === 'bank_transfer';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Header - Dynamically customized for Bank Transfer vs COD */}
      {isBankTransfer ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-serif text-stone-950 dark:text-stone-50">
            Payment Proof Received
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-lg mx-auto leading-relaxed">
            Your order has been received. We are checking your payment details and will update your order shortly.
          </p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-bold font-serif text-stone-950 dark:text-stone-50">
            Shukriya! Your Order is Confirmed
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
            Order ref: <strong className="text-stone-900 dark:text-stone-100 font-mono">#{orderNumber}</strong> has been received by FAWNIC Leather Atelier for craftsmanship review and immediate packaging.
          </p>
        </div>
      )}

      {/* Primary Details Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Order Number
            </span>
            <p className="text-lg font-bold font-mono text-stone-950 dark:text-stone-50">
              #{orderNumber}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Payment Method
            </span>
            <p className="text-sm font-semibold capitalize text-stone-900 dark:text-stone-100">
              {currentOrder.paymentMethod === 'cod'
                ? 'Cash on Delivery (COD)'
                : 'Direct Bank Transfer (Meezan Bank)'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Payment Status
            </span>
            <div>
              {isBankTransfer ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Pending Verification
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Confirmed (COD)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Total Amount
            </span>
            <p className="text-lg font-bold font-serif text-emerald-700 dark:text-emerald-400">
              Rs. {totalFormatted}
            </p>
          </div>

          <div>
            <button
              onClick={() => setShowInvoice(true)}
              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> View / Print Tax Invoice
            </button>
          </div>
        </div>

        {/* Bank Transfer Specific Info Box */}
        {isBankTransfer && (
          <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
                <h4 className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                  Bank Transfer Verification Summary
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                Pending Verification
              </span>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
              Your order #{orderNumber} for <strong>Rs. {totalFormatted}</strong> is in the verification queue. Our accounts team verifies all incoming bank transfers and will mark your payment as <strong>Payment Verified</strong> once cross-checked.
            </p>

            {currentOrder.paymentMethod === 'bank_transfer' && (currentOrder.subtotal >= 5000 || (currentOrder.cashbackAmount && currentOrder.cashbackAmount > 0)) && (
              <div className="p-3 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">
                  🎉 7% Online Payment Cashback: Rs. {(currentOrder.cashbackAmount || Math.round(currentOrder.subtotal * 0.07)).toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  Credited within 24 hours
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white/90 dark:bg-stone-900/90 p-3.5 rounded-xl border border-amber-300/50 dark:border-amber-800/40">
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Transaction ID (TID)</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
                  {currentOrder.bankTxRef || 'Provided with order'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Payment Method</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  Bank Transfer (Meezan Bank)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Payment Status</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  Pending Verification
                </span>
              </div>
            </div>

            {currentOrder.paymentProof && (
              <div className="flex items-center gap-3 pt-2 text-xs">
                <img
                  src={currentOrder.paymentProof}
                  alt="Uploaded payment proof"
                  className="w-12 h-12 object-cover rounded-lg border border-amber-300 dark:border-amber-700"
                />
                <span className="text-amber-900 dark:text-amber-300 text-xs font-medium">
                  Payment receipt screenshot submitted and safely stored with order record.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Instructions based on Payment Method */}
        {currentOrder.paymentMethod === 'cod' && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
            <Truck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-200">
                Cash on Delivery Instructions
              </h4>
              <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Please have exact cash of <strong>Rs. {totalFormatted}</strong> ready upon arrival of the TCS or Leopards courier rider at your address{shipping?.city ? ` in ${shipping.city}` : ''}. You will receive an SMS and email alert with your consignment tracking number once dispatched.
              </p>
            </div>
          </div>
        )}

        {currentOrder.paymentMethod === 'bank_transfer' && (
          <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
                <h4 className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                  Bank Transfer — Payment Pending Verification
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                Pending Verification
              </span>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
              Your order #{orderNumber} for <strong>Rs. {totalFormatted}</strong> has been submitted. Our atelier finance team is reviewing your transfer details{currentOrder.bankTxRef ? ` (Ref: ${currentOrder.bankTxRef})` : ''} and receipt proof.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/80 dark:bg-stone-900/80 p-3 rounded-xl border border-amber-300/50 dark:border-amber-800/40">
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Bank</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">Meezan Bank</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Account Title</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">ALI AHAB MUKARRAM</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Account Number</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">28020115438839</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">IBAN (1Link / Raast)</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">PK20MEZN0028020115438839</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Branch</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">DHA Phase 5, Lahore</span>
              </div>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
              You will receive an in-app and SMS alert as soon as verification is confirmed.
            </p>
          </div>
        )}

        {/* Order Items Breakdown */}
        {currentOrder.items && currentOrder.items.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Purchased Leather Goods ({currentOrder.items.length})
            </h4>
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {currentOrder.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName || 'Product'}
                        className="w-10 h-10 object-cover rounded-lg border border-stone-200 dark:border-stone-800 shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-stone-900 dark:text-stone-100">
                        {item.productName || item.name || 'Atelier Item'}
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
                      <p className="text-[11px] text-stone-500">Qty: {item.quantity} × Rs. {item.unitPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                    Rs. {item.subtotal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">Rs. {subtotalFormatted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Delivery</span>
                <span className="font-mono">
                  {currentOrder.shippingFee === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FREE</span>
                  ) : (
                    `Rs. ${shippingFeeFormatted}`
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Cashback</span>
                <span>
                  {currentOrder.paymentMethod === 'bank_transfer' && (currentOrder.subtotal >= 5000 || (currentOrder.cashbackAmount && currentOrder.cashbackAmount > 0)) ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      7% — Credited within 24 hours
                    </span>
                  ) : (
                    <span className="text-stone-400">Not applicable</span>
                  )}
                </span>
              </div>
              {discountFormatted && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span className="font-mono">-Rs. {discountFormatted}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-stone-900 dark:text-stone-100 text-sm pt-2 border-t border-stone-100 dark:border-stone-800">
                <span>Total Amount</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">Rs. {totalFormatted}</span>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Address Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Consignee & Shipping Destination
            </h4>
            <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1">
              <p className="font-bold text-stone-950 dark:text-stone-50">
                {shipping?.fullName || currentOrder.customerName || 'Valued Patron'}
              </p>
              {shipping?.addressLine1 && <p>{shipping.addressLine1}</p>}
              {shipping?.addressLine2 && <p>{shipping.addressLine2}</p>}
              {shipping?.landmark && (
                <p className="italic text-stone-500">Near: {shipping.landmark}</p>
              )}
              <p>
                {[shipping?.city, shipping?.province, shipping?.postalCode].filter(Boolean).join(', ') || 'Pakistan'}
              </p>
              <p>Phone: {shipping?.phone || currentOrder.customerPhone || 'N/A'}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Estimated Fulfillment
            </h4>
            <div className="text-xs text-stone-700 dark:text-stone-300 space-y-2">
              <p>
                Expected Dispatch: <strong className="text-stone-950 dark:text-stone-50">Within 24 Hours</strong>
              </p>
              <p>
                Courier Partner: <strong className="text-stone-950 dark:text-stone-50">TCS / Leopards Pakistan</strong>
              </p>
              <p className="text-stone-500">
                Tracking code will be dispatched via SMS & Email as soon as hand-off to the rider is complete.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Vendor Packages Breakdown (if applicable) */}
        {currentOrder.vendorSubOrders && currentOrder.vendorSubOrders.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Fulfillment Consignments ({currentOrder.vendorSubOrders.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentOrder.vendorSubOrders.map((sub: any) => (
                <div
                  key={sub.id || Math.random()}
                  className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                    <span className="flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      {sub.vendorStoreName || 'FAWNIC Atelier'}
                    </span>
                    <span className="capitalize text-amber-600 text-[11px]">{sub.fulfillmentStatus || 'Pending'}</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Sub-Order ID: {sub.id}</p>
                  <p className="text-[11px] text-stone-500">
                    Total for store: Rs. {(sub.subtotal || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancellation & Returns Policy Notice */}
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider text-[11px]">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Order Cancellation & 7-Day Return Policy</span>
          </div>
          <div className="text-stone-600 dark:text-stone-400 space-y-1 leading-relaxed text-[11px]">
            <p>
              • <strong>Cancellation:</strong> Orders may be cancelled via your customer portal only while status is <strong>&quot;Pending&quot;</strong> before dispatch. Once dispatched or in transit with courier, orders cannot be cancelled.
            </p>
            <p>
              • <strong>Returns & Exchanges:</strong> You have <strong>7 days</strong> from parcel delivery to inspect and request an exchange or return for any unused piece in original luxury packaging with tags intact.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md hover:opacity-90 transition-opacity"
        >
          Continue Shopping in Pakistan
        </button>
        <button
          onClick={() => onNavigate('profile', { tab: 'orders' })}
          className="px-6 py-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
        >
          View in My Customer Portal
        </button>
      </div>

      {showInvoice && <InvoiceModal order={currentOrder} onClose={() => setShowInvoice(false)} />}
    </div>
  );
};
