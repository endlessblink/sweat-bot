/**
 * API utilities with automatic token refresh
 * Wraps fetch with intelligent authentication handling
 */

import { getValidToken, clearAuth } from './auth';

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean; // Skip authentication for public endpoints
  retryOnAuthFailure?: boolean; // Retry once on 401 error (default: true)
}

/**
 * Fetch wrapper with automatic token refresh
 * Automatically adds Authorization header and handles token expiration
 *
 * @param url API endpoint URL
 * @param options Fetch options with additional auth control
 * @returns Promise<Response>
 */
export async function authenticatedFetch(
  url: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const {
    skipAuth = false,
    retryOnAuthFailure = true,
    headers = {},
    ...fetchOptions
  } = options;

  // Prepare headers
  const requestHeaders = new Headers(headers);

  // Add authentication if not skipped
  if (!skipAuth) {
    const token = await getValidToken();

    if (!token) {
      throw new Error('Authentication required but no valid token available');
    }

    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  // Add default Content-Type if not set
  if (!requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  try {
    // Make the request
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders
    });

    // Handle 401 Unauthorized
    if (response.status === 401 && retryOnAuthFailure && !skipAuth) {
      console.warn('⚠️ Received 401 Unauthorized, clearing auth and requiring re-login');

      // Clear stored authentication
      clearAuth();

      // Notify the application to show login prompt
      window.dispatchEvent(new CustomEvent('auth:expired', {
        detail: { message: 'Your session has expired. Please log in again.' }
      }));

      throw new Error('Authentication expired - please log in again');
    }

    return response;
  } catch (error) {
    // Network errors or other issues
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Helper for GET requests with authentication
 */
export async function apiGet(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'GET'
  });
}

/**
 * Helper for POST requests with authentication
 */
export async function apiPost(
  url: string,
  body: any,
  options: ApiRequestOptions = {}
): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/**
 * Helper for PUT requests with authentication
 */
export async function apiPut(
  url: string,
  body: any,
  options: ApiRequestOptions = {}
): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

/**
 * Helper for DELETE requests with authentication
 */
export async function apiDelete(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'DELETE'
  });
}

/**
 * Parse JSON response with error handling
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
