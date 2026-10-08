import express from 'express';
import { getDb, saveDatabase, saveDatabaseAsync } from '../db.js';
import { isNeonConfigured, getOrdersFromNeon, getNotificationsFromNeon } from '../storage/neon.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware.js';
import type { Address, NotificationItem } from '../../src/types.js';
import { broadcastNotificationEvent } from '../websocket.js';

const router = express.Router();

// ==========================================
// CUSTOMER ORDERS ENDPOINTS (/api/customer/orders)
// ==========================================

// Get Customer's Personal Orders
router.get('/orders', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (isNeonConfigured()) {
    try {
      const neonOrders = await getOrdersFromNeon();
      if (Array.isArray(neonOrders)) {
        getDb().orders = neonOrders;
      }
    } catch {}
  }
  const db = getDb();
  const userId = req.user?.id;
  const userEmail = req.user?.email?.toLowerCase();

  const userOrders = (db.orders || []).filter((o) => {
    if (userId && o.customerId === userId) return true;
    if (userEmail && o.customerEmail && o.customerEmail.toLowerCase() === userEmail) return true;
    return false;
  });

  // Sort newest first
  userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(userOrders);
});

// Single Order Details
router.get('/orders/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (isNeonConfigured()) {
    try {
      const neonOrders = await getOrdersFromNeon();
      if (Array.isArray(neonOrders)) {
        getDb().orders = neonOrders;
      }
    } catch {}
  }
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
    (userEmail && order.customerEmail && order.customerEmail.toLowerCase() === userEmail) ||
    (req.user as any)?.role === 'admin' ||
    (req.user as any)?.role === 'super_admin';

  if (!isOwner) {
    res.status(403).json({ error: 'Access denied to this order' });
    return;
  }

  res.json(order);
});

// Cancel Order by Customer
router.post('/orders/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
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

// Request 7-Day Return by Customer
router.post('/orders/:id/return', requireAuth, (req: AuthenticatedRequest, res) => {
  const { reason, details } = req.body;
  if (!reason) {
    res.status(400).json({ error: 'Return reason is required' });
    return;
  }

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

  order.returnRequested = true;
  order.returnReason = reason;
  order.returnDetails = details || '';
  order.returnStatus = 'pending';
  order.status = 'return_requested';
  order.updatedAt = new Date().toISOString();

  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    status: 'return_requested',
    timestamp: new Date().toISOString(),
    updatedBy: req.user?.name || req.user?.email || 'Customer',
    note: `Return requested. Reason: ${reason}${details ? ` (${details})` : ''}`,
  });

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user?.email || 'Customer',
    action: 'RETURN_REQUESTED',
    entityType: 'Order',
    entityId: order.orderNumber,
    details: `Customer requested return for reason: ${reason}`,
    timestamp: new Date().toISOString(),
  });

  saveDatabase();

  res.json({ message: 'Return request submitted. Our team will coordinate courier pickup.', order });
});

// Get Customer's Returns List
router.get('/returns', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const userId = req.user?.id;
  const userEmail = req.user?.email?.toLowerCase();

  const userReturns = (db.orders || []).filter((o) => {
    const isOwner =
      (userId && o.customerId === userId) ||
      (userEmail && o.customerEmail && o.customerEmail.toLowerCase() === userEmail);
    if (!isOwner) return false;

    return (
      o.returnRequested === true ||
      ['return_requested', 'returned', 'refunded'].includes(o.status) ||
      (o.returnStatus && o.returnStatus !== 'none')
    );
  });

  userReturns.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  res.json(userReturns);
});

// ==========================================
// CUSTOMER ADDRESSES ENDPOINTS (/api/customer/addresses)
// ==========================================

// Get Saved Addresses
router.get('/addresses', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const list = db.addresses.filter((a) => a.userId === req.user?.id);
  res.json(list);
});

// Add Address
router.post('/addresses', requireAuth, (req: AuthenticatedRequest, res) => {
  const recipientName = (req.body.recipientName || req.body.fullName || '').trim();
  const phone = (req.body.phone || '').trim();
  const province = (req.body.province || '').trim();
  const city = (req.body.city || '').trim();
  const streetAddress = (req.body.streetAddress || req.body.addressLine1 || '').trim();
  const houseNumber = (req.body.houseNumber || req.body.addressLine2 || '').trim();
  const postalCode = (req.body.postalCode || '75500').trim();
  const landmark = (req.body.landmark || '').trim();
  const label = req.body.label || 'Home';
  const area = (req.body.area || '').trim();
  const isDefault = Boolean(req.body.isDefault);

  if (!recipientName || !phone || !province || !city || !streetAddress) {
    res.status(400).json({ error: 'Missing mandatory address fields (name, phone, province, city, street address)' });
    return;
  }

  const db = getDb();

  if (isDefault) {
    db.addresses.forEach((a) => {
      if (a.userId === req.user?.id) a.isDefault = false;
    });
  }

  const newAddress: Address = {
    id: `addr_${Date.now()}`,
    userId: req.user?.id,
    label,
    recipientName,
    fullName: recipientName,
    phone,
    province,
    city,
    area: area || undefined,
    streetAddress,
    addressLine1: streetAddress,
    houseNumber: houseNumber || undefined,
    addressLine2: houseNumber || undefined,
    postalCode,
    landmark: landmark || undefined,
    isDefault,
  };

  db.addresses.push(newAddress);
  saveDatabase();

  // Return the updated list of addresses for this user
  const updatedList = db.addresses.filter((a) => a.userId === req.user?.id);
  res.status(201).json(updatedList);
});

// Update Address
router.put('/addresses/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const address = db.addresses.find((a) => a.id === req.params.id && a.userId === req.user?.id);

  if (!address) {
    res.status(404).json({ error: 'Address not found' });
    return;
  }

  if (req.body.isDefault) {
    db.addresses.forEach((a) => {
      if (a.userId === req.user?.id) a.isDefault = false;
    });
  }

  const recipientName = req.body.recipientName || req.body.fullName || address.recipientName || address.fullName;
  const streetAddress = req.body.streetAddress || req.body.addressLine1 || address.streetAddress || address.addressLine1;
  const houseNumber = req.body.houseNumber || req.body.addressLine2 || address.houseNumber || address.addressLine2;

  Object.assign(address, req.body, {
    recipientName,
    fullName: recipientName,
    streetAddress,
    addressLine1: streetAddress,
    houseNumber,
    addressLine2: houseNumber,
  });

  saveDatabase();

  const updatedList = db.addresses.filter((a) => a.userId === req.user?.id);
  res.json(updatedList);
});

// Delete Address
router.delete('/addresses/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.addresses.findIndex((a) => a.id === req.params.id && a.userId === req.user?.id);

  if (idx === -1) {
    res.status(404).json({ error: 'Address not found' });
    return;
  }

  db.addresses.splice(idx, 1);
  saveDatabase();

  const updatedList = db.addresses.filter((a) => a.userId === req.user?.id);
  res.json(updatedList);
});

// Get Wishlist
router.get('/wishlist', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const productIds = db.wishlists[req.user!.id] || [];
  const products = db.products.filter((p) => productIds.includes(p.id));
  res.json({ productIds, products });
});

// Toggle Wishlist Item
router.post('/wishlist/toggle', requireAuth, (req: AuthenticatedRequest, res) => {
  const { productId } = req.body;
  if (!productId) {
    res.status(400).json({ error: 'Product ID is required' });
    return;
  }

  const db = getDb();
  if (!db.wishlists[req.user!.id]) {
    db.wishlists[req.user!.id] = [];
  }

  const list = db.wishlists[req.user!.id];
  const idx = list.indexOf(productId);
  let isSaved = false;

  if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.push(productId);
    isSaved = true;
  }

  saveDatabase();
  res.json({ isSaved, productIds: list });
});

// Get Customer Notifications (Accessible by authenticated customer or guest)
router.get('/notifications', async (req: AuthenticatedRequest, res) => {
  if (isNeonConfigured()) {
    try {
      const neonNotifs = await getNotificationsFromNeon();
      if (Array.isArray(neonNotifs)) {
        getDb().notifications = neonNotifs;
      }
    } catch {}
  }
  const db = getDb();
  const userId = req.user?.id;
  const isRegistered = Boolean(userId);
  const now = new Date();

  const allNotifications = db.notifications || [];
  const readRecords = db.notificationReads || [];

  // Filter only active published notifications
  const eligible = allNotifications.filter((n) => {
    if (n.status !== 'published') return false;

    // Never expose admin-internal notifications, query alerts, or admin dashboard links to customers
    if (n.audience === 'admin' || n.link?.includes('aliadmin') || (n as any).targetRoles?.includes('admin')) {
      return false;
    }

    // STRICT REQUIREMENT: Contact query replies and support tickets must NEVER appear in header notifications
    if (
      n.type === 'Customer Service' ||
      (n.type as any) === 'Query Reply' ||
      (n.type as any) === 'QUERY_REPLY' ||
      n.id?.includes('_reply') ||
      n.id?.includes('_qry') ||
      n.id?.includes('_creply') ||
      n.title?.toLowerCase().includes('query') ||
      n.link?.includes('tab=queries') ||
      n.link?.includes('/queries')
    ) {
      return false;
    }

    // Check expiration
    if (n.expiresAt) {
      const expDate = new Date(n.expiresAt);
      if (expDate <= now) return false;
    }

    // Specific user targeted notifications (e.g. Order Updates or personalized customer perks)
    if (n.type === 'Order Update' || n.orderId || n.audience === 'specific') {
      return Boolean(userId && n.targetUserIds && n.targetUserIds.includes(userId));
    }

    // General audience targeting for public announcements and marketing
    if (n.audience === 'all') {
      return true;
    }

    if (n.audience === 'registered') {
      return isRegistered;
    }

    return false;
  });

  // Calculate read states per customer
  let unreadCount = 0;
  const mappedList: NotificationItem[] = eligible.map((n) => {
    let isRead = false;
    if (userId) {
      isRead = readRecords.some((r) => r.userId === userId && r.notificationId === n.id);
    }
    if (!isRead) {
      unreadCount++;
    }
    return {
      ...n,
      isRead,
    };
  });

  // Sort by newest first
  mappedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    notifications: mappedList,
    unreadCount,
    total: mappedList.length,
  });
});

// Mark Single Notification as Read for Current Customer
router.put('/notifications/:id/read', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const userId = req.user?.id;
  const notificationId = req.params.id;

  if (userId) {
    if (!db.notificationReads) db.notificationReads = [];
    const alreadyRead = db.notificationReads.some(
      (r) => r.userId === userId && r.notificationId === notificationId
    );
    if (!alreadyRead) {
      db.notificationReads.push({
        id: `${userId}_${notificationId}`,
        userId,
        notificationId,
        readAt: new Date().toISOString(),
      });
      saveDatabase();
    }

    // Broadcast real-time read event to user's connected sockets
    broadcastNotificationEvent({
      action: 'read',
      notificationId,
      userId,
    });
  }

  res.json({ success: true, notificationId });
});

// Mark All Notifications as Read for Current Customer
router.put('/notifications/mark-all-read', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const userId = req.user?.id;

  if (userId) {
    if (!db.notificationReads) db.notificationReads = [];
    const allNotifications = db.notifications || [];
    const now = new Date();

    // Find all active notifications for this user that are not yet marked as read
    const activeForUser = allNotifications.filter((n) => {
      if (n.status !== 'published') return false;
      if (n.expiresAt && new Date(n.expiresAt) <= now) return false;
      if (n.audience === 'all') {
        if (n.type === 'Order Update' || n.orderId) {
          return n.targetUserIds && n.targetUserIds.includes(userId);
        }
        return true;
      }
      if (n.audience === 'registered') return true;
      if (n.audience === 'specific' || n.type === 'Order Update') {
        return n.targetUserIds && n.targetUserIds.includes(userId);
      }
      return false;
    });

    activeForUser.forEach((n) => {
      const alreadyRead = db.notificationReads.some(
        (r) => r.userId === userId && r.notificationId === n.id
      );
      if (!alreadyRead) {
        db.notificationReads.push({
          id: `${userId}_${n.id}`,
          userId,
          notificationId: n.id,
          readAt: new Date().toISOString(),
        });
      }
    });

    saveDatabase();

    // Broadcast real-time read_all event
    broadcastNotificationEvent({
      action: 'read_all',
      userId,
    });
  }

  res.json({ success: true, unreadCount: 0 });
});

export default router;
