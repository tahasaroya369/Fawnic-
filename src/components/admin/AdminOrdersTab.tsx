import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  FileText,
  Eye,
  Download,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  X,
  Trash2,
  RotateCcw,
  Ban,
  PackageCheck,
  Send,
  MapPin,
  Calendar,
  History,
  Building2,
  ExternalLink,
  ImageIcon,
  Check,
  FileCheck2,
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types.js';
import { PaymentVerificationModal } from './PaymentVerificationModal.js';

interface AdminOrdersTabProps {
  orders: Order[];
  token: string | null;
  onRefreshOrders: () => void;
  onViewOrder: (order: Order) => void;
  onViewInvoice: (order: Order) => void;
  initialFilter?: string;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  token,
  onRefreshOrders,
  onViewOrder,
  onViewInvoice,
  initialFilter = 'all',
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(initialFilter);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  // Receipt Preview & Payment Verification Modal State
  const [paymentVerificationModalOrder, setPaymentVerificationModalOrder] = useState<Order | null>(null);
  const [receiptPreviewOrder, setReceiptPreviewOrder] = useState<Order | null>(null);
  const [orderToVerifyReject, setOrderToVerifyReject] = useState<Order | null>(null);
  const [rejectPaymentReason, setRejectPaymentReason] = useState('Payment reference could not be verified in bank statement.');
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);

  // Cancel Order Modal State
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');
  const [restockInventory, setRestockInventory] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Delete Order Modal State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Tracking Management Modal State
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<OrderStatus>('processing');
  const [courierName, setCourierName] = useState('TCS Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [trackingLocation, setTrackingLocation] = useState('');
  const [trackingNote, setTrackingNote] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);
  const [trackingSuccessMsg, setTrackingSuccessMsg] = useState<string | null>(null);
  const [trackingErrorMsg, setTrackingErrorMsg] = useState<string | null>(null);
  const [showHistoryInModal, setShowHistoryInModal] = useState(false);

  // Sync initialFilter
  React.useEffect(() => {
    if (initialFilter && initialFilter !== activeTab) {
      setActiveTab(initialFilter);
    }
  }, [initialFilter]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(search.toLowerCase()));

    const isBankTransfer = (m: string) => m === 'bank_transfer' || m === 'ibft';
    const matchesPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'cod' && o.paymentMethod === 'cod') ||
      (paymentFilter === 'bank_transfer' && isBankTransfer(o.paymentMethod)) ||
      (paymentFilter === 'card' && (o.paymentMethod === 'card' || o.paymentMethod === 'stripe'));

    const matchesPaymentStatus =
      paymentStatusFilter === 'all' || o.paymentStatus === paymentStatusFilter;

    let matchesTab = true;
    if (activeTab === 'bank_transfer') {
      matchesTab = isBankTransfer(o.paymentMethod);
    } else if (activeTab === 'new') {
      matchesTab = o.status === 'pending' || o.status === 'confirmed';
    } else if (activeTab === 'processing') {
      matchesTab = o.status === 'processing';
    } else if (activeTab === 'ready_dispatch') {
      matchesTab = o.status === 'packed';
    } else if (activeTab === 'dispatched') {
      matchesTab = o.status === 'dispatched' || o.status === 'in_transit';
    } else if (activeTab === 'delivered') {
      matchesTab = o.status === 'delivered';
    } else if (activeTab === 'completed') {
      matchesTab = o.status === 'delivered' && o.paymentStatus === 'paid';
    } else if (activeTab === 'cancelled') {
      matchesTab = o.status === 'cancelled';
    } else if (activeTab === 'returns') {
      matchesTab = o.status === 'cancelled' && (o.notes?.toLowerCase().includes('return') || false);
    }

    return matchesSearch && matchesPayment && matchesPaymentStatus && matchesTab;
  });

  const handleVerifyPayment = async (orderId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setVerifyingPaymentId(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setOrderToVerifyReject(null);
        onRefreshOrders();
      } else {
        alert(data.error || 'Failed to update payment');
      }
    } catch (err: any) {
      console.error('Payment verification failed:', err);
      alert('Payment verification failed: ' + err.message);
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const handleExport = () => {
    window.open('/api/admin/reports/export?type=orders', '_blank');
  };

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onRefreshOrders();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleOpenCancel = (order: Order) => {
    setOrderToCancel(order);
    setCancelReason('Customer requested cancellation before dispatch');
    setRestockInventory(true);
  };

  const submitCancelOrder = async () => {
    if (!orderToCancel) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderToCancel.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: cancelReason,
          restock: restockInventory,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to cancel order');
        return;
      }

      setOrderToCancel(null);
      onRefreshOrders();
    } catch (err) {
      console.error('Cancel order error:', err);
    } finally {
      setCancelling(false);
    }
  };

  const submitDeleteOrder = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete order');
        return;
      }

      setOrderToDelete(null);
      onRefreshOrders();
    } catch (err) {
      console.error('Delete order error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenTracking = (order: Order) => {
    setTrackingModalOrder(order);
    setTrackingStatus(order.status || 'pending');
    setCourierName(order.courier || order.courierName || 'TCS Express');
    setTrackingNumber(order.trackingNumber || '');
    setEstimatedDelivery(order.expectedDelivery || order.estimatedDelivery || '');
    setDispatchDate(order.dispatchDate || '');
    setDeliveryDate(order.deliveryDate || '');
    setTrackingLocation('');
    setTrackingNote('');
    setTrackingSuccessMsg(null);
    setTrackingErrorMsg(null);
    setShowHistoryInModal(false);
  };

  const submitTrackingUpdate = async () => {
    if (!trackingModalOrder) return;
    setSavingTracking(true);
    setTrackingSuccessMsg(null);
    setTrackingErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${trackingModalOrder.id}/tracking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: trackingStatus,
          courier: courierName,
          courierName: courierName,
          trackingNumber: trackingNumber.trim(),
          estimatedDelivery,
          expectedDelivery: estimatedDelivery,
          dispatchDate,
          deliveryDate,
          location: trackingLocation.trim() || undefined,
          note: trackingNote.trim() || undefined,
          notes: trackingNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success !== false) {
        setTrackingSuccessMsg('Tracking updated successfully.');
        setTimeout(() => {
          setTrackingModalOrder(null);
          setTrackingSuccessMsg(null);
          onRefreshOrders();
        }, 1100);
      } else {
        setTrackingErrorMsg(data.error || 'Failed to update tracking. Please try again.');
      }
    } catch (err: any) {
      console.error('Tracking update error:', err);
      setTrackingErrorMsg(err?.message || 'A network error occurred while updating tracking.');
    } finally {
      setSavingTracking(false);
    }
  };

  // Status counts for tab badges
  const getTabCount = (tabKey: string) => {
    if (tabKey === 'all') return orders.length;
    if (tabKey === 'bank_transfer') return orders.filter((o) => o.paymentMethod === 'bank_transfer' || o.paymentMethod === 'ibft').length;
    if (tabKey === 'new') return orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
    if (tabKey === 'processing') return orders.filter((o) => o.status === 'processing').length;
    if (tabKey === 'ready_dispatch') return orders.filter((o) => o.status === 'packed').length;
    if (tabKey === 'dispatched') return orders.filter((o) => o.status === 'dispatched' || o.status === 'in_transit').length;
    if (tabKey === 'delivered') return orders.filter((o) => o.status === 'delivered').length;
    if (tabKey === 'completed') return orders.filter((o) => o.status === 'delivered' && o.paymentStatus === 'paid').length;
    if (tabKey === 'cancelled') return orders.filter((o) => o.status === 'cancelled').length;
    return 0;
  };

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'bank_transfer', label: 'Bank Transfer Proofs' },
    { id: 'new', label: 'New Orders' },
    { id: 'processing', label: 'Processing' },
    { id: 'ready_dispatch', label: 'Ready to Dispatch' },
    { id: 'dispatched', label: 'Dispatched' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Order Fulfillment & Logistics
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Track Pakistani client consignments, assign courier tracking numbers, and generate tax invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-stone-200 dark:border-zinc-700"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export All Orders CSV</span>
        </button>
      </div>

      {/* Primary Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const count = getTabCount(tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-serif font-semibold whitespace-nowrap rounded-t-xl transition flex items-center gap-2 border-b-2 ${
                isActive
                  ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer name, phone, email, or courier CN..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          >
            <option value="all">All Payment Methods</option>
            <option value="cod">Cash on Delivery (COD)</option>
            <option value="bank_transfer">Direct Bank Transfer (IBFT)</option>
            <option value="card">Credit / Debit Card</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="paid">Verified Paid</option>
            <option value="rejected">Payment Rejected (Action Required)</option>
            <option value="pending">Pending (Unpaid)</option>
            <option value="failed">Failed / Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Order # / Placed</th>
                <th className="px-5 py-3">Client & Destination</th>
                <th className="px-5 py-3">Product, SKU & Qty</th>
                <th className="px-5 py-3">Amount (PKR)</th>
                <th className="px-5 py-3">Payment Mode</th>
                <th className="px-5 py-3">Fulfillment Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-500">
                    No orders found matching your filter parameters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const dateStr = new Date(o.createdAt).toLocaleDateString('en-PK', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={o.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-900/50 transition">
                      {/* Order Number & Timestamp */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-stone-900 dark:text-stone-100 block">
                          #{o.orderNumber}
                        </span>
                        <span className="text-[11px] text-stone-500">{dateStr}</span>
                      </td>

                      {/* Client info */}
                      <td className="px-5 py-3.5">
                        <p className="font-serif font-semibold text-stone-900 dark:text-stone-100">
                          {o.customerName}
                        </p>
                        <p className="text-stone-500 text-[11px]">{o.shippingAddress?.city || 'Pakistan'}</p>
                        <p className="text-stone-400 font-mono text-[10px]">{o.customerPhone}</p>
                      </td>

                      {/* Products, Thumbnail, SKU & Quantity */}
                      <td className="px-5 py-3.5 max-w-[280px]">
                        <div className="space-y-2">
                          {(o.items || []).slice(0, 2).map((it, i) => {
                            const img = it.productImage || it.image || '/fawnic-logo.jpg';
                            const title = it.productName || it.name || 'Leather Item';
                            const sku = it.sku || 'FWN-ART';
                            return (
                              <div key={i} className="flex items-center gap-2.5">
                                <img
                                  src={img}
                                  alt={title}
                                  className="w-10 h-10 rounded-lg object-cover border border-stone-200 dark:border-zinc-800 shrink-0 bg-stone-100 dark:bg-zinc-800"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/fawnic-logo.jpg';
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-xs truncate" title={title}>
                                    {title}
                                  </p>
                                  {(it.selectedVariation?.name || it.selectedColor || it.variantInfo) && (
                                    <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold block truncate">
                                      {it.selectedVariation ? `Color: ${it.selectedVariation.name}` : (it.selectedColor ? `Color: ${it.selectedColor}` : it.variantInfo)}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono">
                                    <span className="truncate">SKU: {sku}</span>
                                    <span>•</span>
                                    <span className="font-bold text-stone-700 dark:text-stone-300">Qty: {it.quantity}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {(o.items || []).length > 2 && (
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block">
                              +{(o.items || []).length - 2} more item(s) in order
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm block">
                          Rs. {o.total.toLocaleString()}
                        </span>
                        {o.shippingFee === 0 ? (
                          <span className="text-[10px] text-emerald-600 font-medium">Free Shipping</span>
                        ) : (
                          <span className="text-[10px] text-stone-400">Incl. Rs. {o.shippingFee} ship</span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-stone-300 block w-fit">
                              {o.paymentMethod === 'bank_transfer' || o.paymentMethod === 'ibft' ? 'Bank Transfer (IBFT)' : (o.paymentMethod ? String(o.paymentMethod).toUpperCase() : 'COD')}
                            </span>
                            {(o.paymentMethod === 'bank_transfer' || o.paymentMethod === 'ibft') && (
                              <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>

                          {/* Payment status badge */}
                          <div>
                            {o.paymentStatus === 'paid' ? (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Verified Paid</span>
                              </span>
                            ) : o.paymentStatus === 'rejected' || o.paymentStatus === 'failed' ? (
                              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/60 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span>Payment Rejected (Action Required)</span>
                              </span>
                            ) : o.paymentStatus === 'pending_verification' ? (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 animate-pulse w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>Verify Pending</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-stone-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                                <span>Unpaid (Pending)</span>
                              </span>
                            )}
                          </div>

                          {/* Bank Transfer TID & Payment Proof Inspector */}
                          {(o.paymentMethod === 'bank_transfer' || o.paymentMethod === 'ibft') && (
                            <div className="pt-0.5 space-y-1">
                              {(o.bankTxRef || o.transactionId || o.transactionReference) && (
                                <p className="font-mono text-[10px] text-amber-700 dark:text-amber-300 font-bold truncate max-w-[170px]" title={o.bankTxRef || o.transactionId || o.transactionReference}>
                                  TID: #{o.bankTxRef || o.transactionId || o.transactionReference}
                                </p>
                              )}

                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(o.paymentProof || o.paymentProofUrl) && (
                                  <img
                                    src={o.paymentProof || o.paymentProofUrl}
                                    alt="Receipt"
                                    onClick={() => setPaymentVerificationModalOrder(o)}
                                    className="w-7 h-7 rounded object-cover border border-amber-500/40 hover:scale-110 transition cursor-pointer bg-stone-100"
                                    title="Click to zoom screenshot proof"
                                  />
                                )}

                                <button
                                  type="button"
                                  onClick={() => setPaymentVerificationModalOrder(o)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-serif font-bold uppercase tracking-wider bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/30 transition cursor-pointer shadow-2xs"
                                  title="Open Bank Transfer Verification Inspector"
                                >
                                  <FileCheck2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>Verify Proof</span>
                                </button>

                                {o.paymentStatus === 'pending_verification' && (
                                  <div className="flex items-center gap-1 ml-auto">
                                    <button
                                      type="button"
                                      title="Quick Approve Payment"
                                      disabled={verifyingPaymentId === o.id}
                                      onClick={() => handleVerifyPayment(o.id, 'approve')}
                                      className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 transition cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Quick Reject Payment"
                                      disabled={verifyingPaymentId === o.id}
                                      onClick={() => setPaymentVerificationModalOrder(o)}
                                      className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900 transition cursor-pointer"
                                    >
                                      <Ban className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Fulfillment Status & Tracking */}
                      <td className="px-5 py-3.5">
                        <select
                          value={o.status}
                          onChange={(e) => handleQuickStatusChange(o.id, e.target.value as OrderStatus)}
                          className="px-2 py-1 text-[11px] font-semibold bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-amber-500 text-stone-800 dark:text-stone-200"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="packed">Packed</option>
                          <option value="ready_to_dispatch">Ready to Dispatch</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="in_transit">In Transit</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="return_requested">Return Requested</option>
                          <option value="returned">Returned</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleOpenTracking(o)}
                          className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 hover:bg-amber-50 hover:text-amber-700 dark:bg-zinc-800 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 text-stone-700 dark:text-stone-300 transition cursor-pointer"
                        >
                          <Truck className="w-3 h-3 text-amber-600" />
                          <span>{o.trackingNumber ? `${o.courier || o.courierName || 'Courier'}: ${o.trackingNumber}` : 'Update Tracking'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Bank Transfer Payment Proof Inspector Button */}
                          {(o.paymentMethod === 'bank_transfer' || o.paymentMethod === 'ibft') && (
                            <button
                              type="button"
                              onClick={() => setPaymentVerificationModalOrder(o)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:text-amber-600 transition"
                              title="Inspect Bank Transfer Proof & TID"
                            >
                              <FileCheck2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Manage Tracking Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenTracking(o)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-500 hover:text-amber-600 transition"
                            title="Manage & Update Consignment Tracking"
                          >
                            <Truck className="w-4 h-4" />
                          </button>

                          {/* Invoice View Button */}
                          <button
                            type="button"
                            onClick={() => onViewInvoice(o)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-amber-600 transition"
                            title="View Official Tax Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Order Details Button */}
                          <button
                            type="button"
                            onClick={() => onViewOrder(o)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Cancel Order Button */}
                          {o.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(o)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-400 hover:text-amber-600 transition"
                              title="Cancel Consignment & Restock"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Order Button (for test orders) */}
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(o)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition"
                            title="Delete Order Record"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Cancel Order Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 rounded-full bg-amber-500/10">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  Cancel Order #{orderToCancel.orderNumber}
                </h3>
                <p className="text-xs text-stone-500">Client: {orderToCancel.customerName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  Cancellation Reason
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg"
                >
                  <option value="Customer requested cancellation">Customer requested cancellation</option>
                  <option value="Contact verification failed / unreachable">Contact verification failed / unreachable</option>
                  <option value="Out of stock / Atelier production delay">Out of stock / Atelier production delay</option>
                  <option value="Suspected fraudulent order">Suspected fraudulent order</option>
                  <option value="Address not serviceable by courier">Address not serviceable by courier</option>
                </select>
              </div>

              <label className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={restockInventory}
                  onChange={(e) => setRestockInventory(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  Automatically restock items back into atelier inventory
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-xs font-semibold rounded-xl text-stone-700 dark:text-stone-300"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={submitCancelOrder}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-serif uppercase tracking-wider font-bold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-500/10">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Delete Order #{orderToDelete.orderNumber}?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              This order and its associated fulfillment records will be permanently removed. This is intended for cleaning up test orders and dummy data.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-xs font-semibold rounded-xl text-stone-700 dark:text-stone-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={submitDeleteOrder}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-serif uppercase tracking-wider font-bold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Courier & Tracking Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    Consignment Tracking Management
                  </h3>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Order <span className="font-mono font-bold text-stone-800 dark:text-stone-200">#{trackingModalOrder.orderNumber}</span> • {trackingModalOrder.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Alert */}
            {trackingSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{trackingSuccessMsg}</span>
              </div>
            )}

            {/* Error Alert */}
            {trackingErrorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{trackingErrorMsg}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Order Status */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Order Status
                </label>
                <select
                  value={trackingStatus}
                  onChange={(e) => setTrackingStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="pending">Order Placed (Pending)</option>
                  <option value="confirmed">Order Confirmed</option>
                  <option value="processing">Processing (Atelier Crafting)</option>
                  <option value="packed">Ready to Dispatch (Packed)</option>
                  <option value="dispatched">Dispatched (Handed to Courier)</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="return_requested">Return Requested</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              {/* Courier Service & Consignment Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                    Courier Partner
                  </label>
                  <select
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="TCS Express">TCS Express</option>
                    <option value="Leopards Courier">Leopards Courier</option>
                    <option value="Trax Logistics">Trax Logistics</option>
                    <option value="PostEx">PostEx</option>
                    <option value="M&P Logistics">M&P Logistics</option>
                    <option value="Call Courier">Call Courier</option>
                    <option value="Rider Delivery">Rider Delivery</option>
                    <option value="Atelier White-Glove Concierge">Atelier White-Glove Concierge</option>
                    <option value="Other / Custom">Other / Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                    Consignment / Tracking #
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. TCS-892182019"
                    className="w-full px-3 py-2 font-mono font-bold bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Dates: Estimated Delivery & Dispatch Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Delivery Date (if delivered) & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                    Delivery Date (If completed)
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                    Current Hub / Location
                  </label>
                  <input
                    type="text"
                    value={trackingLocation}
                    onChange={(e) => setTrackingLocation(e.target.value)}
                    placeholder="e.g. Karachi Central Hub"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Tracking Note */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Tracking Note / Milestone Update (Customer visible)
                </label>
                <input
                  type="text"
                  value={trackingNote}
                  onChange={(e) => setTrackingNote(e.target.value)}
                  placeholder="e.g. Consignment handed over to TCS rider at Karachi central sorting facility."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Collapsible Tracking History */}
              <div className="pt-2 border-t border-stone-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowHistoryInModal(!showHistoryInModal)}
                  className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400 hover:text-amber-600 font-semibold"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>
                    {showHistoryInModal ? 'Hide Tracking History' : `View Logged History (${(trackingModalOrder.timeline || []).length} events)`}
                  </span>
                </button>

                {showHistoryInModal && (
                  <div className="mt-2.5 max-h-48 overflow-y-auto space-y-2 pr-1">
                    {(trackingModalOrder.timeline || []).map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold capitalize text-stone-800 dark:text-stone-200">
                            {ev.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-stone-400 text-[10px]">
                            {new Date(ev.timestamp).toLocaleString('en-PK')}
                          </span>
                        </div>
                        {ev.note && <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1">{ev.note}</p>}
                        {ev.location && (
                          <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{ev.location}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 text-xs font-semibold rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingTracking}
                onClick={submitTrackingUpdate}
                className="px-5 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-serif uppercase tracking-wider font-bold rounded-xl hover:bg-amber-600 dark:hover:bg-amber-500 hover:text-white transition disabled:opacity-50"
              >
                {savingTracking ? 'Saving...' : 'Update Tracking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Bank Transfer Payment Verification & Proof Inspector Modal */}
      <PaymentVerificationModal
        order={paymentVerificationModalOrder || receiptPreviewOrder}
        isOpen={Boolean(paymentVerificationModalOrder || receiptPreviewOrder)}
        onClose={() => {
          setPaymentVerificationModalOrder(null);
          setReceiptPreviewOrder(null);
        }}
        onPaymentUpdated={(updated) => {
          onRefreshOrders();
          if (paymentVerificationModalOrder?.id === updated.id) {
            setPaymentVerificationModalOrder(updated);
          }
          if (receiptPreviewOrder?.id === updated.id) {
            setReceiptPreviewOrder(updated);
          }
        }}
        token={token}
      />
    </div>
  );
};
