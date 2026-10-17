import express from 'express';
import { getDb, saveDatabase, saveDatabaseAsync, getNextInvoiceNumber } from '../db.js';
import {
  isNeonConfigured,
  insertOrderInNeon,
  updateOrderInNeon,
  getOrdersFromNeon,
  getProductsFromNeon,
  adjustProductStockInNeon,
  insertInvoiceInNeon,
  getCouponsFromNeon,
  updateCouponInNeon,
  getUserByEmailInNeon,
} from '../storage/neon.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware.js';
import type { Order, OrderItem } from '../../src/types.js';
import { createOrderNotification } from '../orderNotificationHelper.js';
import { broadcastOrderUpdate, broadcastProductEvent } from '../websocket.js';

const router = express.Router();

// Create Order (Checkout)
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
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

    const resolvedName = (
      customerName ||
      shippingAddress?.fullName ||
      shippingAddress?.recipientName ||
      req.user?.name ||
      ''
    ).trim();

    const resolvedEmail = (
      customerEmail ||
      req.user?.email ||
      req.body.guestEmail ||
      ''
    ).trim().toLowerCase();

    const resolvedPhone = (
      customerPhone ||
      shippingAddress?.phone ||
      req.user?.phone ||
      ''
    ).trim();

    const resolvedCity = (shippingAddress?.city || '').trim();

    if (
      !resolvedName ||
      !resolvedEmail ||
      !resolvedPhone ||
      !shippingAddress ||
      !resolvedCity ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      res.status(400).json({
        error: 'Missing required order details. Customer name, email, phone, city, and cart items are required.',
      });
      return;
    }

    const resolvedShippingAddress = {
      ...shippingAddress,
      fullName: shippingAddress.fullName || shippingAddress.recipientName || resolvedName,
      recipientName: shippingAddress.recipientName || shippingAddress.fullName || resolvedName,
      phone: shippingAddress.phone || resolvedPhone,
      city: resolvedCity,
      province: (shippingAddress.province || 'Punjab').trim(),
    };

    const db = getDb();

    // Ensure latest products and stock from Neon if configured
    if (isNeonConfigured()) {
      try {
        const neonProducts = await getProductsFromNeon();
        if (Array.isArray(neonProducts) && neonProducts.length > 0) {
          db.products = neonProducts;
        }
      } catch (err: any) {
        console.warn('[Neon Sync] Product fetch note during checkout:', err.message);
      }
    }

    // Validate items and calculate subtotal
    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    for (const it of items) {
      const quantity = Math.max(1, Number(it.quantity) || 1);
      const product = db.products.find((p) => p.id === it.productId || p.sku === it.productId);
      if (!product) {
        res.status(404).json({ error: `Product not found: ${it.productName || it.productId}` });
        return;
      }

      if (product.stock < quantity) {
        res.status(400).json({
          error: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${quantity}.`,
        });
        return;
      }

      const price = product.salePrice || product.regularPrice;
      const itemSubtotal = price * quantity;
      subtotal += itemSubtotal;

      // Real inventory deduction
      product.stock -= quantity;
      if (product.stock === 0) {
        product.stockStatus = 'out_of_stock';
      } else if (product.stock <= product.lowStockThreshold) {
        product.stockStatus = 'low_stock';
      }

      const selectedVar = it.selectedVariation;
      const colorVal = it.selectedColor || selectedVar?.color || (selectedVar?.type !== 'size' && !selectedVar?.size ? selectedVar?.name : undefined) || it.selectedVariants?.['Color'];
      const sizeVal = it.selectedSize || selectedVar?.size || (selectedVar?.type === 'size' ? selectedVar?.name : undefined) || it.selectedVariants?.['Size'] || it.selectedVariants?.['Waist Size'];

      const variantParts: string[] = [];
      if (colorVal) variantParts.push(`Color: ${colorVal}`);
      if (sizeVal) variantParts.push(`Size: ${sizeVal}`);
      if (it.selectedVariants) {
        Object.entries(it.selectedVariants).forEach(([k, v]) => {
          if (k !== 'Color' && k !== 'Size' && k !== 'Waist Size') {
            variantParts.push(`${k}: ${v}`);
          }
        });
      }
      const variantText = it.variantInfo || (variantParts.length > 0 ? variantParts.join(' | ') : undefined);

      orderItems.push({
        productId: product.id,
        name: product.name,
        productName: product.name,
        image: selectedVar?.image || product.mainImage,
        productImage: selectedVar?.image || product.mainImage,
        sku: selectedVar?.sku || product.sku,
        variantInfo: variantText,
        selectedVariation: selectedVar,
        selectedColor: colorVal,
        selectedSize: sizeVal,
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

    // Coupon Discount Calculation & Strict Database Validation
    let discount = 0;
    let appliedCouponCode: string | undefined = undefined;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const code = couponCode.trim().toUpperCase();

      // Ensure fresh database coupons from Neon if configured
      if (isNeonConfigured()) {
        try {
          const liveCoupons = await getCouponsFromNeon();
          if (Array.isArray(liveCoupons)) {
            db.coupons = liveCoupons;
          }
        } catch (err: any) {
          console.warn('[Neon PostgreSQL] Error getting live coupons in order route:', err.message);
        }
      }

      const coupon = (db.coupons || []).find((c) => c.code.toUpperCase() === code);
      if (!coupon) {
        res.status(400).json({ error: `Promotional coupon "${code}" is invalid or does not exist.` });
        return;
      }

      if (!coupon.isActive) {
        res.status(400).json({ error: `Promotional coupon "${coupon.code}" is currently disabled or inactive.` });
        return;
      }

      const expiryStr = coupon.expiresAt || coupon.expiryDate;
      if (expiryStr) {
        const expiryDate = new Date(expiryStr);
        if (!isNaN(expiryDate.getTime()) && expiryDate.getTime() < Date.now()) {
          res.status(400).json({ error: `Promotional coupon "${coupon.code}" has expired.` });
          return;
        }
      }

      if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
        res.status(400).json({ error: `Promotional coupon "${coupon.code}" has reached its maximum usage limit.` });
        return;
      }

      const minRequired = Number(coupon.minOrderAmount) || 0;
      if (subtotal < minRequired) {
        res.status(400).json({
          error: `Coupon "${coupon.code}" requires a minimum order of Rs. ${minRequired.toLocaleString()}. (Current: Rs. ${subtotal.toLocaleString()})`,
        });
        return;
      }

      const isPercentage = coupon.type === 'percent' || coupon.type === 'percentage';
      if (isPercentage) {
        discount = Math.round((subtotal * Number(coupon.value)) / 100);
        if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
          discount = Number(coupon.maxDiscount);
        }
      } else {
        discount = Math.round(Number(coupon.value));
      }

      discount = Math.max(0, Math.min(discount, subtotal));
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      appliedCouponCode = coupon.code;

      if (isNeonConfigured()) {
        try {
          await updateCouponInNeon(coupon.id, { usedCount: coupon.usedCount, code: coupon.code });
        } catch (err: any) {
          console.warn('[Neon PostgreSQL] Error updating coupon used_count:', err.message);
        }
      }
    }

    const total = Math.max(0, subtotal + shippingFee - discount);

    // Link customer ID if authenticated or existing registered user
    let customerId = req.user?.id;
    if (!customerId && resolvedEmail) {
      let matched = (db.users || []).find((u) => u.email.toLowerCase() === resolvedEmail);
      if (!matched && isNeonConfigured()) {
        try {
          matched = await getUserByEmailInNeon(resolvedEmail);
          if (matched && !db.users.some((u) => u.id === matched.id)) {
            db.users.push(matched);
          }
        } catch (err: any) {
          console.warn('[Order Route] Customer lookup note:', err.message);
        }
      }
      if (matched) {
        customerId = matched.id;
      }
    }

    // Generate Unique Order Number
    const orderNum = `FWN-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: orderNum,
      customerId,
      customerName: resolvedName,
      customerEmail: resolvedEmail,
      customerPhone: resolvedPhone,
      shippingAddress: resolvedShippingAddress,
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

    if (!db.orders) db.orders = [];
    db.orders.unshift(newOrder);

    // Automatic Order Invoice Generation
    if (!db.invoices) db.invoices = [];
    const autoInvoiceNumber = getNextInvoiceNumber();
    const fullAddress = [
      shippingAddress.addressLine1 || shippingAddress.streetAddress || shippingAddress.houseNumber,
      shippingAddress.addressLine2 || shippingAddress.area,
      shippingAddress.landmark ? `(Near: ${shippingAddress.landmark})` : '',
      shippingAddress.city,
      shippingAddress.province,
      shippingAddress.postalCode,
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
    if (!db.auditLogs) db.auditLogs = [];
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminEmail: customerId || 'customer',
      action: 'NEW_ORDER_PLACED',
      entityType: 'Order',
      entityId: newOrder.orderNumber,
      details: `Order for Rs. ${total.toLocaleString()} placed by ${customerName} (${paymentMethod.toUpperCase()})`,
      timestamp: new Date().toISOString(),
    });

    // Permanently persist to Neon PostgreSQL
    if (isNeonConfigured()) {
      try {
        await insertOrderInNeon(newOrder);
        console.info(`[Neon PostgreSQL] Order permanently inserted: ${newOrder.orderNumber}`);
        for (const it of orderItems) {
          await adjustProductStockInNeon(
            it.productId,
            -it.quantity,
            'Order Placed',
            'online-checkout@fawnic.pk',
            `Order #${newOrder.orderNumber}`
          ).catch((e) => console.warn('[Stock Neon]:', e.message));
        }
        await insertInvoiceInNeon(autoInvoice).catch(() => {});
      } catch (neonErr: any) {
        console.error('[Neon PostgreSQL] Error inserting order in Neon:', neonErr.message);
        res.status(500).json({ error: 'Database failed to persist order: ' + neonErr.message });
        return;
      }
    }

    await saveDatabaseAsync();

    // Broadcast real-time order update to Admin and Customer panels
    broadcastOrderUpdate(newOrder);

    // Broadcast stock changes for affected items
    for (const it of orderItems) {
      const updatedProd = db.products.find((p) => p.id === it.productId);
      if (updatedProd) {
        broadcastProductEvent({
          action: 'inventory',
          productId: it.productId,
          product: updatedProd,
        });
      }
    }

    res.status(201).json({
      order: newOrder,
      message: 'Order placed successfully',
    });
  } catch (err: any) {
    console.error('[Order Placement Error]', err);
    res.status(500).json({ error: err.message || 'An error occurred while placing the order' });
  }
});

// Track Order (Public Lookup)
router.get('/track/:orderNumber', async (req, res) => {
  const db = getDb();
  if (isNeonConfigured()) {
    try {
      const neonOrders = await getOrdersFromNeon();
      if (Array.isArray(neonOrders)) {
        db.orders = neonOrders;
      }
    } catch {}
  }
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
router.get('/my-orders', requireAuth, async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (isNeonConfigured()) {
    try {
      const neonOrders = await getOrdersFromNeon();
      if (Array.isArray(neonOrders)) {
        db.orders = neonOrders;
      }
    } catch {}
  }
  const userOrders = db.orders.filter(
    (o) =>
      o.customerId === req.user?.id ||
      o.customerEmail.toLowerCase() === req.user?.email.toLowerCase()
  );
  res.json(userOrders);
});

// Single Order Details
router.get('/:id', async (req, res) => {
  const db = getDb();
  if (isNeonConfigured()) {
    try {
      const neonOrders = await getOrdersFromNeon();
      if (Array.isArray(neonOrders)) {
        db.orders = neonOrders;
      }
    } catch {}
  }
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
  if (!db.auditLogs) db.auditLogs = [];
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

import { cancelCustomerOrderCore } from '../services/orderCancellationService.js';

// Cancel Order by Customer
router.post('/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await cancelCustomerOrderCore({
      orderId: req.params.id,
      userId: req.user?.id,
      userEmail: req.user?.email,
      isAdmin: req.user?.role === 'admin',
      reason: req.body?.reason,
      cancelledByName: req.user?.name || req.user?.email,
    });

    if (!result.success) {
      res.status(result.statusCode).json({ error: result.error, order: result.order });
      return;
    }

    res.status(result.statusCode).json({
      success: true,
      message: result.message || 'Order successfully cancelled',
      order: result.order,
    });
  } catch (err: any) {
    console.error('[Order Cancel Error]', err);
    res.status(500).json({ error: err.message || 'Failed to cancel order' });
  }
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
