import React, { useState } from 'react';
import { X, Printer, Download, ShieldCheck, MapPin, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import type { Order } from '../../types.js';
import { downloadInvoicePdf, formatInvoiceDate } from '../../utils/invoicePdfGenerator.js';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${(order.orderNumber || '000000').replace(/^FWN?-?/, '')}`;
  const rawDate = order.createdAt || new Date().toISOString();
  const formattedDate = formatInvoiceDate(rawDate);

  const shipping = order.shippingAddress || ({} as any);
  const customerName =
    (typeof shipping === 'object' ? (shipping.fullName || shipping.recipientName) : null) ||
    order.customerName ||
    'Valued Patron';
  const customerPhone =
    (typeof shipping === 'object' ? shipping.phone : null) || order.customerPhone || '';
  const customerEmail = order.customerEmail || '';

  const fullAddress =
    typeof (order.shippingAddress as any) === 'string' && (order.shippingAddress as any).trim()
      ? (order.shippingAddress as any).trim()
      : typeof shipping === 'object' && Object.keys(shipping).length > 0
      ? [
          shipping.addressLine1 || shipping.streetAddress || shipping.houseNumber,
          shipping.addressLine2,
          shipping.landmark ? `Near: ${shipping.landmark}` : null,
          shipping.area,
          shipping.city,
          shipping.province,
          shipping.postalCode,
        ]
          .filter(Boolean)
          .join(', ') || ((order as any).customerAddress || 'Address on file (Pakistan)')
      : (order as any).customerAddress || 'Address on file (Pakistan)';

  const items = order.items || [];
  const subtotal = order.subtotal ?? 0;
  const shippingFee = order.shippingFee ?? 0;
  const discount = order.discount ?? order.discountAmount ?? 0;
  const total = order.total ?? (subtotal + shippingFee - discount);
  const paymentMethodDisplay =
    order.paymentMethod === 'cod'
      ? 'Cash on Delivery (COD)'
      : order.paymentMethod === 'bank_transfer'
      ? 'Direct Bank Transfer (Meezan Bank)'
      : String(order.paymentMethod || 'Bank Transfer').toUpperCase();

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      setErrorMessage(null);
      await downloadInvoicePdf({
        invoiceNumber,
        orderNumber: order.orderNumber,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress: fullAddress,
        items: items.map((it: any) => ({
          productName: it.name || it.productName || 'Bespoke Leather Article',
          quantity: it.quantity || 1,
          unitPrice: it.price ?? it.unitPrice ?? 0,
          subtotal: it.subtotal ?? it.total ?? ((it.price ?? it.unitPrice ?? 0) * (it.quantity || 1)),
          sku: it.sku || 'FWN-ART',
          variantInfo: it.selectedColor || it.variantInfo,
        })),
        subtotal,
        discount,
        shippingFee,
        total,
        paymentMethod: paymentMethodDisplay,
        orderDate: rawDate,
        notes: order.notes,
      });
    } catch (err) {
      console.error('Invoice PDF download error:', err);
      setErrorMessage('Unable to generate PDF automatically. You can use the Print button to Save as PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl bg-white text-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 print:border-none print:shadow-none print:max-w-full my-auto">
        {errorMessage && (
          <div className="bg-amber-50 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between print:hidden">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-amber-700 hover:text-amber-900 text-xs font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}
        {/* Top Action Bar (hidden on print) */}
        <div className="p-3 sm:p-4 bg-zinc-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif">
              Official Tax Invoice
            </span>
            <span className="text-xs text-zinc-400 hidden sm:inline">• #{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {downloading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-4 sm:p-8 space-y-6 text-xs text-zinc-700 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-zinc-200 pb-6 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-600/30 bg-stone-900 shrink-0">
                  <img
                    src="/fawnic-logo.jpg"
                    alt="FAWNIC"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <span className="text-2xl font-bold font-serif text-zinc-950 tracking-[0.15em] block">FAWNIC</span>
                  <span className="text-[10px] text-amber-700 uppercase font-serif tracking-[0.25em] font-bold block">LEATHER ATELIER</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium pt-1">FAWNIC ATELIER (Pvt) Ltd Pakistan</p>
              <p className="text-[11px] text-zinc-400">NTN / STRN: 8294719-4 • FBR Registered Atelier</p>
              <p className="text-[11px] text-zinc-400">DHA Phase 5, Lahore, Punjab, Pakistan</p>
              <p className="text-[11px] text-zinc-400 font-mono">03711661611 • fawnic01@gmail.com</p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-xl font-bold font-serif text-zinc-950 block">TAX INVOICE</span>
              <p className="font-semibold text-zinc-900">Invoice #: {invoiceNumber}</p>
              <p className="text-zinc-500 font-mono">Order Ref: #{order.orderNumber}</p>
              <p className="text-zinc-500">Date: {formattedDate}</p>
              <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 text-zinc-800 border border-zinc-200">
                Payment: {paymentMethodDisplay}
              </div>
            </div>
          </div>

          {/* Billing & Shipping Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 border-b border-zinc-200 pb-6">
            <div>
              <h5 className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider mb-1.5 font-serif">
                Bill To & Deliver To
              </h5>
              <p className="font-bold text-zinc-950 text-sm">{customerName}</p>
              <p className="text-zinc-600 leading-relaxed mt-0.5">{fullAddress}</p>
              {customerPhone && <p className="text-zinc-600 font-mono mt-1">Phone: {customerPhone}</p>}
              {customerEmail && <p className="text-zinc-600 mt-0.5">Email: {customerEmail}</p>}
            </div>

            <div>
              <h5 className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider mb-1.5 font-serif">
                Dispatch Details & Logistics
              </h5>
              <p className="text-zinc-600">Fulfillment: FAWNIC Atelier Direct Dispatch</p>
              <p className="text-zinc-600">Courier Partner: {order.courierName || order.courier || 'TCS Express / Leopards'}</p>
              {order.trackingNumber && (
                <p className="text-zinc-800 font-mono font-semibold">Tracking CN: {order.trackingNumber}</p>
              )}
              <p className="text-zinc-600">Region: Pakistan Domestic Delivery</p>
              <p className="text-zinc-600">
                Fulfillment Status:{' '}
                <span className="font-semibold text-amber-700 capitalize">{order.status || 'Processing'}</span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[360px]">
              <thead>
                <tr className="border-b-2 border-zinc-300 text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-serif">
                  <th className="py-2.5">Item & Atelier Spec</th>
                  <th className="py-2.5 text-center w-16">Qty</th>
                  <th className="py-2.5 text-right w-28">Unit Price</th>
                  <th className="py-2.5 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((item: any, idx: number) => {
                  const name = item.name || item.productName || 'Bespoke Leather Article';
                  const qty = item.quantity || 1;
                  const unitPrice = item.price ?? item.unitPrice ?? 0;
                  const lineTotal = item.subtotal ?? item.total ?? (qty * unitPrice);

                  return (
                    <tr key={idx} className="text-xs">
                      <td className="py-3 pr-2">
                        <p className="font-bold text-zinc-900">{name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          SKU: {item.sku || 'FWN-ART'}
                        </p>
                        {(item.selectedColor || item.variantInfo) && (
                          <p className="text-[10px] text-zinc-400">
                            {item.selectedColor || item.variantInfo}
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-center font-semibold font-mono">{qty}</td>
                      <td className="py-3 text-right font-mono">Rs. {unitPrice.toLocaleString()}</td>
                      <td className="py-3 text-right font-bold text-zinc-950 font-mono">
                        Rs. {lineTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown */}
          <div className="flex justify-end pt-4 border-t border-zinc-200">
            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-mono">Rs. {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span className="font-mono">- Rs. {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600">
                <span>Shipping & Delivery</span>
                <span className="font-mono">
                  {shippingFee === 0 ? 'FREE' : `Rs. ${shippingFee.toLocaleString()}`}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-300 flex justify-between text-sm font-bold text-zinc-950">
                <span>Grand Total (PKR)</span>
                <span className="font-serif text-amber-700">Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="border-t border-zinc-200 pt-6 text-[10px] text-zinc-400 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p>This is an official computer-generated tax invoice issued by FAWNIC Leather Atelier Pakistan.</p>
            <div className="flex items-center gap-1 font-semibold text-zinc-600">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Authenticated Atelier Document
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

