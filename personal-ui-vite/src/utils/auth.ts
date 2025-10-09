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

const TOKEN_KEY = 'sweatbot_auth_token';
const USER_KEY = 'sweatbot_user';
const DEVICE_ID_KEY = 'sweatbot_device_id';

// Generate stable device ID for guest users
function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // Generate new device ID (UUID v4)
    deviceId = 'dev_' + crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('🆔 Generated new device ID:', deviceId);
  }

  return deviceId;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    is_guest: boolean;
    role?: string;
  };
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
  // Check for existing valid token (real user or guest)
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  if (storedToken && storedUser) {
    try {
      const user = JSON.parse(storedUser);

      // Real users (non-guest) have long-lived tokens
      if (!user.is_guest) {
        console.log('🔐 Using real user token:', user.username);
        return storedToken;
      }

      // Guest tokens expire after 23 hours
      const tokenAge = Date.now() - (user.created_at || 0);
      if (tokenAge < 23 * 60 * 60 * 1000) { // 23 hours
        console.log('👤 Using existing guest token');
        return storedToken;
      }
    } catch (error) {
      console.warn('Invalid stored token, creating new one');
    }
  }

  // Create new guest user
  try {
    const deviceId = getOrCreateDeviceId();

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ device_id: deviceId })
    });

    if (!response.ok) {
      throw new Error(`Failed to create guest user: ${response.status}`);
    }

    const authData: AuthToken = await response.json();

    // Store token and user info
    localStorage.setItem(TOKEN_KEY, authData.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify({
      ...authData.user,
      created_at: Date.now()
    }));

    console.log('✅ New guest token created:', authData.user.username);
    return authData.access_token;

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
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/login`, {
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
