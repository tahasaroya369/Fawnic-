import { getDb, saveDatabase } from './db.js';
import { broadcastNotificationEvent, broadcastAdminNotificationStats } from './websocket.js';
import type { Order, NotificationRecord } from '../src/types.js';

export function createOrderNotification(
  order: Order,
  status: string,
  extra?: { courierName?: string; trackingNumber?: string; notes?: string }
): NotificationRecord | null {
  const db = getDb();
  if (!db.notifications) db.notifications = [];

  // Idempotency: Prevent duplicate notifications for the exact same order and status
  const existing = db.notifications.find(
    (n) => n.orderId === order.id && n.orderStatus === status
  );
  if (existing) {
    return existing;
  }

  let title = `Order Update: #${order.orderNumber}`;
  let message = `Your order #${order.orderNumber} status has been updated to ${status}.`;

  const trackingInfo = extra?.trackingNumber
    ? ` Tracking #: ${extra.trackingNumber} (${extra.courierName || 'Express Courier'})`
    : order.trackingNumber
    ? ` Tracking #: ${order.trackingNumber}`
    : '';

  switch (status.toLowerCase()) {
    case 'received':
    case 'pending':
      title = 'Order Placed Successfully';
      message = `Your bespoke leather order #${order.orderNumber} for Rs. ${order.total.toLocaleString()} has been received and logged in our atelier.`;
      break;
    case 'confirmed':
      title = 'Order Confirmed';
      message = `Your order #${order.orderNumber} has been confirmed. Our leather artisans are preparing your selection.`;
      break;
    case 'processing':
    case 'in_production':
      title = 'Atelier Crafting & Inspection';
      message = `Order #${order.orderNumber} is currently undergoing leather inspection and edge finishing.`;
      break;
    case 'ready_dispatch':
    case 'packed':
      title = 'Order Packed & Ready for Dispatch';
      message = `Your order #${order.orderNumber} has been packaged in signature FAWNIC presentation boxes.`;
      break;
    case 'dispatched':
    case 'shipped':
      title = 'Order Dispatched';
      message = `Order #${order.orderNumber} has been dispatched for delivery.${trackingInfo ? ` ${trackingInfo}.` : ''}`;
      break;
    case 'delivered':
      title = 'Order Delivered Successfully';
      message = `Consignment for order #${order.orderNumber} was delivered to your address. Thank you for choosing FAWNIC.`;
      break;
    case 'cancelled':
      title = 'Order Cancelled';
      message = `Order #${order.orderNumber} has been cancelled.${extra?.notes ? ` Reason: ${extra.notes}` : ''}`;
      break;
    case 'returned':
    case 'return_approved':
      title = 'Return Request Processed';
      message = `Return for order #${order.orderNumber} has been received and processed by our quality team.`;
      break;
  }

  const newNotif: NotificationRecord = {
    id: `notif_ord_${order.id}_${status}_${Date.now()}`,
    title,
    message,
    type: 'Order Update',
    link: `/track/${order.orderNumber}`,
    buttonText: 'TRACK CONSIGNMENT',
    audience: 'specific',
    targetUserIds: order.customerId ? [order.customerId] : [],
    targetUserNames: [order.customerName],
    status: 'published',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'Atelier Order System',
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: status,
  };

  db.notifications.unshift(newNotif);
  saveDatabase();

  // Real-time broadcast to the customer socket
  broadcastNotificationEvent({
    action: 'created',
    notification: newNotif,
  });
  broadcastAdminNotificationStats();

  return newNotif;
}
