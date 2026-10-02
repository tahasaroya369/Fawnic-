import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Edit,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import type { Order, InvoiceRecord, InvoiceSettings } from '../../types.js';
import { downloadInvoicePdf, formatInvoiceDate } from '../../utils/invoicePdfGenerator.js';

interface InvoiceViewModalProps {
  order?: Order | null;
  invoice?: InvoiceRecord | null;
  settings?: InvoiceSettings | null;
  isOpen: boolean;
  onClose: () => void;
  onEditInvoice?: (invoice: InvoiceRecord) => void;
  token?: string | null;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  order,
  invoice,
  isOpen,
  onClose,
  onEditInvoice,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Resolve values prioritizing invoice record, then order
  const invoiceNumber =
    invoice?.invoiceNumber ||
    (order?.orderNumber
      ? `FW-INV-${order.orderNumber.replace(/^FWN-/, '')}`
      : 'FW-INV-0001');

  const orderNumber =
    invoice?.orderNumber || order?.orderNumber || invoiceNumber;

  const customerName =
    invoice?.customerName || order?.customerName || 'Valued Customer';

  const customerEmail =
    invoice?.customerEmail || order?.customerEmail || '';

  const customerPhone =
    invoice?.customerPhone || order?.customerPhone || '';

  const customerAddress =
    invoice?.customerAddress ||
    (typeof (order?.shippingAddress as any) === 'string' && (order?.shippingAddress as any).trim()
      ? (order!.shippingAddress as any).trim()
      : order?.shippingAddress && typeof order.shippingAddress === 'object'
      ? [
          (order.shippingAddress as any).fullName || (order.shippingAddress as any).recipientName,
          (order.shippingAddress as any).addressLine1 || (order.shippingAddress as any).streetAddress || (order.shippingAddress as any).houseNumber,
          (order.shippingAddress as any).addressLine2,
          (order.shippingAddress as any).landmark ? `Near: ${(order.shippingAddress as any).landmark}` : null,
          (order.shippingAddress as any).area,
          (order.shippingAddress as any).city,
          (order.shippingAddress as any).province,
          (order.shippingAddress as any).postalCode,
        ]
          .filter(Boolean)
          .join(', ')
      : (order as any)?.customerAddress || 'Address on file (Pakistan)');

  const items = invoice?.items || order?.items || [];
  const subtotal = invoice?.subtotal ?? order?.subtotal ?? 0;
  const shippingFee = invoice?.shippingFee ?? order?.shippingFee ?? 0;
  const discount = invoice?.discount ?? order?.discount ?? 0;
  const tax = invoice?.tax ?? (invoice as any)?.taxAmount ?? 0;
  const total = invoice?.total ?? order?.total ?? 0;
  const paymentMethod =
    invoice?.paymentMethod ||
    (order?.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer');
  const notes = invoice?.notes || '';

  const rawDate =
    invoice?.orderDate || invoice?.createdAt || order?.createdAt || new Date().toISOString();
  const formattedDate = formatInvoiceDate(rawDate);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      setPdfError('');

      // Build consolidated invoice payload for generator
      const invoiceData = {
        invoiceNumber,
        orderNumber,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        items: items.map((it: any) => ({
          productName: it.productName || it.name || 'Leather Article',
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice ?? it.price ?? 0,
          subtotal: it.subtotal ?? (it.quantity || 1) * (it.unitPrice ?? it.price ?? 0),
          sku: it.sku || '',
          variantInfo: it.variantInfo || it.selectedColor,
        })),
        subtotal,
        discount,
        shippingFee,
        tax,
        total,
        paymentMethod,
        orderDate: rawDate,
        notes,
      };

      await downloadInvoicePdf(invoiceData);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setPdfError('Unable to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Convert current view state to InvoiceRecord for editing
  const handleEditClick = () => {
    if (onEditInvoice) {
      const invRecord: InvoiceRecord = invoice || {
        id: order?.id || `inv_${Date.now()}`,
        invoiceNumber,
        orderId: order?.id || `ord_${Date.now()}`,
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        paymentMethod,
        paymentStatus: 'pending',
        subtotal,
        discount,
        shippingFee,
        total,
        type: 'manual',
        items: items.map((it: any) => ({
          productId: it.productId || 'prd',
          productName: it.productName || it.name || 'Leather Article',
          sku: it.sku || 'FAWNIC-BESPOKE',
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice ?? it.price ?? 0,
          subtotal: it.subtotal ?? (it.quantity || 1) * (it.unitPrice ?? it.price ?? 0),
        })),
        orderDate: rawDate,
        createdAt: rawDate,
        status: 'issued',
        notes,
      };
      onEditInvoice(invRecord);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:rounded-none print:m-0 print:text-black print:bg-white flex flex-col max-h-[92vh]">
        {/* Modal Action Buttons Bar (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-xs tracking-wider uppercase text-amber-700 dark:text-amber-400">
              Order Invoice Preview
            </span>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-stone-300">
              #{invoiceNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* DOWNLOAD PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-serif uppercase tracking-wider font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {downloading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>DOWNLOAD PDF</span>
            </button>

            {/* PRINT INVOICE */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-serif uppercase tracking-wider font-bold rounded-xl hover:bg-stone-800 dark:hover:bg-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT INVOICE</span>
            </button>

            {/* EDIT INVOICE */}
            {onEditInvoice && (
              <button
                type="button"
                onClick={handleEditClick}
                className="px-3 py-1.5 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-zinc-700 text-xs font-serif uppercase tracking-wider font-bold rounded-xl transition flex items-center gap-1.5 border border-stone-200 dark:border-zinc-700 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>EDIT INVOICE</span>
              </button>
            )}

            {/* CLOSE */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {pdfError && (
          <div className="px-6 py-2 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 print:hidden shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pdfError}</span>
          </div>
        )}

        {/* Invoice Printable Sheet (Strict Clean White Background for Pristine Printing & Preview) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-stone-100/50 dark:bg-zinc-950">
          <div
            id="fawnic-invoice-sheet"
            ref={printRef}
            className="max-w-2xl mx-auto bg-white text-stone-900 border border-stone-200 rounded-xl shadow-xs p-8 sm:p-10 space-y-7 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none"
          >
            {/* Header with Centered Logo & Dedicated Brand Spacing */}
            <div className="text-center border-b border-stone-200 pb-7 print:pb-5">
              {/* Logo Area */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-600/30 shadow-xs mx-auto mb-4 bg-stone-900 shrink-0">
                <img
                  src="/fawnic-logo.jpg"
                  alt="FAWNIC"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Brand Name */}
              <h1 className="font-serif font-bold text-2xl tracking-[0.2em] text-stone-950 uppercase mb-1">
                FAWNIC
              </h1>
              <p className="text-xs text-amber-700 tracking-[0.28em] uppercase font-serif font-bold">
                LEATHER ATELIER
              </p>
            </div>

            {/* Invoice Title & Meta */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pt-1 pb-5">
              <div>
                <h2 className="font-serif font-bold text-xl text-stone-900 uppercase tracking-wider">
                  ORDER INVOICE
                </h2>
                {orderNumber && orderNumber !== invoiceNumber && (
                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                    Order Reference: <span className="font-semibold text-stone-800">{orderNumber}</span>
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right space-y-1">
                <p className="font-mono font-bold text-sm text-stone-900">
                  Invoice #: <span className="text-amber-800">{invoiceNumber}</span>
                </p>
                <p className="text-xs text-stone-500">
                  Date: <span className="font-medium text-stone-800">{formattedDate}</span>
                </p>
              </div>
            </div>

            {/* Customer Information (BILL TO) */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
              <p className="uppercase tracking-widest text-[10px] font-bold text-amber-800 mb-1.5 font-serif">
                BILL TO
              </p>
              <p className="font-serif font-bold text-base text-stone-950">
                {customerName}
              </p>
              <div className="mt-1 space-y-0.5 text-stone-700">
                <p className="leading-relaxed">
                  <span className="font-medium">Address:</span> {customerAddress}
                </p>
                {customerPhone && (
                  <p className="font-mono">
                    <span className="font-sans font-medium">Phone:</span> {customerPhone}
                  </p>
                )}
                {customerEmail && (
                  <p className="font-mono">
                    <span className="font-sans font-medium">Email:</span> {customerEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-stone-300 text-stone-700 uppercase tracking-wider font-serif font-bold text-[11px]">
                    <th className="py-2.5">ITEM</th>
                    <th className="py-2.5 text-center w-16">QTY</th>
                    <th className="py-2.5 text-right w-28">PRICE</th>
                    <th className="py-2.5 text-right w-28">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {items.map((it: any, idx: number) => {
                    const name = it.productName || it.name || 'Bespoke Leather Article';
                    const qty = it.quantity || 1;
                    const price = it.unitPrice ?? it.price ?? 0;
                    const lineTotal = it.subtotal ?? qty * price;
                    const subInfo = [it.sku, it.variantInfo, it.selectedColor]
                      .filter(Boolean)
                      .join(' • ');

                    return (
                      <tr key={idx} className="text-stone-800">
                        <td className="py-3 pr-2">
                          <p className="font-semibold text-stone-900">{name}</p>
                          {subInfo && (
                            <p className="text-[10px] text-stone-500 font-mono mt-0.5">{subInfo}</p>
                          )}
                        </td>
                        <td className="py-3 text-center font-mono">{qty}</td>
                        <td className="py-3 text-right font-mono">
                          Rs. {price.toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-stone-950">
                          Rs. {lineTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals & Payment Method Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-stone-200">
              {/* Payment Method & Notes */}
              <div className="space-y-3 text-xs">
                <div>
                  <p className="uppercase tracking-widest text-[10px] font-bold text-amber-800 mb-1 font-serif">
                    PAYMENT METHOD
                  </p>
                  <p className="font-serif font-semibold text-sm text-stone-900">
                    {paymentMethod}
                  </p>
                </div>

                {notes && (
                  <div>
                    <p className="uppercase tracking-widest text-[10px] font-bold text-stone-500 mb-0.5 font-serif">
                      NOTES / INSTRUCTIONS
                    </p>
                    <p className="text-stone-600 italic bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      {notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Totals */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium text-stone-900">
                    Rs. {subtotal.toLocaleString()}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-rose-700 font-medium">
                    <span>Discount:</span>
                    <span className="font-mono">- Rs. {discount.toLocaleString()}</span>
                  </div>
                )}

                {shippingFee > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Delivery / Shipping:</span>
                    <span className="font-mono text-stone-900">
                      Rs. {shippingFee.toLocaleString()}
                    </span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Tax:</span>
                    <span className="font-mono text-stone-900">
                      Rs. {tax.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Prominent Total */}
                <div className="flex justify-between items-center p-3 rounded-xl bg-stone-900 text-white font-serif font-bold text-sm mt-2">
                  <span className="tracking-wider uppercase">TOTAL</span>
                  <span className="font-mono text-base text-amber-400">
                    Rs. {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* FAWNIC Contact Details (Permanently Required) */}
            <div className="pt-6 border-t border-stone-200 text-xs">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-1">
                <p className="font-serif font-bold text-stone-950 uppercase tracking-wider text-sm">
                  FAWNIC LEATHER ATELIER
                </p>
                <p className="text-stone-600 flex items-center justify-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  <span>Lahore, Punjab, Pakistan</span>
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-stone-700 pt-1 font-mono text-[11px]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-amber-700" />
                    Phone / WhatsApp: 03711661611
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-stone-500" />
                    Email: fawnic1@gmail.com
                  </span>
                </div>
              </div>
            </div>

            {/* Footer: Created By FAWNIC Team */}
            <div className="text-center pt-2 text-[11px] text-stone-400 italic">
              Created By FAWNIC Team
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
