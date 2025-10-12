/**
 * Environment configuration utilities
 * Handles dynamic backend URL detection for both local dev and production
 */

/**
 * Get backend URL dynamically based on environment
 * - In production (public domain): use same origin as frontend
 * - In development (localhost): use configured VITE_BACKEND_URL
 */
export function getBackendUrl(): string {
  // If accessed via public domain, use same origin
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const protocol = window.location.protocol;
    return `${protocol}//${window.location.host}`;
  }

  // For local development, use configured backend URL
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
}

/**
 * Get WebSocket URL dynamically based on environment
 * - In production (public domain): use wss:// with same host
 * - In development (localhost): use ws:// with configured backend
 */
export function getWebSocketUrl(): string {
  // If accessed via public domain, use same origin
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }

  // For local development, use configured backend URL with ws protocol
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  return backendUrl.replace('http', 'ws');
}
