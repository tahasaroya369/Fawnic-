import { jsPDF } from 'jspdf';
import type { InvoiceRecord, Order } from '../types.js';

interface InvoiceDataInput {
  invoiceNumber: string;
  orderNumber?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress: string;
  items: Array<{
    productName?: string;
    name?: string;
    quantity: number;
    unitPrice?: number;
    price?: number;
    subtotal?: number;
    sku?: string;
    variantInfo?: string;
  }>;
  subtotal: number;
  discount: number;
  shippingFee?: number;
  total: number;
  paymentMethod: string;
  orderDate?: string;
  createdAt?: string;
  notes?: string;
}

// Helper to format currency in PKR
export function formatPKR(val: number): string {
  return `Rs. ${(Math.round(val) || 0).toLocaleString()}`;
}

// Helper to format date cleanly like "12 September 2026"
export function formatInvoiceDate(dateStr?: string): string {
  if (!dateStr) {
    const d = new Date();
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return dateStr;
  }
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Loads image from URL and clips it to a high-resolution circle on an off-screen canvas.
 * Returns a PNG data URL.
 */
async function getCircularLogoDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 300;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, (size / 2) - 4, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw image centered & covering
        ctx.drawImage(img, 0, 0, size, size);
        ctx.restore();

        // Add subtle gold/amber ring around circle
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, (size / 2) - 4, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#b45309';
        ctx.stroke();

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Could not clip logo circularly:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Generates and downloads a clean, professional vector PDF invoice on white A4 paper.
 * File Name: FAWNIC-Invoice-[INVOICE_NUMBER].pdf
 */
export async function downloadInvoicePdf(
  invoice: InvoiceRecord | Order | InvoiceDataInput
): Promise<void> {
  try {
    const anyInv = invoice as any;
    const invoiceNumber =
      anyInv.invoiceNumber ||
      `FW-INV-${(anyInv.orderNumber || '').replace(/^FWN-/, '') || '0001'}`;

    const orderRef =
      anyInv.orderNumber ||
      anyInv.orderId ||
      invoiceNumber;

    const invoiceDateStr =
      anyInv.orderDate || anyInv.createdAt || new Date().toISOString();
    const formattedDate = formatInvoiceDate(invoiceDateStr);

    let customerAddress = anyInv.customerAddress;
    if (!customerAddress && anyInv.shippingAddress) {
      const sa = anyInv.shippingAddress;
      customerAddress = [sa.houseNumber, sa.streetAddress, sa.area, sa.city, sa.province]
        .filter(Boolean)
        .join(', ');
    }
    if (!customerAddress) {
      customerAddress = 'Address on file';
    }
    const notes = anyInv.notes || '';

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    // Background: Pure Clean White
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    let currentY = 13;

    // 1. FAWNIC CIRCULAR LOGO
    const logoDataUrl = await getCircularLogoDataUrl('/fawnic-logo.jpg');
    if (logoDataUrl) {
      const logoSize = 22; // 22mm diameter
      const logoX = (pageWidth - logoSize) / 2;
      doc.addImage(logoDataUrl, 'PNG', logoX, currentY, logoSize, logoSize);
      // Clean spacing below logo: leaves ~4.5mm clear gap between bottom of logo and top of FAWNIC text
      currentY += logoSize + 9;
    } else {
      currentY += 6;
    }

    // 2. BRAND HEADER: FAWNIC / LEATHER ATELIER
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(26, 26, 26);
    doc.text('FAWNIC', pageWidth / 2, currentY, { align: 'center' });
    // Small gap between FAWNIC and LEATHER ATELIER
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9); // Atelier Amber/Gold
    doc.text('L E A T H E R   A T E L I E R', pageWidth / 2, currentY, { align: 'center' });
    // Larger gap before divider line
    currentY += 8;

    // Elegant separator line
    doc.setDrawColor(220, 215, 205);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    // Gap before ORDER INVOICE title
    currentY += 7;

    // 3. INVOICE TITLE & METADATA BAR
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text('ORDER INVOICE', margin, currentY);

    // Right-aligned Invoice # & Date
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - margin, currentY - 2, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text(`Date: ${formattedDate}`, pageWidth - margin, currentY + 3, { align: 'right' });

    if (orderRef && orderRef !== invoiceNumber) {
      doc.text(`Order Ref: ${orderRef}`, pageWidth - margin, currentY + 7.5, { align: 'right' });
    }

    currentY += 12;

    // 4. BILL TO / CUSTOMER INFORMATION BOX
    doc.setFillColor(249, 248, 246);
    doc.setDrawColor(230, 226, 220);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 25, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150, 100, 40);
    doc.text('BILL TO', margin + 5, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(25, 25, 25);
    doc.text(invoice.customerName || 'Valued Customer', margin + 5, currentY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);

    const contactLine = [
      invoice.customerPhone ? `Phone: ${invoice.customerPhone}` : null,
      invoice.customerEmail ? `Email: ${invoice.customerEmail}` : null,
    ]
      .filter(Boolean)
      .join('   |   ');

    if (contactLine) {
      doc.text(contactLine, margin + 5, currentY + 15.5);
    }

    const addressText = doc.splitTextToSize(
      customerAddress,
      contentWidth - 10
    );
    doc.text(addressText, margin + 5, currentY + 20);

    currentY += 30;

    // 5. ITEMS TABLE
    // Table Header
    const colItemX = margin + 4;
    const colQtyX = margin + 105;
    const colPriceX = margin + 130;
    const colTotalX = pageWidth - margin - 4;

    doc.setFillColor(242, 240, 235);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(215, 210, 200);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    doc.line(margin, currentY + 7, pageWidth - margin, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text('ITEM', colItemX, currentY + 4.8);
    doc.text('QTY', colQtyX, currentY + 4.8, { align: 'center' });
    doc.text('PRICE', colPriceX, currentY + 4.8, { align: 'right' });
    doc.text('TOTAL', colTotalX, currentY + 4.8, { align: 'right' });

    currentY += 7;

    // Table Rows
    const items = invoice.items || [];
    items.forEach((it) => {
      const name = it.productName || it.name || 'Handcrafted Leather Article';
      const qty = it.quantity || 1;
      const unitPrice = it.unitPrice ?? it.price ?? 0;
      const lineTotal = it.subtotal ?? (qty * unitPrice);

      const splitName = doc.splitTextToSize(name, 92);
      const rowHeight = Math.max(8, splitName.length * 4.2 + 3);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      doc.text(splitName, colItemX, currentY + 4.5);

      if (it.sku || it.variantInfo) {
        const subInfo = [it.sku, it.variantInfo].filter(Boolean).join(' • ');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(subInfo, colItemX, currentY + 4.5 + splitName.length * 4);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);
      doc.text(String(qty), colQtyX, currentY + 4.5, { align: 'center' });
      doc.text(formatPKR(unitPrice), colPriceX, currentY + 4.5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.text(formatPKR(lineTotal), colTotalX, currentY + 4.5, { align: 'right' });

      currentY += rowHeight;

      doc.setDrawColor(240, 237, 232);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY, pageWidth - margin, currentY);
    });

    currentY += 4;

    // 6. TOTALS & PAYMENT METHOD SECTION
    const totalsWidth = 75;
    const totalsX = pageWidth - margin - totalsWidth;

    // Left side: Payment Method & Notes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150, 100, 40);
    doc.text('PAYMENT METHOD', margin + 4, currentY + 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text(invoice.paymentMethod || 'Cash on Delivery (COD)', margin + 4, currentY + 8);

    if (notes && notes.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text('Notes / Instructions:', margin + 4, currentY + 14);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const noteLines = doc.splitTextToSize(notes.trim(), 85);
      doc.text(noteLines, margin + 4, currentY + 18.5);
    }

    // Right side: Totals Calculation
    let calcY = currentY;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text('Subtotal', totalsX, calcY + 3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(formatPKR(invoice.subtotal), pageWidth - margin - 4, calcY + 3, { align: 'right' });
    calcY += 5;

    if (invoice.discount && invoice.discount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 40, 40);
      doc.text('Discount', totalsX, calcY + 3);
      doc.setFont('helvetica', 'bold');
      doc.text(`- ${formatPKR(invoice.discount)}`, pageWidth - margin - 4, calcY + 3, { align: 'right' });
      calcY += 5;
    }

    if (invoice.shippingFee !== undefined && invoice.shippingFee > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Shipping', totalsX, calcY + 3);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(formatPKR(invoice.shippingFee), pageWidth - margin - 4, calcY + 3, { align: 'right' });
      calcY += 5;
    }

    if ((invoice as any).tax !== undefined && Number((invoice as any).tax) > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Tax', totalsX, calcY + 3);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(formatPKR(Number((invoice as any).tax)), pageWidth - margin - 4, calcY + 3, { align: 'right' });
      calcY += 5;
    }

    calcY += 2;
    // Total highlight box
    doc.setFillColor(25, 25, 25);
    doc.roundedRect(totalsX - 2, calcY, totalsWidth + 2, 9, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', totalsX + 3, calcY + 6);
    doc.setFontSize(10.5);
    doc.text(formatPKR(invoice.total), pageWidth - margin - 4, calcY + 6, { align: 'right' });

    currentY = Math.max(calcY + 16, currentY + 32);

    // 7. FAWNIC CONTACT INFORMATION SECTION (Permanently required)
    doc.setDrawColor(225, 220, 210);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text('FAWNIC LEATHER ATELIER', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(85, 85, 85);
    doc.text('DHA Phase 5, Lahore, Pakistan', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    doc.text('Phone / WhatsApp: 03711661611   •   Email: fawnic01@gmail.com', pageWidth / 2, currentY, {
      align: 'center',
    });
    currentY += 6;

    // 8. FOOTER: "Created By FAWNIC Team" (Permanent subtle requirement)
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text('Created By FAWNIC Team', pageWidth / 2, currentY, { align: 'center' });

    // Save as FAWNIC-Invoice-[INVOICE_NUMBER].pdf
    const sanitizedNumber = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '-');
    doc.save(`FAWNIC-Invoice-${sanitizedNumber}.pdf`);
  } catch (error) {
    console.error('Invoice PDF generation error:', error);
    throw new Error('Unable to generate PDF. Please try again.');
  }
}
