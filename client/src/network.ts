// ============================================
// VocaQuest Online - WebSocket Client
// ============================================

import { PacketType } from "@shared/types";
import { ClientConfig } from "./config";

type EventHandler = (data: any) => void;

class GameSocket {
  private ws: WebSocket | null = null;
  private connected = false;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: number | null = null;
  private intentionalClose = false;

  /** Connect to the game server */
  connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.intentionalClose = false;

    try {
      this.ws = new WebSocket(ClientConfig.SERVER_URL);
    } catch (err) {
      console.error("[Socket] Failed to create WebSocket:", err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log("[Socket] Connected to server");
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit("connected", null);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.onMessage(event.data);
    };

    this.ws.onclose = () => {
      console.log("[Socket] Disconnected from server");
      this.connected = false;
      this.emit("disconnected", null);

      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error("[Socket] Error:", err);
    };
  }

  /** Disconnect from the server */
  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  /** Send a packet to the server */
  send(type: PacketType, data?: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[Socket] Cannot send - not connected");
      return;
    }

    const packet = JSON.stringify({ type, data });
    this.ws.send(packet);
  }

  /** Register an event handler */
  on(type: string, handler: EventHandler): void {
    let handlers = this.eventHandlers.get(type);
    if (!handlers) {
      handlers = [];
      this.eventHandlers.set(type, handlers);
    }
    handlers.push(handler);
  }

  /** Remove an event handler */
  off(type: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(type);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /** Emit an event to all registered handlers */
  emit(type: string, data: any): void {
    const handlers = this.eventHandlers.get(type);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[Socket] Error in handler for "${type}":`, err);
      }
    }
  }

  /** Check if connected */
  isConnected(): boolean {
    return this.connected;
  }

  /** Handle incoming WebSocket message */
  private onMessage(raw: string): void {
    try {
      const packet = JSON.parse(raw);
      if (packet && packet.type) {
        this.emit(packet.type, packet.data);
      }
    } catch (err) {
      console.error("[Socket] Failed to parse message:", raw, err);
    }
  }

  /** Schedule a reconnection attempt with exponential backoff */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[Socket] Max reconnect attempts reached");
      this.emit("reconnect_failed", null);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(
      `[Socket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

// Singleton instance
export const socket = new GameSocket();
