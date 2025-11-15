/**
 * WebSocket Service for Real-time Updates
 * Manages WebSocket connection with automatic reconnection
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = null;
    this.reconnectInterval = 5000;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.messageHandlers = [];
    this.connectionChangeHandlers = [];
    this.reconnectTimer = null;
    this.isIntentionallyClosed = false;
  }

  /**
   * Connect to WebSocket server
   */
  connect(url) {
    this.url = url;
    this.isIntentionallyClosed = false;

    try {
      console.log(`Connecting to WebSocket: ${url}`);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyConnectionChange(true);

        // Send initial message
        this.send({
          type: 'subscribe',
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          this.notifyMessageHandlers(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        this.notifyConnectionChange(false);

        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts),
      30000
    );

    console.log(`Scheduling reconnection in ${delay / 1000}s (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.url) {
        this.connect(this.url);
      }
    }, delay);
  }

  /**
   * Send message through WebSocket
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(message);
        console.log('WebSocket message sent:', data);
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket is not connected');
      return false;
    }
  }

  /**
   * Subscribe to specific bearing updates
   */
  subscribeToBearing(bearingId) {
    return this.send({
      type: 'subscribe',
      bearing_id: bearingId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from specific bearing updates
   */
  unsubscribeFromBearing(bearingId) {
    return this.send({
      type: 'unsubscribe',
      bearing_id: bearingId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Register message handler
   */
  onMessage(handler) {
    if (typeof handler === 'function') {
      this.messageHandlers.push(handler);
    }
  }

  /**
   * Remove message handler
   */
  offMessage(handler) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  /**
   * Register connection change handler
   */
  onConnectionChange(handler) {
    if (typeof handler === 'function') {
      this.connectionChangeHandlers.push(handler);
    }
  }

  /**
   * Remove connection change handler
   */
  offConnectionChange(handler) {
    this.connectionChangeHandlers = this.connectionChangeHandlers.filter(h => h !== handler);
  }

  /**
   * Notify all message handlers
   */
  notifyMessageHandlers(data) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  /**
   * Notify all connection change handlers
   */
  notifyConnectionChange(isConnected) {
    this.connectionChangeHandlers.forEach(handler => {
      try {
        handler(isConnected);
      } catch (error) {
        console.error('Error in connection change handler:', error);
      }
    });
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    console.log('Disconnecting WebSocket');
    this.isIntentionallyClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnecting');
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      this.ws = null;
    }

    this.messageHandlers = [];
    this.connectionChangeHandlers = [];
    this.reconnectAttempts = 0;
  }

  /**
   * Manually trigger reconnection
   */
  reconnect() {
    console.log('Manual reconnection triggered');
    this.disconnect();
    this.isIntentionallyClosed = false;
    if (this.url) {
      this.connect(this.url);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

// Create and export a singleton instance
export const websocketService = new WebSocketService();

// Export the class for testing purposes
export default WebSocketService;
