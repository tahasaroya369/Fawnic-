import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Printer,
  Eye,
  Trash2,
  RefreshCw,
  Calendar,
  AlertTriangle,
  Building,
  CheckCircle2,
  Plus,
  Edit,
  DollarSign,
} from 'lucide-react';
import type { InvoiceRecord, Order, Product } from '../../types.js';
import { CreateManualInvoiceModal } from './CreateManualInvoiceModal.js';
import { InvoiceViewModal } from './InvoiceViewModal.js';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator.js';

interface AdminInvoicesTabProps {
  token: string | null;
  orders: Order[];
  products?: Product[];
  onViewInvoiceByOrder?: (order: Order) => void;
}

export const AdminInvoicesTab: React.FC<AdminInvoicesTabProps> = ({
  token,
  orders,
  products = [],
}) => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(products);
  const [loading, setLoading] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<InvoiceRecord | null>(null);

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedInvoiceToDelete, setSelectedInvoiceToDelete] = useState<InvoiceRecord | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadInvoices();
    if (products.length === 0) {
      loadProducts();
    }
  }, [token]);

  useEffect(() => {
    if (products && products.length > 0) {
      setCatalogProducts(products);
    }
  }, [products]);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setCatalogProducts(data);
      }
    } catch (err) {
      console.error('Failed to load products for invoice selector:', err);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoiceToDelete) return;
    try {
      setDeletingId(selectedInvoiceToDelete.id);
      setActionError('');
      const res = await fetch(`/api/admin/invoices/${selectedInvoiceToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInvoices((prev) => prev.filter((i) => i.id !== selectedInvoiceToDelete.id));
        setDeleteConfirmOpen(false);
        setSelectedInvoiceToDelete(null);
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to delete invoice');
      }
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      setActionError('Network error deleting invoice');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowDownloadPdf = async (inv: InvoiceRecord) => {
    try {
      setDownloadingId(inv.id);
      setActionError('');
      await downloadInvoicePdf(inv);
    } catch (err) {
      console.error('Row PDF download error:', err);
      setActionError('Unable to generate PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/admin/reports/export?type=invoices', '_blank');
  };

  const handleOpenCreateModal = () => {
    setEditingInvoice(null);
    setIsManualModalOpen(true);
  };

  const handleOpenEditModal = (inv: InvoiceRecord) => {
    setEditingInvoice(inv);
    setIsManualModalOpen(true);
  };

  const handleInvoiceCreatedOrUpdated = (savedInvoice: InvoiceRecord) => {
    // Update local list in real time
    setInvoices((prev) => {
      const existsIndex = prev.findIndex((i) => i.id === savedInvoice.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = savedInvoice;
        return updated;
      }
      return [savedInvoice, ...prev];
    });

    // Automatically open preview modal with the newly created / edited invoice
    setSelectedInvoiceForView(savedInvoice);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.orderNumber?.toLowerCase().includes(q) ||
      inv.customerName?.toLowerCase().includes(q) ||
      inv.customerPhone?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (startDate) {
      const invDate = new Date(inv.orderDate || inv.createdAt).setHours(0, 0, 0, 0);
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      if (invDate < start) return false;
    }

    if (endDate) {
      const invDate = new Date(inv.orderDate || inv.createdAt).setHours(23, 59, 59, 999);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      if (invDate > end) return false;
    }

    return true;
  });

  const totalInvoiceValue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const averageInvoiceValue =
    invoices.length > 0 ? Math.round(totalInvoiceValue / invoices.length) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Order Invoices
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Official customer order invoices. Create manual client invoices, view, print, or download vector PDF copies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CREATE MANUAL INVOICE BUTTON */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-serif uppercase tracking-wider font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE MANUAL INVOICE</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-stone-200 dark:border-zinc-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError('')}
            className="text-stone-400 hover:text-stone-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards (Displays 0 if empty) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Invoices Generated
            </span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-2">
            {invoices.length}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Automated orders & manual consignments</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Total Invoiced Value
            </span>
            <Building className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-serif font-bold text-2xl text-amber-600 dark:text-amber-400 mt-2">
            Rs. {totalInvoiceValue.toLocaleString()}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Total across all generated invoices</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Average Invoice
            </span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-2">
            Rs. {averageInvoiceValue.toLocaleString()}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Average value per invoice</p>
        </div>
      </div>

      {/* Search & Date Filter Bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, order reference, customer name, or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-stone-500">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1.5 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-800 dark:text-stone-200"
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-stone-500">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1.5 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-800 dark:text-stone-200"
            />
          </div>

          {(startDate || endDate || search) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
              }}
              className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={loadInvoices}
            className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Order Ref</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Creation Date</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Total (PKR)</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
              {filteredInvoices.length === 0 ? (
                /* Empty State as requested in Specification 30 */
                <tr>
                  <td colSpan={7} className="text-center py-16 px-4">
                    <FileText className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                    <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200 mb-1">
                      No invoices yet
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-5">
                      Invoices will appear here when customer orders are placed or when you create a manual invoice.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-serif uppercase tracking-wider text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>CREATE MANUAL INVOICE</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isDownloading = downloadingId === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/30 transition"
                    >
                      {/* Invoice # */}
                      <td className="px-5 py-3.5 font-mono font-bold text-stone-900 dark:text-stone-100">
                        <div className="flex items-center gap-1.5">
                          <span>{inv.invoiceNumber}</span>
                          {inv.type === 'manual' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              Manual
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Order Ref */}
                      <td className="px-5 py-3.5 font-mono text-stone-600 dark:text-stone-400">
                        #{inv.orderNumber}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5 font-serif font-medium text-stone-900 dark:text-stone-100">
                        <div>{inv.customerName}</div>
                        {inv.customerPhone && (
                          <div className="text-[11px] font-mono text-stone-400 font-normal">
                            {inv.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Creation Date */}
                      <td className="px-5 py-3.5 text-stone-500 font-mono text-[11px]">
                        {new Date(inv.orderDate || inv.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-stone-300">
                          {inv.paymentMethod || 'COD'}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                        Rs. {inv.total.toLocaleString()}
                      </td>

                      {/* Actions: VIEW, DOWNLOAD PDF, PRINT, EDIT, DELETE */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* VIEW */}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="px-2.5 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold rounded-lg hover:bg-amber-600 dark:hover:bg-amber-500 transition flex items-center gap-1 cursor-pointer"
                            title="View Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* DOWNLOAD PDF */}
                          <button
                            type="button"
                            onClick={() => handleRowDownloadPdf(inv)}
                            disabled={isDownloading}
                            className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                            title="Download PDF"
                          >
                            {isDownloading ? (
                              <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* PRINT */}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* EDIT */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(inv)}
                            className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoiceToDelete(inv);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                            title="Delete Invoice Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (Prompt 22 requirement) */}
      {deleteConfirmOpen && selectedInvoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                Delete this invoice?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Are you sure you want to delete invoice{' '}
                <span className="font-mono font-bold text-stone-900 dark:text-stone-200">
                  {selectedInvoiceToDelete.invoiceNumber}
                </span>{' '}
                for customer{' '}
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {selectedInvoiceToDelete.customerName}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setSelectedInvoiceToDelete(null);
                }}
                className="flex-1 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingId !== null}
                onClick={handleDeleteInvoice}
                className="flex-1 py-2 bg-rose-600 text-white text-xs font-serif uppercase tracking-wider font-bold rounded-xl hover:bg-rose-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingId ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Delete Invoice</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Invoice Creation & Editing Modal */}
      <CreateManualInvoiceModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingInvoice(null);
        }}
        token={token}
        products={catalogProducts}
        editingInvoice={editingInvoice}
        onInvoiceCreated={handleInvoiceCreatedOrUpdated}
      />

      {/* Invoice View / Print / PDF Modal */}
      <InvoiceViewModal
        isOpen={Boolean(selectedInvoiceForView)}
        invoice={selectedInvoiceForView}
        onClose={() => setSelectedInvoiceForView(null)}
        onEditInvoice={(inv) => {
          setSelectedInvoiceForView(null);
          handleOpenEditModal(inv);
        }}
      />
    </div>
  );
};
