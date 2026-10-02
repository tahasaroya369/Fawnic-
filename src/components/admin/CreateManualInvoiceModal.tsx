import React, { Component, useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Hash,
} from 'lucide-react';
import type { Product, InvoiceRecord } from '../../types.js';

export interface LineItemInput {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

interface CreateManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (invoice: InvoiceRecord) => void;
  token: string | null;
  products?: Product[];
  editingInvoice?: InvoiceRecord | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onClose?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class InvoiceModalErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('InvoiceModalErrorBoundary caught runtime error:', error, errorInfo);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center space-y-4 my-auto">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              Unable to load invoice form.
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
              An unexpected error occurred while rendering the manual invoice generator.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleTryAgain}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-serif uppercase tracking-wider font-bold rounded-xl transition cursor-pointer"
            >
              Try Again
            </button>
            {this.props.onClose && (
              <button
                type="button"
                onClick={this.props.onClose}
                className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const CreateManualInvoiceModalInner: React.FC<CreateManualInvoiceModalProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated,
  token,
  products = [],
  editingInvoice,
}) => {
  const isEditMode = Boolean(editingInvoice);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery (COD)');
  const [orderReference, setOrderReference] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [taxType, setTaxType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [items, setItems] = useState<LineItemInput[]>([
    {
      id: 'row_1',
      productId: '',
      productName: '',
      productImage: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    },
  ]);

  // Sync initial state on open or edit
  useEffect(() => {
    if (isOpen) {
      setValidationError('');
      if (editingInvoice) {
        setCustomerName(editingInvoice.customerName || '');
        setCustomerPhone(editingInvoice.customerPhone || '');
        setCustomerEmail(editingInvoice.customerEmail || '');
        setCustomerAddress(editingInvoice.customerAddress || '');
        setPaymentMethod(editingInvoice.paymentMethod || 'Cash on Delivery (COD)');
        setOrderReference(editingInvoice.orderNumber || '');
        setNotes(editingInvoice.notes || '');
        setDiscount(Number(editingInvoice.discount) || 0);
        setShippingFee(Number(editingInvoice.shippingFee) || 0);

        if (editingInvoice.taxType) {
          setTaxType(editingInvoice.taxType);
          setTaxRate(Number(editingInvoice.taxRate) || Number(editingInvoice.tax) || 0);
        } else if (editingInvoice.tax && Number(editingInvoice.tax) > 0) {
          setTaxType('fixed');
          setTaxRate(Number(editingInvoice.tax));
        } else {
          setTaxType('none');
          setTaxRate(0);
        }

        const rawDate = editingInvoice.orderDate || editingInvoice.createdAt;
        if (rawDate) {
          try {
            setInvoiceDate(new Date(rawDate).toISOString().slice(0, 10));
          } catch {
            setInvoiceDate(new Date().toISOString().slice(0, 10));
          }
        } else {
          setInvoiceDate(new Date().toISOString().slice(0, 10));
        }

        if (editingInvoice.items && Array.isArray(editingInvoice.items) && editingInvoice.items.length > 0) {
          setItems(
            editingInvoice.items.map((it, idx) => ({
              id: `item_${idx}_${Date.now()}`,
              productId: it.productId || '',
              productName: it.productName || (it as any).name || '',
              productImage: it.productImage || (it as any).image || '',
              sku: it.sku || 'FAWNIC-BESPOKE',
              quantity: Math.max(1, Number(it.quantity) || 1),
              unitPrice: Math.max(0, Number(it.unitPrice ?? (it as any).price) || 0),
              discount: Math.max(0, Number(it.discount) || 0),
            }))
          );
        } else {
          setItems([
            {
              id: 'row_1',
              productId: '',
              productName: '',
              productImage: '',
              sku: '',
              quantity: 1,
              unitPrice: 0,
              discount: 0,
            },
          ]);
        }
      } else {
        // Reset to fresh form
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setCustomerAddress('');
        setInvoiceDate(new Date().toISOString().slice(0, 10));
        setPaymentMethod('Cash on Delivery (COD)');
        setOrderReference(`MAN-${Date.now().toString().slice(-5)}`);
        setNotes('');
        setDiscount(0);
        setShippingFee(0);
        setTaxType('none');
        setTaxRate(0);
        setItems([
          {
            id: `row_${Date.now()}`,
            productId: '',
            productName: '',
            productImage: '',
            sku: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
          },
        ]);
      }
    }
  }, [isOpen, editingInvoice]);

  if (!isOpen) return null;

  const productList = Array.isArray(products) ? products : [];

  const handleProductSelect = (rowIndex: number, prodId: string) => {
    if (!prodId) return;
    const selected = productList.find((p) => p && p.id === prodId);
    if (!selected) return;

    const prodPrice = selected.salePrice ?? selected.regularPrice ?? (selected as any).price ?? 0;
    const prodImg = (selected.images && selected.images[0]) || selected.mainImage || '';

    setItems((prev) =>
      prev.map((row, idx) => {
        if (idx === rowIndex) {
          return {
            ...row,
            productId: selected.id,
            productName: selected.name,
            productImage: prodImg,
            sku: selected.sku || 'FAWNIC-BESPOKE',
            unitPrice: prodPrice,
          };
        }
        return row;
      })
    );
  };

  const handleUpdateRow = (rowIndex: number, field: keyof LineItemInput, val: any) => {
    setItems((prev) =>
      prev.map((row, idx) => {
        if (idx === rowIndex) {
          return { ...row, [field]: val };
        }
        return row;
      })
    );
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: '',
        productName: '',
        productImage: '',
        sku: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
      },
    ]);
  };

  const handleRemoveRow = (rowIndex: number) => {
    if (items.length <= 1) {
      setItems([
        {
          id: `row_${Date.now()}`,
          productId: '',
          productName: '',
          productImage: '',
          sku: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  // Financial calculations
  const subtotal = items.reduce((sum, item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const itemDisc = Math.max(0, Number(item.discount) || 0);
    const lineTotal = Math.max(0, qty * price - itemDisc);
    return sum + lineTotal;
  }, 0);

  let calculatedTax = 0;
  if (taxType === 'percentage') {
    calculatedTax = Math.round(subtotal * (Math.max(0, Number(taxRate) || 0) / 100));
  } else if (taxType === 'fixed') {
    calculatedTax = Math.round(Math.max(0, Number(taxRate) || 0));
  }

  const grandTotal = Math.max(
    0,
    subtotal - (Number(discount) || 0) + (Number(shippingFee) || 0) + calculatedTax
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Strict validation of required fields
    if (!customerName.trim()) {
      setValidationError('Customer Full Name is required.');
      return;
    }

    if (!customerPhone.trim()) {
      setValidationError('Customer Phone Number is required.');
      return;
    }

    if (!customerAddress.trim()) {
      setValidationError('Customer Address / Location is required.');
      return;
    }

    const validItems = items.filter(
      (it) => it.productName && it.productName.trim() && Number(it.unitPrice) >= 0
    );

    if (validItems.length === 0) {
      setValidationError('Please add at least one item with a valid product name and price.');
      return;
    }

    try {
      setLoading(true);

      const endpoint = isEditMode
        ? `/api/admin/invoices/${editingInvoice?.id}`
        : '/api/admin/invoices/manual';
      const method = isEditMode ? 'PUT' : 'POST';

      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        paymentMethod,
        orderReference: orderReference.trim(),
        invoiceDate: invoiceDate || new Date().toISOString(),
        notes: notes.trim(),
        discount: Number(discount) || 0,
        shippingFee: Number(shippingFee) || 0,
        tax: calculatedTax,
        taxType,
        taxRate: Number(taxRate) || 0,
        items: validItems.map((it) => {
          const q = Math.max(1, Number(it.quantity) || 1);
          const p = Math.max(0, Number(it.unitPrice) || 0);
          const d = Math.max(0, Number(it.discount) || 0);
          return {
            productId: it.productId || `prd_custom_${Date.now()}`,
            productName: it.productName.trim(),
            productImage: it.productImage || '',
            sku: it.sku || 'FAWNIC-BESPOKE',
            quantity: q,
            unitPrice: p,
            discount: d,
            subtotal: Math.max(0, q * p - d),
          };
        }),
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save invoice');
      }

      onInvoiceCreated(data);
      onClose();
    } catch (err: any) {
      console.error('Invoice save error:', err);
      setValidationError(err.message || 'Invoice could not be saved. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-300 dark:border-zinc-700 bg-stone-900 shrink-0 flex items-center justify-center">
              <img src="/fawnic-logo.jpg" alt="FAWNIC" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                {isEditMode ? 'Edit Order Invoice' : 'Create Manual Order Invoice'}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {isEditMode
                  ? `Modifying invoice #${editingInvoice?.invoiceNumber}`
                  : 'Enter bespoke client details, items, and pricing to generate an official FAWNIC invoice.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-800 dark:text-stone-200"
        >
          {validationError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Customer Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-1">
              <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                1. Customer Information
              </h4>
              <span className="text-[10px] text-stone-400 font-sans">* Indicates required field</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Customer Full Name <span className="text-amber-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Phone Number <span className="text-amber-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0300 1234567"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Customer Address / Location */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Customer Address / Location <span className="text-amber-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="House / Street, Area, City"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Invoice Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Order Reference */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Order Reference
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderReference}
                    onChange={(e) => setOrderReference(e.target.value)}
                    placeholder="e.g. MAN-98421 or WhatsApp-Order-1"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Product / Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-1">
              <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                2. Items Being Invoiced
              </h4>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ADD ITEM</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((row, idx) => {
                const qty = Math.max(1, Number(row.quantity) || 1);
                const price = Math.max(0, Number(row.unitPrice) || 0);
                const disc = Math.max(0, Number(row.discount) || 0);
                const rowSubtotal = Math.max(0, qty * price - disc);

                return (
                  <div
                    key={row.id}
                    className="p-3 bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700/80 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-2.5"
                  >
                    {/* Catalog Picker */}
                    <div className="w-full md:w-56 shrink-0">
                      <select
                        value={row.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- Catalog Product (Optional) --</option>
                        {productList.map((p) => {
                          const pPrice =
                            p.salePrice ?? p.regularPrice ?? (p as any).price ?? 0;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} (Rs. {(pPrice || 0).toLocaleString()})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Custom Name / Description */}
                    <div className="flex-1 min-w-[140px]">
                      <input
                        type="text"
                        required
                        value={row.productName}
                        onChange={(e) => handleUpdateRow(idx, 'productName', e.target.value)}
                        placeholder="Product / Item Name *"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        required
                        value={row.quantity}
                        onChange={(e) =>
                          handleUpdateRow(
                            idx,
                            'quantity',
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        placeholder="Qty"
                        title="Quantity"
                        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 text-center font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        required
                        value={row.unitPrice}
                        onChange={(e) =>
                          handleUpdateRow(
                            idx,
                            'unitPrice',
                            Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        }
                        placeholder="Price (Rs)"
                        title="Unit Price"
                        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Item Discount */}
                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        value={row.discount || 0}
                        onChange={(e) =>
                          handleUpdateRow(
                            idx,
                            'discount',
                            Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        }
                        placeholder="Disc (Rs)"
                        title="Item Discount (Optional)"
                        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 text-right font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Total */}
                    <div className="w-24 text-right font-mono text-xs font-bold text-stone-800 dark:text-stone-200 self-center shrink-0">
                      Rs. {(rowSubtotal || 0).toLocaleString()}
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-700 transition self-center cursor-pointer"
                      title="Remove Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Payment Method, Notes & Dynamic Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-stone-200 dark:border-zinc-800">
            {/* Payment Method & Notes */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                  <option value="Bank Transfer (1Link IBFT)">Bank Transfer (1Link IBFT)</option>
                  <option value="Debit / Credit Card">Debit / Credit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Notes / Order Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Custom embossing requested, delivery via TCS Express"
                  className="w-full p-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Dynamic Financial Calculations */}
            <div className="p-4 bg-stone-50 dark:bg-zinc-800/60 rounded-xl border border-stone-200 dark:border-zinc-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                  Rs. {(subtotal || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-600 dark:text-stone-400">Extra Discount (Rs.):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="w-28 px-2 py-1 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded text-right font-mono text-xs text-rose-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-600 dark:text-stone-400">Delivery / Shipping (Rs.):</span>
                <input
                  type="number"
                  min="0"
                  value={shippingFee}
                  onChange={(e) =>
                    setShippingFee(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="w-28 px-2 py-1 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded text-right font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Optional Tax Controls */}
              <div className="py-2 border-y border-stone-200 dark:border-zinc-700/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-stone-400">Tax (Optional):</span>
                  <select
                    value={taxType}
                    onChange={(e) => {
                      const val = e.target.value as 'none' | 'percentage' | 'fixed';
                      setTaxType(val);
                      if (val === 'none') setTaxRate(0);
                    }}
                    className="px-2 py-1 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="none">No Tax</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>

                {taxType === 'percentage' && (
                  <div className="flex items-center justify-between gap-2 pl-2">
                    <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                      Tax Rate (%):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={taxRate}
                        onChange={(e) =>
                          setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))
                        }
                        className="w-20 px-2 py-1 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded text-right font-mono text-xs focus:outline-none focus:border-amber-500"
                        placeholder="%"
                      />
                      <span className="font-mono text-stone-600 dark:text-stone-300 text-[11px] w-24 text-right">
                        = Rs. {(calculatedTax || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {taxType === 'fixed' && (
                  <div className="flex items-center justify-between gap-2 pl-2">
                    <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                      Tax Amount (Rs.):
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={taxRate}
                      onChange={(e) =>
                        setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="w-28 px-2 py-1 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded text-right font-mono text-xs focus:outline-none focus:border-amber-500"
                      placeholder="Rs."
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 font-bold text-sm text-stone-900 dark:text-stone-100">
                <span>GRAND TOTAL:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 text-base">
                  Rs. {(grandTotal || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-serif uppercase tracking-wider text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditMode ? 'SAVE INVOICE' : 'GENERATE INVOICE'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CreateManualInvoiceModal: React.FC<CreateManualInvoiceModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <InvoiceModalErrorBoundary onClose={props.onClose}>
      <CreateManualInvoiceModalInner {...props} />
    </InvoiceModalErrorBoundary>
  );
};
