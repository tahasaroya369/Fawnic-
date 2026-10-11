import { getDb, saveDatabaseAsync } from '../db.js';
import {
  isNeonConfigured,
  cancelOrderInNeonTransaction,
} from '../storage/neon.js';
import { broadcastOrderUpdate, broadcastProductEvent } from '../websocket.js';
import { createOrderNotification } from '../orderNotificationHelper.js';
import type { Order } from '../../src/types.js';

export interface CancelOrderParams {
  orderId: string;
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
  reason?: string;
  cancelledByName?: string;
}

export interface CancelOrderResult {
  success: boolean;
  statusCode: number;
  message?: string;
  error?: string;
  order?: Order;
}

/**
 * Unified customer order cancellation service.
 * Handles atomic status transitions, ownership verification,
 * status validation rules, idempotent inventory restoration,
 * database persistence (both Neon and local JSON), and WebSocket notifications.
 */
export async function cancelCustomerOrderCore(params: CancelOrderParams): Promise<CancelOrderResult> {
  const { orderId, userId, userEmail, isAdmin = false, reason, cancelledByName } = params;

  if (!orderId || typeof orderId !== 'string') {
    return { success: false, statusCode: 400, error: 'Order ID is required' };
  }

  const lookupId = orderId.trim();
  const normalizedUserEmail = userEmail?.trim().toLowerCase();
  const normalizedName = cancelledByName || userEmail || 'Customer';
  const cancellationReason = (reason || 'Customer requested cancellation from dashboard').trim();

  // 1. If Neon PostgreSQL is configured, perform atomic row-locked transaction
  if (isNeonConfigured()) {
    try {
      const neonResult = await cancelOrderInNeonTransaction(
        lookupId,
        userId,
        normalizedUserEmail,
        isAdmin,
        cancellationReason,
        normalizedName
      );

      if (!neonResult.success) {
        return neonResult;
      }

      // Neon transaction succeeded. Synchronize local in-memory DB and broadcast events
      const db = getDb();
      if (neonResult.order) {
        const memoryOrder = (db.orders || []).find(
          (o) => o.id === neonResult.order!.id || o.orderNumber === neonResult.order!.orderNumber
        );
        if (memoryOrder) {
          memoryOrder.status = 'cancelled';
          memoryOrder.updatedAt = neonResult.order.updatedAt || new Date().toISOString();
          memoryOrder.timeline = neonResult.order.timeline || memoryOrder.timeline || [];
          memoryOrder.trackingHistory = neonResult.order.trackingHistory || memoryOrder.trackingHistory || [];
          (memoryOrder as any).stockRestored = true;
        } else {
          if (!db.orders) db.orders = [];
          db.orders.unshift(neonResult.order);
        }

        // Synchronize in-memory products stock
        for (const it of neonResult.order.items || []) {
          const prod = (db.products || []).find((p) => p.id === it.productId);
          if (prod) {
            prod.stock = (prod.stock || 0) + (it.quantity || 1);
            if (prod.stock > 0) prod.stockStatus = 'in_stock';
          }
        }
      }

      if (!db.auditLogs) db.auditLogs = [];
      db.auditLogs.unshift({
        id: `log_${Date.now()}`,
        adminEmail: userEmail || 'Customer',
        action: 'ORDER_CANCELLED_BY_CUSTOMER',
        entityType: 'Order',
        entityId: neonResult.order?.orderNumber || lookupId,
        details: `Customer cancelled order. Reason: ${cancellationReason}`,
        timestamp: new Date().toISOString(),
      });

      await saveDatabaseAsync();

      if (neonResult.order) {
        createOrderNotification(neonResult.order, 'cancelled', { notes: cancellationReason });
        broadcastOrderUpdate(neonResult.order);

        for (const it of neonResult.order.items || []) {
          const updatedProd = (db.products || []).find((p) => p.id === it.productId);
          if (updatedProd) {
            broadcastProductEvent({
              action: 'inventory',
              productId: it.productId,
              product: updatedProd,
            });
          }
        }
      }

      return neonResult;
    } catch (err: any) {
      console.error('[Neon Cancellation Error, falling back to local verification]:', err.message);
    }
  }

  // 2. In-Memory fallback / execution
  const db = getDb();
  const order = (db.orders || []).find(
    (o) => o.id === lookupId || o.orderNumber === lookupId
  );

  if (!order) {
    return { success: false, statusCode: 404, error: 'Order not found' };
  }

  // Ownership verification
  const normalizedOrderEmail = (order.customerEmail || '').trim().toLowerCase();
  const isOwner =
    isAdmin ||
    (userId && order.customerId === userId) ||
    (Boolean(normalizedUserEmail) && Boolean(normalizedOrderEmail) && normalizedUserEmail === normalizedOrderEmail);

  if (!isOwner) {
    return {
      success: false,
      statusCode: 403,
      error: 'Access denied: You can only cancel your own orders.',
    };
  }

  const currentStatus = (order.status || '').toLowerCase().trim();

  // Already cancelled
  if (currentStatus === 'cancelled') {
    return {
      success: false,
      statusCode: 400,
      error: 'Order is already cancelled',
      order,
    };
  }

  // 1. Packed: Cancellation NOT allowed
  if (['packed', 'ready', 'ready_to_dispatch'].includes(currentStatus)) {
    return {
      success: false,
      statusCode: 400,
      error: 'Order cannot be cancelled because it has already been packed for dispatch. Once packing begins, cancellations cannot be accepted.',
      order,
    };
  }

  // 2. Dispatched / Shipped / In Transit: Cancellation NOT allowed
  if (
    ['dispatched', 'shipped', 'in_transit'].includes(currentStatus) ||
    order.dispatchDate
  ) {
    const formatted = order.status ? order.status.replace(/_/g, ' ') : 'dispatched';
    return {
      success: false,
      statusCode: 400,
      error: `Order cannot be cancelled because it has already been dispatched (${formatted}). Consignments cannot be cancelled while in transit with courier. You may request a 7-day return once delivered.`,
      order,
    };
  }

  // 3. Out for delivery
  if (currentStatus === 'out_for_delivery') {
    return {
      success: false,
      statusCode: 400,
      error: 'Order cannot be cancelled because it is out for delivery with courier.',
      order,
    };
  }

  // 4. Delivered
  if (['delivered', 'completed'].includes(currentStatus)) {
    return {
      success: false,
      statusCode: 400,
      error: 'Delivered orders cannot be cancelled. You may request a 7-day return from your customer dashboard.',
      order,
    };
  }

  if (['return_requested', 'returned', 'refunded'].includes(currentStatus)) {
    return {
      success: false,
      statusCode: 400,
      error: `Order cannot be cancelled because it is in ${order.status.replace(/_/g, ' ')} state.`,
      order,
    };
  }

  // Allowed cancellation statuses: Pending & Processing (and confirmed/new)
  const ALLOWED_CANCELLATION_STATUSES = ['pending', 'processing', 'confirmed', 'new'];
  if (!ALLOWED_CANCELLATION_STATUSES.includes(currentStatus)) {
    return {
      success: false,
      statusCode: 400,
      error: `Order cannot be cancelled in its current state (${order.status}).`,
      order,
    };
  }

  // Apply cancellation
  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    status: 'cancelled',
    timestamp: new Date().toISOString(),
    updatedBy: normalizedName,
    note: cancellationReason,
    location: 'FAWNIC Atelier, Karachi',
  });
  if (!order.trackingHistory) order.trackingHistory = [];
  order.trackingHistory.push({
    status: 'cancelled',
    timestamp: new Date().toISOString(),
    updatedBy: normalizedName,
    note: cancellationReason,
    location: 'FAWNIC Atelier, Karachi',
  });

  // Restore inventory only if not already restored
  if (!(order as any).stockRestored) {
    (order as any).stockRestored = true;
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
          performedByName: normalizedName,
          adminEmail: userEmail || 'customer@fawnic.pk',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: userEmail || 'Customer',
    action: 'ORDER_CANCELLED_BY_CUSTOMER',
    entityType: 'Order',
    entityId: order.orderNumber,
    details: `Customer cancelled order. Reason: ${cancellationReason}`,
    timestamp: new Date().toISOString(),
  });

  await saveDatabaseAsync();

  // Realtime notification & updates
  createOrderNotification(order, 'cancelled', { notes: cancellationReason });
  broadcastOrderUpdate(order);

  for (const it of order.items || []) {
    const updatedProd = (db.products || []).find((p) => p.id === it.productId);
    if (updatedProd) {
      broadcastProductEvent({
        action: 'inventory',
        productId: it.productId,
        product: updatedProd,
      });
    }
  }

  return {
    success: true,
    statusCode: 200,
    message: 'Order successfully cancelled',
    order,
  };
}
