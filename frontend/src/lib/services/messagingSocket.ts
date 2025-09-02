import { io, Socket } from 'socket.io-client';
import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import { browser } from '$app/environment';

// Create a socket instance
let socket: Socket;

// Event handlers
const eventHandlers: Record<string, Function[]> = {};

// Create a socket instance that can be used throughout the app
export const messagingSocket = {
  connected: false,

  // Connect to the messaging socket
  connect() {
    if (!browser) return;

    const token = get(authToken);
    if (!token) return;

    socket = io(`${API_URL}/messaging`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      this.connected = true;
      this.emit('connected');
    });

    socket.on('disconnect', () => {
      this.connected = false;
      this.emit('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('error', error);
    });

    // Set up default event listeners that might be needed app-wide
    this.setupDefaultListeners();

    return socket;
  },

  // Disconnect from the socket
  disconnect() {
    if (socket) {
      socket.disconnect();
      this.connected = false;
    }
  },

  // Emit an event
  emit(event: string, ...args: any[]) {
    if (event === 'connected' || event === 'disconnected' || event === 'error') {
      // Trigger local event handlers
      if (eventHandlers[event]) {
        eventHandlers[event].forEach(handler => handler(...args));
      }
      return;
    }

    if (!socket) return;
    return socket.emit(event, ...args);
  },

  // Listen for an event
  on(event: string, handler: Function) {
    if (!eventHandlers[event]) {
      eventHandlers[event] = [];
    }

    eventHandlers[event].push(handler);

    if (socket && event !== 'connected' && event !== 'disconnected' && event !== 'error') {
      socket.on(event, (...args) => handler(...args));
    }

    return () => this.off(event, handler);
  },

  // Remove an event listener
  off(event: string, handler: Function) {
    if (eventHandlers[event]) {
      eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
    }

    if (socket && event !== 'connected' && event !== 'disconnected' && event !== 'error') {
      socket.off(event, handler as any);
    }
  },

  // Set up default event listeners
  setupDefaultListeners() {
    if (!socket) return;

    // Set up socket event handlers that should always be active
    socket.on('user:status', (data) => {
      if (eventHandlers['user:status']) {
        eventHandlers['user:status'].forEach(handler => handler(data));
      }
    });

    socket.on('message:new', (message) => {
      if (eventHandlers['message:new']) {
        eventHandlers['message:new'].forEach(handler => handler(message));
      }
    });

    socket.on('conversation:new', (conversation) => {
      if (eventHandlers['conversation:new']) {
        eventHandlers['conversation:new'].forEach(handler => handler(conversation));
      }
    });
  }
};

// Helper functions to connect/disconnect
export function connectMessaging() {
  return messagingSocket.connect();
}

export function disconnectMessaging() {
  messagingSocket.disconnect();
}