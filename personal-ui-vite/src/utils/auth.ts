/**
 * Authentication utility for SweatBot
 * Handles guest user token management
 */

const TOKEN_KEY = 'sweatbot_auth_token';
const USER_KEY = 'sweatbot_user';

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    is_guest: boolean;
  };
}

export async function getOrCreateGuestToken(): Promise<string> {
  // Check for existing valid token
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  if (storedToken && storedUser) {
    try {
      const user = JSON.parse(storedUser);
      // Simple expiry check - if token was created more than 23 hours ago, refresh
      const tokenAge = Date.now() - (user.created_at || 0);
      if (tokenAge < 23 * 60 * 60 * 1000) { // 23 hours
        console.log('Using existing guest token');
        return storedToken;
      }
    } catch (error) {
      console.warn('Invalid stored token, creating new one');
    }
  }

  // Create new guest user
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
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

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
