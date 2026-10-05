import type { NotificationItem } from '../types.js';

export type SocketEventHandler = (event: {
  type: string;
  notification?: NotificationItem;
  notificationId?: string;
  userId?: string;
  [key: string]: any;
}) => void;

class NotificationSocketService {
  private ws: WebSocket | null = null;
  private handlers = new Set<SocketEventHandler>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private currentToken: string | null = null;
  private isExplicitlyClosed = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private lastPolledTimestamp = Date.now() - 30000;
  private isPollingActive = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('fawnic_sync_channel');
        this.broadcastChannel.onmessage = (evt) => {
          if (evt.data) {
            this.processSyncEvent(evt.data, false);
          }
        };
      } catch {
        // Fallback gracefully if BroadcastChannel fails
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.pollSyncEvents();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.pollSyncEvents();
        }
      });
    }
  }

  public connect(token?: string | null) {
    this.currentToken = token || null;
    this.isExplicitlyClosed = false;

    // Start background fallback polling immediately so serverless Vercel deployments always sync
    this.startPolling();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        if (this.ws.readyState === WebSocket.OPEN && this.currentToken) {
          try {
            this.ws.send(JSON.stringify({ type: 'auth', token: this.currentToken }));
          } catch {}
        }
        return;
      }
    }

    // Attempt WebSocket connection for local development / Node server
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const query = this.currentToken ? `?token=${encodeURIComponent(this.currentToken)}` : '';
      const wsUrl = `${protocol}//${host}/ws/notifications${query}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.currentToken) {
          try {
            this.ws?.send(JSON.stringify({ type: 'auth', token: this.currentToken }));
          } catch {}
        }
      };

      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          this.processSyncEvent(data, true);
        } catch {}
      };

      this.ws.onclose = () => {
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // In serverless environments where WebSockets are unavailable, polling will handle synchronization
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  public processSyncEvent(data: any, broadcastToTabs = true) {
    if (!data || !data.type) return;

    if (broadcastToTabs && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch {}
    }

    // Real-time synchronization events dispatched to window
    if (data.type === 'product:change') {
      window.dispatchEvent(new CustomEvent('fawnic:product_change', { detail: data }));
    } else if (data.type === 'category:change') {
      window.dispatchEvent(new CustomEvent('fawnic:category_change', { detail: data }));
    } else if (data.type === 'settings:change') {
      window.dispatchEvent(new CustomEvent('fawnic:settings_change', { detail: data }));
    }

    this.handlers.forEach((h) => {
      try {
        h(data);
      } catch (err) {
        console.error('Error in socket event handler:', err);
      }
    });
  }

  public startPolling() {
    if (this.isPollingActive) return;
    this.isPollingActive = true;

    // Initial poll
    this.pollSyncEvents();

    if (this.pollTimer) clearInterval(this.pollTimer);
    // Poll every 5 seconds for reliable production synchronization across Vercel Lambdas
    this.pollTimer = setInterval(() => {
      this.pollSyncEvents();
    }, 5000);
  }

  public async pollSyncEvents() {
    try {
      const res = await fetch(`/api/sync/events?since=${this.lastPolledTimestamp}&limit=30`, {
        cache: 'no-store',
        headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data && data.success && Array.isArray(data.events)) {
        if (data.timestamp) {
          this.lastPolledTimestamp = data.timestamp;
        }
        for (const evt of data.events) {
          this.processSyncEvent(evt, false);
        }
      }
    } catch {
      // Non-fatal polling error
    }
  }

  public updateAuth(token: string | null) {
    this.currentToken = token;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'auth', token: this.currentToken }));
      } catch {}
    } else {
      this.connect(token);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.currentToken);
    }, delay);
  }

  public subscribe(handler: SocketEventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public emitLocalEvent(event: any) {
    this.processSyncEvent(event, true);
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      this.isPollingActive = false;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
    }
  }
}

export const notificationSocket = new NotificationSocketService();
export const notificationSocketService = notificationSocket;

export function emitSyncEvent(event: any) {
  notificationSocket.emitLocalEvent(event);
}
