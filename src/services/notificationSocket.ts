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
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private currentToken: string | null = null;
  private isExplicitlyClosed = false;

  public connect(token?: string | null) {
    this.currentToken = token || null;
    this.isExplicitlyClosed = false;

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        // If token changed, authenticate on existing socket
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'auth', token: this.currentToken }));
        }
        return;
      }
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const query = this.currentToken ? `?token=${encodeURIComponent(this.currentToken)}` : '';
      const wsUrl = `${protocol}//${host}/ws/notifications${query}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.currentToken) {
          this.ws?.send(JSON.stringify({ type: 'auth', token: this.currentToken }));
        }
      };

      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);

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
        } catch {
          // Ignore malformed
        }
      };

      this.ws.onclose = () => {
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  public updateAuth(token: string | null) {
    this.currentToken = token;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'auth', token: this.currentToken }));
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

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const notificationSocket = new NotificationSocketService();
export const notificationSocketService = notificationSocket;
