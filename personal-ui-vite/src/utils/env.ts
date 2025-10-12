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
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  console.log('[ENV] Location details:', {
    hostname,
    protocol,
    port,
    host: window.location.host,
    origin: window.location.origin
  });

  // If accessed via public domain, use same origin
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const url = `${protocol}//${window.location.host}`;
    console.log('[ENV] Using production URL:', url);
    return url;
  }

  // For local development, use configured backend URL
  const devUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  console.log('[ENV] Using development URL:', devUrl);
  return devUrl;
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
