import express from 'express';
import { getDb, saveDatabase, getNextInvoiceNumber } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware.js';
import type { Order, OrderItem } from '../../src/types.js';
import { createOrderNotification } from '../orderNotificationHelper.js';

const router = express.Router();

// Create Order (Checkout)
router.post('/', (req: AuthenticatedRequest, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items,
    paymentMethod,
    paymentProof,
    bankTxRef,
    couponCode,
    notes,
  } = req.body;

  if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !items || !items.length) {
    res.status(400).json({ error: 'Missing required order details' });
    return;
  }

  const db = getDb();

  // Validate items and calculate subtotal
  let subtotal = 0;
  const orderItems: OrderItem[] = [];

  for (const it of items) {
    const product = db.products.find((p) => p.id === it.productId);
    if (!product) {
      res.status(404).json({ error: `Product not found: ${it.productName || it.productId}` });
      return;
    }

    if (product.stock < it.quantity) {
      res.status(400).json({
        error: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${it.quantity}.`,
      });
      return;
    }

    const price = product.salePrice || product.regularPrice;
    const itemSubtotal = price * it.quantity;
    subtotal += itemSubtotal;

    // Real inventory deduction!
    product.stock -= it.quantity;
    if (product.stock === 0) {
      product.stockStatus = 'out_of_stock';
    } else if (product.stock <= product.lowStockThreshold) {
      product.stockStatus = 'low_stock';
    }

    const selectedVar = it.selectedVariation;
    const variantText = it.variantInfo || (selectedVar ? `Color: ${selectedVar.name}` : (it.selectedVariants ? Object.entries(it.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ') : undefined));

    orderItems.push({
      productId: product.id,
      name: product.name,
      productName: product.name,
      image: selectedVar?.image || product.mainImage,
      productImage: selectedVar?.image || product.mainImage,
      sku: selectedVar?.sku || product.sku,
      variantInfo: variantText,
      selectedVariation: selectedVar,
      selectedColor: selectedVar?.name || it.selectedVariants?.['Color'],
      selectedVariants: it.selectedVariants,
      quantity: it.quantity,
      price: price,
      unitPrice: price,
      total: itemSubtotal,
      subtotal: itemSubtotal,
    });
  }

  // Shipping Fee Logic
  const freeThreshold = 5000;
  const standardFee = db.settings?.standardShippingFee || 250;
  const shippingFee = subtotal >= freeThreshold ? 0 : standardFee;

  // Online Payment 7% Cashback on orders of Rs. 5,000 or more (credited within 24 hours)
  const isOnlinePayment = (paymentMethod || 'cod') === 'bank_transfer';
  const isCashbackEligible = isOnlinePayment && subtotal >= 5000;
  const cashbackPercentage = isCashbackEligible ? 7 : 0;
  const cashbackAmount = isCashbackEligible ? Math.round(subtotal * 0.07) : 0;

  // Coupon Discount Calculation
  let discount = 0;
  let appliedCouponCode: string | undefined = undefined;

  if (couponCode && typeof couponCode === 'string') {
    const code = couponCode.trim().toUpperCase();
    const coupon = db.coupons.find((c) => c.code === code && c.isActive);
    if (coupon && subtotal >= coupon.minOrderAmount) {
      if (coupon.type === 'percent') {
        discount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.value;
      }
      coupon.usedCount += 1;
      appliedCouponCode = coupon.code;
    }
  }

  const total = Math.max(0, subtotal + shippingFee - discount);

  // Generate Unique Order Number
  const orderNum = `FWN-${Math.floor(10000 + Math.random() * 90000)}`;

  const newOrder: Order = {
    id: `ord_${Date.now()}`,
    orderNumber: orderNum,
    customerId: req.user?.id,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim().toLowerCase(),
    customerPhone: customerPhone.trim(),
    shippingAddress,
    items: orderItems,
    subtotal,
    shippingFee,
    discount,
    couponCode: appliedCouponCode,
    total,
    cashbackPercentage: cashbackPercentage || undefined,
    cashbackAmount: cashbackAmount || undefined,
    cashbackStatus: isCashbackEligible ? 'processing_24h' : undefined,
    paymentMethod: paymentMethod || 'cod',
    paymentStatus: paymentMethod === 'bank_transfer' ? 'pending_verification' : 'pending',
    paymentProof: paymentProof || undefined,
    paymentProofSubmittedAt: paymentProof ? new Date().toISOString() : undefined,
    bankTxRef: bankTxRef?.trim() || undefined,
    status: 'pending',
    notes: notes?.trim(),
    trackingNumber: undefined,
    courierName: undefined,
    courier: undefined,
    dispatchDate: undefined,
    deliveryDate: undefined,
    expectedDelivery: undefined,
    estimatedDelivery: undefined,
    timeline: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        updatedBy: 'Customer',
        note: paymentMethod === 'bank_transfer'
          ? `Order placed via Bank Transfer. Payment Status: PENDING VERIFICATION.${bankTxRef ? ` Ref: ${bankTxRef}.` : ''}${paymentProof ? ' Receipt proof uploaded.' : ''}`
          : 'Order placed by customer via Cash on Delivery.',
        location: `${shippingAddress.city || 'Karachi'}, Pakistan`,
      },
    ],
    trackingHistory: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        updatedBy: 'Customer',
        note: paymentMethod === 'bank_transfer'
          ? `Order placed via Bank Transfer. Payment Status: PENDING VERIFICATION.${bankTxRef ? ` Ref: ${bankTxRef}.` : ''}`
          : 'Order placed by customer via Cash on Delivery.',
        location: `${shippingAddress.city || 'Karachi'}, Pakistan`,
      },
    ],
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);

  // Automatic Order Invoice Generation as required
  if (!db.invoices) db.invoices = [];
  const autoInvoiceNumber = getNextInvoiceNumber();
  const fullAddress = [
    shippingAddress.houseNumber,
    shippingAddress.streetAddress,
    shippingAddress.area,
    shippingAddress.city,
    shippingAddress.province,
  ]
    .filter(Boolean)
    .join(', ');

  const autoInvoice = {
    id: `inv_${Date.now()}`,
    invoiceNumber: autoInvoiceNumber,
    orderId: newOrder.id,
    orderNumber: newOrder.orderNumber,
    customerName: newOrder.customerName,
    customerEmail: newOrder.customerEmail,
    customerPhone: newOrder.customerPhone,
    customerAddress: fullAddress || 'Address on file',
    items: newOrder.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      name: it.productName,
      productImage: it.productImage,
      image: it.productImage,
      sku: it.sku,
      variantInfo: it.variantInfo,
      selectedColor: it.variantInfo,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      price: it.unitPrice,
      subtotal: it.subtotal,
    })),
    subtotal: newOrder.subtotal,
    shippingFee: newOrder.shippingFee,
    discount: newOrder.discount,
    total: newOrder.total,
    paymentMethod: newOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Bank Transfer (1Link IBFT)',
    paymentStatus: newOrder.paymentStatus,
    orderDate: newOrder.createdAt,
    createdAt: new Date().toISOString(),
    status: 'issued' as const,
  };
  db.invoices.unshift(autoInvoice);

  // Record inventory transactions for audit
  if (!db.inventoryTransactions) db.inventoryTransactions = [];
  for (const it of orderItems) {
    db.inventoryTransactions.unshift({
      id: `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      productId: it.productId,
      productName: it.productName,
      sku: it.sku || 'FWN-ART',
      change: -it.quantity,
      previousStock: (db.products.find((p) => p.id === it.productId)?.stock || 0) + it.quantity,
      newStock: db.products.find((p) => p.id === it.productId)?.stock || 0,
      reason: 'Order Placed',
      referenceId: newOrder.orderNumber,
      adminEmail: 'online-checkout@fawnic.pk',
      timestamp: new Date().toISOString(),
      notes: `Consignment order ${newOrder.orderNumber}`,
    });
  }

  // Automatic Real-Time Order Received Notification
  createOrderNotification(newOrder, 'received');

  // Audit Log
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: 'system',
    action: 'NEW_ORDER_PLACED',
    entityType: 'Order',
    entityId: newOrder.orderNumber,
    details: `Order for Rs. ${total.toLocaleString()} placed by ${customerName} (${paymentMethod.toUpperCase()})`,
    timestamp: new Date().toISOString(),
  });

  saveDatabase();

  res.status(201).json({
    order: newOrder,
    message: 'Order placed successfully',
  });
});

// Track Order (Public Lookup)
router.get('/track/:orderNumber', (req, res) => {
  const db = getDb();
  const q = req.params.orderNumber.trim().toUpperCase();
  const order = db.orders.find(
    (o) => o.orderNumber.toUpperCase() === q || o.id === req.params.orderNumber
  );

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found. Please verify your order number.' });
    return;
  }

  // Ensure chronological timeline exists
  if (!order.timeline || !order.timeline.length) {
    order.timeline = [
      {
        status: 'pending',
        timestamp: order.createdAt,
        updatedBy: 'System',
        note: 'Order placed by customer',
        location: order.shippingAddress?.city ? `${order.shippingAddress.city}, Pakistan` : 'Karachi, Pakistan',
      },
    ];
  }

  const s = (order.status || 'pending').toLowerCase();
  const isCancelled = s === 'cancelled';

  // 7-Stage Visual Timeline
  const stages = [
    {
      key: 'placed',
      label: 'Order Placed',
      status: 'completed',
      date: order.createdAt,
    },
    {
      key: 'confirmed',
      label: 'Order Confirmed',
      status: isCancelled
        ? 'cancelled'
        : ['confirmed', 'processing', 'packed', 'ready_to_dispatch', 'dispatched', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed'].includes(s)
        ? 'completed'
        : s === 'pending'
        ? 'active'
        : 'pending',
      date: order.createdAt,
    },
    {
      key: 'processing',
      label: 'Processing (Crafting & Quality Check)',
      status: isCancelled
        ? 'cancelled'
        : ['processing', 'packed', 'ready_to_dispatch', 'dispatched', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed'].includes(s)
        ? (['processing'].includes(s) ? 'active' : 'completed')
        : 'pending',
      date: order.updatedAt || order.createdAt,
    },
    {
      key: 'ready_to_dispatch',
      label: 'Ready to Dispatch',
      status: isCancelled
        ? 'cancelled'
        : ['packed', 'ready_to_dispatch', 'dispatched', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed'].includes(s)
        ? (['packed', 'ready_to_dispatch'].includes(s) ? 'active' : 'completed')
        : 'pending',
      date: order.updatedAt,
    },
    {
      key: 'dispatched',
      label: 'Dispatched',
      status: isCancelled
        ? 'cancelled'
        : ['dispatched', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed'].includes(s)
        ? (['dispatched', 'shipped', 'in_transit'].includes(s) ? 'active' : 'completed')
        : 'pending',
      date: order.dispatchDate || order.updatedAt,
    },
    {
      key: 'out_for_delivery',
      label: 'Out for Delivery',
      status: isCancelled
        ? 'cancelled'
        : ['out_for_delivery', 'delivered', 'completed'].includes(s)
        ? (s === 'out_for_delivery' ? 'active' : 'completed')
        : 'pending',
      date: order.updatedAt,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      status: isCancelled ? 'cancelled' : ['delivered', 'completed'].includes(s) ? 'completed' : 'pending',
      date: order.deliveryDate || order.updatedAt,
    },
  ];

  res.json({
    success: true,
    order,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    city: order.shippingAddress?.city,
    shippingAddress: order.shippingAddress,
    status: order.status,
    trackingNumber: order.trackingNumber,
    courierName: order.courierName || order.courier,
    courier: order.courier || order.courierName,
    dispatchDate: order.dispatchDate,
    deliveryDate: order.deliveryDate,
    expectedDelivery: order.expectedDelivery || order.estimatedDelivery,
    estimatedDelivery: order.estimatedDelivery || order.expectedDelivery,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    total: order.total,
    items: order.items,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    notes: order.notes,
    stages,
    timeline: order.timeline || [],
    trackingHistory: order.timeline || [],
  });
});

// Customer's Personal Orders
router.get('/my-orders', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const userOrders = db.orders.filter(
    (o) =>
      o.customerId === req.user?.id ||
      o.customerEmail.toLowerCase() === req.user?.email.toLowerCase()
  );
  res.json(userOrders);
});

// Single Order Details
router.get('/:id', (req, res) => {
  const db = getDb();
  const order = db.orders.find(
    (o) => o.id === req.params.id || o.orderNumber === req.params.id
  );
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(order);
});

// Request 7-Day Return
router.post('/:id/return', requireAuth, (req: AuthenticatedRequest, res) => {
  const { reason, details } = req.body;
  if (!reason) {
    res.status(400).json({ error: 'Return reason is required' });
    return;
  }

  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  order.returnRequested = true;
  order.returnReason = reason;
  order.returnDetails = details;
  order.returnStatus = 'pending';
  order.status = 'return_requested';
  order.updatedAt = new Date().toISOString();

  // Audit
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user?.email || 'customer',
    action: 'RETURN_REQUESTED',
    entityType: 'Order',
    entityId: order.orderNumber,
    details: `Customer requested return for reason: ${reason}`,
    timestamp: new Date().toISOString(),
  });

  saveDatabase();

  res.json({ message: 'Return request submitted. Our team will coordinate courier pickup.', order });
});

// Cancel Order by Customer
router.post('/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
  const { reason } = req.body;
  const db = getDb();
  const userId = req.user?.id;
  const userEmail = req.user?.email?.toLowerCase();
  const orderId = req.params.id;

  const order = (db.orders || []).find(
    (o) => o.id === orderId || o.orderNumber === orderId
  );

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const isOwner =
    (userId && order.customerId === userId) ||
    (userEmail && order.customerEmail && order.customerEmail.toLowerCase() === userEmail);

  if (!isOwner) {
    res.status(403).json({ error: 'Access denied to this order' });
    return;
  }

  if (order.status === 'cancelled') {
    res.status(400).json({ error: 'Order is already cancelled', order });
    return;
  }

  if (['shipped', 'out_for_delivery', 'delivered', 'completed'].includes(order.status)) {
    res.status(400).json({
      error: `Order cannot be cancelled because it is already ${order.status.replace('_', ' ')}. You may request a return once delivered.`,
    });
    return;
  }

  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    status: 'cancelled',
    timestamp: new Date().toISOString(),
    updatedBy: req.user?.name || req.user?.email || 'Customer',
    note: reason || 'Cancelled by customer from dashboard',
  });

  // Restore inventory
  for (const it of order.items || []) {
    const prod = (db.products || []).find((p) => p.id === it.productId);
    if (prod) {
      prod.stock = (prod.stock || 0) + (it.quantity || 1);
      if (prod.stock > 0) prod.stockStatus = 'in_stock';

      if (!db.inventoryTransactions) db.inventoryTransactions = [];
      db.inventoryTransactions.unshift({
        id: `txn_rest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        change: it.quantity || 1,
        previousStock: prod.stock - (it.quantity || 1),
        newStock: prod.stock,
        reason: 'Order Cancelled',
        performedByName: req.user?.name || req.user?.email || 'Customer',
        adminEmail: req.user?.email || 'customer@fawnic.pk',
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user?.email || 'Customer',
    action: 'ORDER_CANCELLED_BY_CUSTOMER',
    entityType: 'Order',
    entityId: order.orderNumber,
    details: `Customer cancelled order. Reason: ${reason || 'Not specified'}`,
    timestamp: new Date().toISOString(),
  });

  saveDatabase();

  res.json({ message: 'Order successfully cancelled', order });
});

// Upload or Submit Payment Proof for Bank Transfer Order
router.post('/:id/payment-proof', (req, res) => {
  const { paymentProof, bankTxRef } = req.body;
  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (!paymentProof && !bankTxRef) {
    res.status(400).json({ error: 'Either payment proof receipt image or bank transaction reference is required' });
    return;
  }

  if (paymentProof) {
    order.paymentProof = paymentProof;
    order.paymentProofSubmittedAt = new Date().toISOString();
  }
  if (bankTxRef) {
    order.bankTxRef = bankTxRef.trim();
  }

  // Update payment status to pending_verification if not yet verified
  if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'pending_verification';
  }

  order.updatedAt = new Date().toISOString();

  if (!order.timeline) order.timeline = [];
  order.timeline.unshift({
    status: order.status,
    timestamp: new Date().toISOString(),
    updatedBy: 'Customer',
    note: `Bank transfer payment proof submitted.${bankTxRef ? ` Ref: ${bankTxRef}.` : ''} Verification pending by atelier concierge.`,
    location: `${order.shippingAddress?.city || 'Karachi'}, Pakistan`,
  });

  saveDatabase();
  res.json({ success: true, message: 'Payment proof submitted successfully. Atelier staff will verify shortly.', order });
});

export default router;
