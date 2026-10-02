import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { getSession } from './auth.js';
import type { NotificationRecord, Order } from '../src/types.js';

interface ClientConnection {
  ws: WebSocket;
  id: string;
  userId?: string;
  email?: string;
  role?: 'customer' | 'admin' | 'staff' | 'guest';
  isAlive: boolean;
}

const clients = new Map<string, ClientConnection>();
let wss: WebSocketServer | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;

export function initWebSocketServer(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    if (url.pathname === '/ws/notifications' || url.pathname === '/ws') {
      wss!.handleUpgrade(request, socket, head, (ws) => {
        wss!.emit('connection', ws, request);
      });
    } else {
      // Allow Vite or other upgrades to proceed
      return;
    }
  });

  wss.on('connection', (ws: WebSocket, request) => {
    const connId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    const client: ClientConnection = {
      ws,
      id: connId,
      role: 'guest',
      isAlive: true,
    };

    if (token) {
      const session = getSession(token);
      if (session) {
        client.userId = session.userId;
        client.email = session.email;
        client.role = session.role;
      }
    }

    clients.set(connId, client);

    // Send connection acknowledgement
    sendToSocket(ws, {
      type: 'connected',
      connId,
      authenticated: Boolean(client.userId),
      role: client.role,
    });

    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('message', (data: Buffer | string) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === 'auth') {
          const session = getSession(payload.token);
          if (session) {
            client.userId = session.userId;
            client.email = session.email;
            client.role = session.role;
            sendToSocket(ws, {
              type: 'auth_success',
              userId: session.userId,
              role: session.role,
            });
          } else {
            client.userId = undefined;
            client.email = undefined;
            client.role = 'guest';
            sendToSocket(ws, { type: 'auth_guest' });
          }
        } else if (payload.type === 'ping') {
          client.isAlive = true;
          sendToSocket(ws, { type: 'pong', timestamp: Date.now() });
        }
      } catch (e) {
        // Ignore non-json or malformed
      }
    });

    ws.on('close', () => {
      clients.delete(connId);
    });

    ws.on('error', () => {
      clients.delete(connId);
    });
  });

  // Keep-alive heartbeat every 25 seconds
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    clients.forEach((client, id) => {
      if (!client.isAlive) {
        client.ws.terminate();
        clients.delete(id);
        return;
      }
      client.isAlive = false;
      try {
        client.ws.ping();
      } catch {
        clients.delete(id);
      }
    });
  }, 25000);

  return wss;
}

function sendToSocket(ws: WebSocket, message: any): void {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // Ignore transient socket write errors
    }
  }
}

export interface BroadcastNotificationPayload {
  action: 'created' | 'updated' | 'deleted' | 'read' | 'read_all';
  notification?: NotificationRecord;
  notificationId?: string;
  userId?: string;
}

/**
 * Broadcasts a notification event strictly respecting audience targeting and role boundaries:
 * - Drafts/Scheduled are only sent to admins.
 * - Published 'all' are sent to everyone (including guests).
 * - Published 'registered' are sent to authenticated customers and admins.
 * - Published 'specific' or order notifications are sent ONLY to the target customer(s) and admins.
 * - Never leaks private order data to other customers or guests.
 */
export function broadcastNotificationEvent(payload: BroadcastNotificationPayload): void {
  const { action, notification, notificationId, userId } = payload;

  clients.forEach((client) => {
    const isAdmin = client.role === 'admin' || client.role === 'staff';

    // 1. Read / Read-all event targeted to a specific customer's session
    if (action === 'read' || action === 'read_all') {
      if (isAdmin || (client.userId && client.userId === userId)) {
        sendToSocket(client.ws, {
          type: action === 'read' ? 'notification:read' : 'notification:read_all',
          notificationId,
          userId,
          timestamp: Date.now(),
        });
      }
      return;
    }

    // 2. Delete event
    if (action === 'deleted') {
      sendToSocket(client.ws, {
        type: 'notification:delete',
        notificationId,
        timestamp: Date.now(),
      });
      return;
    }

    // 3. Created / Updated events
    if (!notification) return;

    // Non-published items (draft/scheduled/expired) are sent only to administrators
    if (notification.status !== 'published') {
      if (isAdmin) {
        sendToSocket(client.ws, {
          type: action === 'created' ? 'notification:new' : 'notification:update',
          notification,
          isAdminPreview: true,
          timestamp: Date.now(),
        });
      } else if (action === 'updated') {
        // If it was published and now became draft or expired, tell customers to remove it
        sendToSocket(client.ws, {
          type: 'notification:delete',
          notificationId: notification.id,
          timestamp: Date.now(),
        });
      }
      return;
    }

    // Published notifications: Audience checks
    // If targeted to administrators only (audience === 'admin' or admin link)
    if (notification.audience === 'admin' || notification.link?.includes('aliadmin')) {
      if (isAdmin) {
        sendToSocket(client.ws, {
          type: action === 'created' ? 'notification:new' : 'notification:update',
          notification,
          isAdminPreview: true,
          timestamp: Date.now(),
        });
      }
      return;
    }

    // Query replies belong strictly to private support tickets (Profile -> My Queries), NEVER header notifications
    if (
      !isAdmin &&
      (notification.type === 'Customer Service' ||
        (notification as any).type === 'Query Reply' ||
        (notification as any).type === 'QUERY_REPLY' ||
        notification.link?.includes('tab=queries') ||
        notification.title?.toLowerCase().includes('query'))
    ) {
      return;
    }

    let shouldDeliver = false;

    if (isAdmin) {
      shouldDeliver = true;
    } else if (notification.audience === 'all') {
      // Public broadcast to all customers & guests (marketing, general announcements)
      shouldDeliver = true;
    } else if (notification.audience === 'registered') {
      // Only authenticated users
      shouldDeliver = Boolean(client.userId);
    } else if (notification.audience === 'specific') {
      // Only users listed in targetUserIds
      if (client.userId && notification.targetUserIds && notification.targetUserIds.includes(client.userId)) {
        shouldDeliver = true;
      }
    }

    // Security check: Private order updates or customer service replies must NEVER be sent to another customer or guest
    if (
      notification.type === 'Order Update' ||
      notification.type === 'Customer Service' ||
      (notification as any).type === 'Query Reply' ||
      notification.orderId
    ) {
      if (!isAdmin && (!client.userId || !notification.targetUserIds || !notification.targetUserIds.includes(client.userId))) {
        shouldDeliver = false;
      }
    }

    if (shouldDeliver) {
      sendToSocket(client.ws, {
        type: action === 'created' ? 'notification:new' : 'notification:update',
        notification,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Broadcasts admin stats refresh notification to all active admin/staff dashboards
 */
export function broadcastAdminNotificationStats(): void {
  clients.forEach((client) => {
    if (client.role === 'admin' || client.role === 'staff') {
      sendToSocket(client.ws, {
        type: 'admin:stats_update',
        timestamp: Date.now(),
      });
    }
  });
}

export interface BroadcastQueryPayload {
  action: 'created' | 'updated' | 'deleted' | 'message';
  query?: any;
  queryId?: string;
  message?: any;
  targetCustomerId?: string;
  stats?: any;
}

/**
 * Broadcasts query events in real-time to admin/staff consoles and relevant customer accounts.
 * Internal admin notes are strictly stripped before delivery to customers.
 */
export function broadcastQueryEvent(payload: BroadcastQueryPayload): void {
  const { action, query, queryId, message, targetCustomerId, stats } = payload;
  const effectiveCustomerId = targetCustomerId || query?.customerId;

  clients.forEach((client) => {
    const isAdmin = client.role === 'admin' || client.role === 'staff';
    const isOwnerCustomer = Boolean(client.userId && effectiveCustomerId && client.userId === effectiveCustomerId);

    // 1. Admin/Staff receives full query with internal notes and admin indicators
    if (isAdmin) {
      sendToSocket(client.ws, {
        type: `query:${action}`,
        action,
        query,
        queryId: queryId || query?.id,
        message,
        stats,
        timestamp: Date.now(),
      });
      return;
    }

    // 2. Customer receives only their own query, with internalNotes removed
    if (isOwnerCustomer) {
      const sanitizedQuery = query
        ? {
            ...query,
            internalNotes: undefined,
          }
        : undefined;

      sendToSocket(client.ws, {
        type: `query:${action}`,
        action,
        query: sanitizedQuery,
        queryId: queryId || query?.id,
        message,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Realtime order update broadcast:
 * Delivers order tracking / status changes to:
 * 1) Administrators & Staff (for instant order table update)
 * 2) The authenticated customer who owns this order (identified by userId or customerEmail)
 * Strictly protects privacy so other customers never see this order update.
 */
export function broadcastOrderUpdate(order: Order): void {
  clients.forEach((client) => {
    const isAdmin = client.role === 'admin' || client.role === 'staff';
    const isOwnerCustomer = Boolean(
      (client.userId && order.customerId && client.userId === order.customerId) ||
      (client.email && order.customerEmail && client.email.toLowerCase() === order.customerEmail.toLowerCase())
    );

    if (isAdmin || isOwnerCustomer) {
      sendToSocket(client.ws, {
        type: 'order:updated',
        order,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Realtime Product Synchronization Broadcast
 * Broadcasts product creation, modification, stock changes, and deletion
 * to all connected clients immediately so users and admins see updates without reloading.
 */
export interface BroadcastProductPayload {
  action: 'created' | 'updated' | 'deleted' | 'inventory';
  product?: any;
  productId?: string;
  products?: any[];
}

export function broadcastProductEvent(payload: BroadcastProductPayload): void {
  clients.forEach((client) => {
    sendToSocket(client.ws, {
      type: 'product:change',
      action: payload.action,
      product: payload.product,
      productId: payload.productId || payload.product?.id,
      products: payload.products,
      timestamp: Date.now(),
    });
  });
}

/**
 * Realtime Category Synchronization Broadcast
 */
export interface BroadcastCategoryPayload {
  action: 'created' | 'updated' | 'deleted';
  category?: any;
  categoryId?: string;
  categories?: any[];
}

export function broadcastCategoryEvent(payload: BroadcastCategoryPayload): void {
  clients.forEach((client) => {
    sendToSocket(client.ws, {
      type: 'category:change',
      action: payload.action,
      category: payload.category,
      categoryId: payload.categoryId || payload.category?.id,
      categories: payload.categories,
      timestamp: Date.now(),
    });
  });
}

/**
 * Realtime Settings Synchronization Broadcast (bank details, cashback, policies)
 */
export function broadcastSettingsEvent(payload: { settings: any }): void {
  clients.forEach((client) => {
    sendToSocket(client.ws, {
      type: 'settings:change',
      settings: payload.settings,
      timestamp: Date.now(),
    });
  });
}


