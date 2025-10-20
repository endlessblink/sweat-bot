/**
 * Authentication utility for SweatBot
 * Handles both real user login and guest user token management
 *
 * Real User Login:
 * - Username: noamnau
 * - Password: Noam123!
 * - User ID: 68ce092a-61c4-4338-8f48-261b3fa04b06
 * - Email: noamnau@sweatbot.com
 * - Full Name: Noam Nau
 *
 * Token Storage:
 * - Real users: 'sweatbot_auth_token' + 'sweatbot_user'
 * - Guest users: Same keys but with is_guest: true
 */

import { getBackendUrl } from './env';

const TOKEN_KEY = 'sweatbot_auth_token';
const USER_KEY = 'sweatbot_user';
const DEVICE_ID_KEY = 'sweatbot_device_id';

// Fallback UUID generator for browsers without crypto.randomUUID
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate stable device ID for guest users
function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // Generate new device ID (UUID v4)
    deviceId = 'dev_' + generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('🆔 Generated new device ID:', deviceId);
  }

  return deviceId;
}

export interface AuthToken {
  token: string;
  user: {
    id: string;
    username?: string;
    device_id?: string;
    is_guest: boolean;
    created_at: string;
  };
  is_guest?: boolean;
  created_at?: string;
}

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  is_guest: boolean;
  role?: string;
  created_at?: number;
}

/**
 * Get authentication token - supports both real users and guests
 * Real users have persistent tokens, guests get 23-hour tokens
 */
export async function getOrCreateGuestToken(): Promise<string> {
  // Force clear all corrupted authentication data
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  // If token is undefined or corrupted, clear everything and start fresh
  if (!storedToken || storedToken === 'undefined' || !storedUser) {
    console.log('🧹 Clearing corrupted authentication data');
    clearAuth();
  } else {
    try {
      const user = JSON.parse(storedUser);

      // Validate user object structure
      if (!user || typeof user !== 'object') {
        console.log('🧹 Invalid user object structure, clearing data');
        clearAuth();
        throw new Error('Invalid user object structure');
      }

      // Real users (non-guest) have long-lived tokens
      if (!user.is_guest) {
        // Validate real user has required fields
        if (!user.username && !user.id) {
          console.log('🧹 Corrupted real user token, clearing and creating new guest token');
          clearAuth();
          throw new Error('Invalid real user data');
        }
        console.log('🔐 Using real user token:', user.username || user.id || 'real-user');
        return storedToken;
      }

      // Guest tokens expire after 23 hours
      const tokenAge = Date.now() - (user.created_at || 0);
      if (tokenAge < 23 * 60 * 60 * 1000) { // 23 hours
        console.log('👤 Using existing guest token');
        return storedToken;
      }
    } catch (error) {
      console.log('🧹 Invalid stored token, creating new one:', error.message);
      clearAuth(); // Clear corrupted data
    }
  }

  // Create new guest user
  try {
    const deviceId = getOrCreateDeviceId();
    const backendUrl = getBackendUrl();

    const response = await fetch(`${backendUrl}/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ device_id: deviceId })
    });

    if (!response.ok) {
      throw new Error(`Failed to create guest user: ${response.status}`);
    }

    const responseData = await response.json();

    console.log('[Auth] Raw response:', responseData);
    console.log('[Auth] Response has token:', !!responseData.token);
    console.log('[Auth] Response has user:', !!responseData.user);

    // Direct response format (no .data wrapper)
    const token = responseData.token;
    const user = responseData.user;

    console.log('[Auth] Extracted token:', token);
    console.log('[Auth] Extracted user:', user);

    // Store token and user info
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({
      ...user,
      created_at: Date.now()
    }));

    console.log('✅ New guest token created:', user.username);
    return token;

  } catch (error) {
    console.error('Failed to get guest token:', error);
    throw error;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    return null;
  }
}

export function getUserId(): string | null {
  const user = getStoredUser();
  return user?.id || null;
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Login with username and password (real user authentication)
 * @param username - User's username (e.g., "noamnau")
 * @param password - User's password (e.g., "Noam123!")
 * @returns Authentication token data
 */
export async function loginUser(username: string, password: string): Promise<AuthToken> {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  const authData: AuthToken = await response.json();

  // Store token and user info
  // CRITICAL: Explicitly set is_guest to false for real users
  localStorage.setItem(TOKEN_KEY, authData.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    ...authData.user,
    is_guest: false,  // Real authenticated user, not a guest
    created_at: Date.now(),
    role: authData.user.role
  }));

  console.log('✅ Logged in as:', authData.user.username);
  return authData;
}

/**
 * Check if current user is authenticated (real user or guest)
 */
export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

/**
 * Check if current user is a guest
 */
export function isGuestUser(): boolean {
  const user = getStoredUser();
  return user?.is_guest ?? true;
}

/**
 * Get current username
 */
export function getUsername(): string | null {
  const user = getStoredUser();
  return user?.username || null;
}

export function getUserRole(): string | null {
  const user = getStoredUser();
  return user?.role || null;
}

/**
 * Check if token is expired or will expire soon
 * @param token JWT token string
 * @param bufferHours Hours before expiration to consider "expiring soon" (default: 24)
 * @returns true if token is expired or expiring soon
 */
export function isTokenExpiringSoon(token: string, bufferHours: number = 24): boolean {
  try {
    // JWT tokens have 3 parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return true; // Invalid token format

    // Decode payload (base64url)
    const payload = JSON.parse(atob(parts[1]));

    // Check expiration claim
    if (!payload.exp) return true; // No expiration claim

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const bufferTime = bufferHours * 60 * 60 * 1000;

    // Return true if expired or expiring within buffer period
    return (expirationTime - now) <= bufferTime;
  } catch (error) {
    console.error('Failed to check token expiration:', error);
    return true; // Assume expired on error
  }
}

/**
 * Refresh authentication token using the backend refresh endpoint
 * @returns Promise<boolean> true if refresh succeeded
 */
export async function refreshAuthToken(): Promise<boolean> {
  try {
    const currentToken = getStoredToken();
    if (!currentToken) {
      console.warn('No token to refresh');
      return false;
    }

    console.log('🔄 Refreshing authentication token...');
    const backendUrl = getBackendUrl();

    const response = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      return false;
    }

    const authData: AuthToken = await response.json();

    // Update stored token and user info
    localStorage.setItem(TOKEN_KEY, authData.access_token);

    // Preserve is_guest flag and other user data
    const currentUser = getStoredUser();
    localStorage.setItem(USER_KEY, JSON.stringify({
      ...authData.user,
      is_guest: currentUser?.is_guest ?? authData.user.is_guest,
      created_at: currentUser?.created_at ?? Date.now(),
      role: authData.user.role
    }));

    console.log('✅ Token refreshed successfully');
    return true;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
}

/**
 * Check token and refresh if needed
 * Call this before making authenticated API requests
 * @returns Promise<string | null> Valid token or null if refresh failed
 */
export async function getValidToken(): Promise<string | null> {
  const token = getStoredToken();

  if (!token) {
    console.warn('No authentication token found');
    return null;
  }

  // Check if token is expiring soon (within 24 hours)
  if (isTokenExpiringSoon(token)) {
    console.log('⚠️ Token expiring soon, attempting refresh...');
    const refreshed = await refreshAuthToken();

    if (!refreshed) {
      console.error('❌ Token refresh failed - user needs to re-authenticate');
      // Clear invalid token
      clearAuth();
      return null;
    }

    // Return the newly refreshed token
    return getStoredToken();
  }

  // Token is still valid
  return token;
}
