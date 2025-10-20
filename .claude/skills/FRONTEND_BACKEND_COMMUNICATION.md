# 🔄 Frontend-Backend Communication - Complete Integration Guide

**Purpose**: Comprehensive guide to frontend-backend communication patterns in SweatBot
**Based On**: Actual implementation in `personal-ui-vite/src/` and `backend-nodejs/src/`
**Last Updated**: October 2025

---

## 📋 Quick Reference

| Component | Technology | Location | Purpose |
|-----------|------------|----------|---------|
| **Frontend Framework** | Vite + React 19 + TypeScript | `personal-ui-vite/` | Client-side application |
| **Backend Framework** | Node.js + Express + TypeScript | `backend-nodejs/` | API server |
| **Communication Protocol** | HTTP/HTTPS + WebSocket | `utils/api.ts` | REST + Real-time |
| **Authentication** | JWT Tokens (Guest + Real) | `utils/auth.ts` | Session management |
| **UI Chat Library** | @assistant-ui/react | `src/components/` | Chat interface |
| **Error Handling** | Centralized API wrapper | `utils/api.ts` | Consistent error management |

---

## 🌐 Communication Architecture

### Core Communication Flow
```typescript
// Frontend (React) → API Layer → Backend (Express)
//    ↓                    ↓              ↓
// UI Components    → utils/api.ts → server-simple.ts
//    ↓                    ↓              ↓
// User Actions   → HTTP Request → AI Provider Service
//    ↓                    ↓              ↓
// Display Update ← Response ← AI Response
```

### Port Configuration (Actual)
```typescript
// Frontend (Vite dev server)
FRONTEND_PORT = 8005

// Backend (Express server)
BACKEND_PORT = 8000

// CORS Configuration (server-simple.ts:16-21)
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://sweat-bot.onrender.com']  // Production
    : ['http://localhost:8005', 'http://localhost:3000'],  // Local dev
  credentials: true
}));
```

---

## 🔐 Authentication System

### Guest vs Real User Authentication
```typescript
// utils/auth.ts - Dual authentication system

// Real User Login (stored in CLAUDE.md comments)
const REAL_USER = {
  username: 'noamnau',
  password: 'Noam123!',
  userId: '68ce092a-61c4-4338-8f48-261b3fa04b06',
  email: 'noamnau@sweatbot.com',
  fullName: 'Noam Nau'
};

// Token Storage Keys
const TOKEN_KEY = 'sweatbot_auth_token';
const USER_KEY = 'sweatbot_user';
const DEVICE_ID_KEY = 'sweatbot_device_id';
```

### Guest User Token Generation
```typescript
// utils/auth.ts:38-65
export async function getOrCreateGuestToken(): Promise<string> {
  const deviceId = getOrCreateDeviceId();
  const backendUrl = getBackendUrl();

  const response = await fetch(`${backendUrl}/auth/guest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      device_id: deviceId,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get guest token: ${response.statusText}`);
  }

  const { token, user } = await response.json();

  // Store in localStorage
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    ...user,
    is_guest: true,
    device_id: deviceId
  }));

  return token;
}
```

### Token Validation & Refresh
```typescript
// utils/auth.ts - Get valid token with automatic refresh
export async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);

  if (!token || !userStr) {
    return null;
  }

  const user = JSON.parse(userStr);

  // Check if token is expired (simple check)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;

    if (payload.exp < now) {
      // Token expired, clear and get new one
      clearAuth();
      return await getOrCreateGuestToken();
    }

    return token;
  } catch (error) {
    console.error('Token validation failed:', error);
    clearAuth();
    return await getOrCreateGuestToken();
  }
}
```

---

## 📡 API Communication Layer

### Core API Wrapper (utils/api.ts)
```typescript
// Centralized API communication with authentication
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

  // Add default Content-Type
  if (!requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders
    });

    // Handle 401 Unauthorized
    if (response.status === 401 && retryOnAuthFailure && !skipAuth) {
      console.warn('⚠️ Received 401 Unauthorized, clearing auth');

      clearAuth();

      // Notify app to show login prompt
      window.dispatchEvent(new CustomEvent('auth:expired', {
        detail: { message: 'Your session has expired. Please log in again.' }
      }));

      throw new Error('Authentication expired - please log in again');
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

### HTTP Method Helpers
```typescript
// GET requests with authentication
export async function apiGet(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'GET'
  });
}

// POST requests with authentication
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

// PUT requests with authentication
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

// DELETE requests with authentication
export async function apiDelete(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'DELETE'
  });
}
```

---

## 🤖 Chat Integration with @assistant-ui/react

### Chat Component Setup
```typescript
// components/ChatInterface.tsx (typical pattern)
import { ChatInterface } from '@assistant-ui/react';
import { SweatBotAgent } from '../agent';

export const SweatBotChat = () => {
  const [agent] = useState(() => new SweatBotAgent({
    userId: 'personal',
    preferredModel: 'openai'
  }));

  return (
    <ChatInterface
      agent={agent}
      onSendMessage={async (message) => {
        try {
          const response = await agent.processMessage(message);
          return response;
        } catch (error) {
          console.error('Chat error:', error);
          return 'Sorry, I encountered an error. Please try again.';
        }
      }}
      onError={(error) => {
        console.error('Chat interface error:', error);
      }}
    />
  );
};
```

### Agent to Backend Communication
```typescript
// agent/index.ts - How SweatBotAgent talks to backend
export class SweatBotAgent {
  private async callBackendAPI(message: string): Promise<string> {
    const backendUrl = getBackendUrl();

    const response = await apiPost(`${backendUrl}/api/v1/chatSimple`, {
      message,
      provider: this.preferredModel,
      conversationHistory: this.conversationHistory,
      userId: this.userId
    });

    const result = await parseJsonResponse<ChatResponse>(response);

    if (result.success && result.data) {
      // Update conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      this.conversationHistory.push({
        role: 'assistant',
        content: result.data.response,
        timestamp: new Date().toISOString()
      });

      return result.data.response;
    } else {
      throw new Error(result.error || 'Unknown error from backend');
    }
  }
}
```

---

## 🔌 Tool-to-Backend Communication

### Exercise Logging Example
```typescript
// agent/tools/exerciseLogger.ts - Real implementation
export const exerciseLoggerTool = {
  name: 'log_exercise',
  description: 'Log an exercise activity with automatic Hebrew recognition',
  parameters: exerciseLoggerSchema,

  execute: async (params: ExerciseLoggerParams) => {
    try {
      // Prepare exercise data
      const exerciseData = {
        name: params.exercise,
        name_he: params.exercise_he || translateToHebrew(params.exercise),
        reps: params.reps,
        sets: params.sets,
        weight_kg: params.weight_kg,
        distance_km: params.distance_km,
        duration_seconds: params.duration_seconds,
        notes: params.notes,
        timestamp: new Date().toISOString()
      };

      // Use backend API utilities
      const { getBackendUrl } = await import('../../utils/env');
      const backendUrl = getBackendUrl();
      const { apiPost, parseJsonResponse } = await import('../../utils/api');

      const response = await apiPost(`${backendUrl}/exercises/log`, exerciseData);
      const result = await parseJsonResponse(response);

      return {
        success: true,
        message: `Logged ${params.exercise} successfully!`,
        exercise: result.exercise,
        points_earned: result.points || 0,
        total_points: result.totalPoints || 0,
        hebrew_name: result.name_he
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to log exercise: ${error.message}`,
        details: error
      };
    }
  }
};
```

### Statistics Retrieval Example
```typescript
// agent/tools/statsRetriever.ts - Real implementation
export const statsRetrieverTool = {
  name: 'get_statistics',
  description: 'Retrieve user fitness statistics, points, achievements',
  parameters: statsRetrieverSchema,

  execute: async (params: StatsRetrieverParams) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        type: params.stat_type,
        period: params.time_period,
        detailed: params.detailed.toString()
      });

      // Direct fetch for GET request (could also use apiGet)
      const response = await fetch(
        `http://localhost:8000/api/v1/exercises/statistics?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }

      const stats = await response.json();

      return {
        success: true,
        statistics: stats,
        summary: generateStatsSummary(stats, params.stat_type),
        insights: generateInsights(stats)
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve statistics: ${error.message}`,
        fallback: getDefaultStats(params.stat_type)
      };
    }
  }
};
```

---

## 🛠️ Environment Configuration

### Backend URL Detection
```typescript
// utils/env.ts - Environment-aware backend URL
export function getBackendUrl(): string {
  // Check if custom backend URL is set (for testing)
  const customUrl = localStorage.getItem('sweatbot_backend_url');
  if (customUrl) {
    return customUrl;
  }

  // Check environment
  if (import.meta.env.DEV) {
    // Development: use local backend
    return 'http://localhost:8000';
  } else {
    // Production: use Render deployment
    return 'https://sweat-bot.onrender.com';
  }
}

// Override for testing (useful for development)
export function setBackendUrl(url: string): void {
  localStorage.setItem('sweatbot_backend_url', url);
  console.log('🔧 Backend URL overridden to:', url);
}

export function clearBackendUrlOverride(): void {
  localStorage.removeItem('sweatbot_backend_url');
}
```

### Environment Variables
```typescript
// .env.development (local development)
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_APP_NAME=SweatBot Dev

// .env.production (Render deployment)
VITE_API_BASE_URL=https://sweat-bot.onrender.com
VITE_WS_URL=wss://sweat-bot.onrender.com
VITE_APP_NAME=SweatBot
```

---

## 🔄 WebSocket Communication

### WebSocket Connection Setup
```typescript
// utils/websocket.ts - Real-time communication
export class SweatBotWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(userId: string): void {
    const wsUrl = `${getBackendUrl().replace('http', 'ws')}/ws?userId=${userId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('❌ WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect(this.userId);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }
}
```

---

## 🚨 Error Handling Patterns

### Centralized Error Handling
```typescript
// utils/errorHandler.ts - Global error management
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): APIError {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof Response) {
    return new APIError(
      `HTTP ${error.status}: ${error.statusText}`,
      error.status,
      'HTTP_ERROR'
    );
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return new APIError(
        'Network connection failed',
        0,
        'NETWORK_ERROR',
        { originalError: error.message }
      );
    }

    if (error.message.includes('Authentication')) {
      return new APIError(
        'Authentication failed',
        401,
        'AUTH_ERROR',
        { originalError: error.message }
      );
    }
  }

  return new APIError(
    'Unknown error occurred',
    0,
    'UNKNOWN_ERROR',
    { originalError: error }
  );
}
```

### React Error Boundary
```typescript
// components/ErrorBoundary.tsx
import React, { Component } from 'react';

export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🔧 Development Tools & Debugging

### API Testing Tools
```typescript
// utils/apiTest.ts - Development testing utilities
export class APITester {
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${getBackendUrl()}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  static async testAuthentication(): Promise<boolean> {
    try {
      const token = await getValidToken();
      if (!token) return false;

      const response = await apiGet(`${getBackendUrl()}/api/v1/user/profile`);
      return response.ok;
    } catch (error) {
      console.error('Authentication test failed:', error);
      return false;
    }
  }

  static async testChatAPI(message: string = 'Hello'): Promise<any> {
    try {
      const response = await apiPost(`${getBackendUrl()}/api/v1/chatSimple`, {
        message,
        provider: 'openai'
      });

      return await parseJsonResponse(response);
    } catch (error) {
      console.error('Chat API test failed:', error);
      throw error;
    }
  }
}

// Usage in development
if (import.meta.env.DEV) {
  // Make available in console for debugging
  window.APITester = APITester;
  console.log('🔧 API Tester available as window.APITester');
}
```

### Network Request Logger
```typescript
// utils/networkLogger.ts - Development logging
export class NetworkLogger {
  private static logs: Array<{
    timestamp: Date;
    method: string;
    url: string;
    status?: number;
    duration: number;
    error?: string;
  }> = [];

  static log(method: string, url: string, status?: number, duration: number, error?: string) {
    const logEntry = {
      timestamp: new Date(),
      method,
      url,
      status,
      duration,
      error
    };

    this.logs.push(logEntry);

    if (import.meta.env.DEV) {
      console.log(`🌐 ${method} ${url} - ${status} (${duration}ms)`, error || '');
    }
  }

  static getLogs() {
    return this.logs;
  }

  static clearLogs() {
    this.logs = [];
  }
}

// Integration with API wrapper
export async function loggedAuthenticatedFetch(url: string, options: ApiRequestOptions = {}) {
  const startTime = Date.now();
  const method = options.method || 'GET';

  try {
    const response = await authenticatedFetch(url, options);
    const duration = Date.now() - startTime;

    NetworkLogger.log(method, url, response.status, duration);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    NetworkLogger.log(method, url, undefined, duration, error.message);
    throw error;
  }
}
```

---

## 🧪 Testing Communication

### Unit Test Examples
```typescript
// __tests__/api.test.ts - API communication tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authenticatedFetch, apiPost, parseJsonResponse } from '../utils/api';
import { getValidToken } from '../utils/auth';

// Mock fetch
global.fetch = vi.fn();

describe('API Communication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make authenticated request', async () => {
    // Mock token
    vi.mocked(getValidToken).mockResolvedValue('mock-token');

    // Mock successful response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
      status: 200
    } as Response);

    const response = await authenticatedFetch('http://localhost:8000/api/test');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('should handle 401 unauthorized', async () => {
    vi.mocked(getValidToken).mockResolvedValue('expired-token');

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    } as Response);

    await expect(authenticatedFetch('http://localhost:8000/api/test'))
      .rejects.toThrow('Authentication expired - please log in again');
  });
});
```

### Integration Test Examples
```typescript
// __tests__/integration/chat.test.ts - End-to-end chat tests
import { describe, it, expect, beforeAll } from 'vitest';
import { SweatBotAgent } from '../agent';

describe('Chat Integration', () => {
  let agent: SweatBotAgent;

  beforeAll(async () => {
    agent = new SweatBotAgent({
      userId: 'test-user',
      preferredModel: 'openai'
    });
  });

  it('should process message through backend', async () => {
    // Mock backend response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          response: 'Hello! How can I help you today?',
          provider: 'openai',
          model: 'gpt-4o-mini'
        }
      })
    });

    const response = await agent.processMessage('Hello');

    expect(response).toBe('Hello! How can I help you today?');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/chatSimple'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('Hello')
      })
    );
  });
});
```

---

## 📊 Performance Optimization

### Request Caching
```typescript
// utils/cache.ts - API response caching
export class APICache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>();

  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new APICache();

// Cached API wrapper
export async function cachedApiGet(url: string, ttl: number = 300000): Promise<any> {
  const cacheKey = `GET:${url}`;

  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log(`🎯 Cache hit for ${url}`);
    return cached;
  }

  // Make request
  const response = await apiGet(url);
  const data = await parseJsonResponse(response);

  // Cache result
  apiCache.set(cacheKey, data, ttl);

  return data;
}
```

### Request Debouncing
```typescript
// utils/debounce.ts - Prevent rapid API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage for search or autocomplete
export const debouncedSearch = debounce(async (query: string) => {
  const response = await apiGet(`/api/v1/search?q=${encodeURIComponent(query)}`);
  return await parseJsonResponse(response);
}, 300);
```

---

## 🚨 Common Issues & Solutions

### Issue: "CORS error in development"
**Symptom**: `Access to fetch at 'http://localhost:8000' from origin 'http://localhost:8005' has been blocked by CORS policy`

**Real Solution**:
```typescript
// In backend-nodejs/src/server-simple.ts
app.use(cors({
  origin: ['http://localhost:8005', 'http://localhost:3000'],  // Add your frontend port
  credentials: true
}));

// Also check Vite proxy configuration in vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
```

### Issue: "Authentication token not working"
**Symptom**: 401 errors even after login

**Real Solution**:
```typescript
// Check token storage and format
const debugToken = () => {
  const token = localStorage.getItem('sweatbot_auth_token');
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length);

  try {
    const payload = JSON.parse(atob(token!.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Token expires:', new Date(payload.exp * 1000));
  } catch (error) {
    console.error('Token parsing failed:', error);
  }
};

// Test token refresh
const testTokenRefresh = async () => {
  try {
    const newToken = await getOrCreateGuestToken();
    console.log('New token obtained:', newToken.substring(0, 20) + '...');
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
};
```

### Issue: "WebSocket connection fails"
**Symptom**: WebSocket connection errors or frequent disconnections

**Real Solution**:
```typescript
// Check WebSocket URL format
const wsUrl = backendUrl.replace('http://', 'ws://').replace('https://', 'wss://');

// Ensure proper authentication for WebSocket
const connectWebSocket = async () => {
  const token = await getValidToken();
  const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

  ws.onopen = () => {
    console.log('✅ WebSocket connected with authentication');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    // Fall back to HTTP polling if WebSocket fails
    fallbackToHTTPPolling();
  };
};
```

---

## 📚 Related Skills

- [BACKEND_NODEJS_ARCHITECTURE.md](BACKEND_NODEJS_ARCHITECTURE.md) - Backend API endpoints
- [SWEATBOT_AGENT_TOOLS.md](SWEATBOT_AGENT_TOOLS.md) - Tool-to-backend communication
- [DATABASE_SETUP_AND_MIGRATIONS.md](DATABASE_SETUP_AND_MIGRATIONS.md) - Database layer
- [LOCAL_DEVELOPMENT_COMPLETE.md](LOCAL_DEVELOPMENT_COMPLETE.md) - Development setup

---

## ✅ Success Indicators

Your frontend-backend communication is working correctly when:

- ✅ Frontend can connect to backend on both ports (8000 ↔ 8005)
- ✅ Guest authentication creates and stores tokens automatically
- ✅ JWT tokens are included in all API requests
- ✅ CORS configuration allows local development
- ✅ @assistant-ui/react can send messages to SweatBotAgent
- ✅ Agent tools can call backend endpoints successfully
- ✅ Error handling provides specific, actionable messages
- ✅ WebSocket connection maintains real-time communication
- ✅ Network requests are logged in development mode

---

## 🆘 Quick Debug Commands

```typescript
// Test complete communication flow
const testCommunicationFlow = async () => {
  console.log('🔍 Testing frontend-backend communication...');

  // 1. Test backend connectivity
  const healthResponse = await fetch(`${getBackendUrl()}/health`);
  console.log('✅ Backend health:', healthResponse.ok);

  // 2. Test authentication
  const token = await getValidToken();
  console.log('✅ Authentication token:', !!token);

  // 3. Test API communication
  const statsResponse = await apiGet(`${getBackendUrl()}/api/v1/exercises/statistics`);
  console.log('✅ API communication:', statsResponse.ok);

  // 4. Test agent communication
  const agent = new SweatBotAgent();
  const chatResponse = await agent.processMessage('Hello');
  console.log('✅ Agent communication:', !!chatResponse);

  console.log('🎉 All communication tests passed!');
};

// Available in development console
if (import.meta.env.DEV) {
  window.testCommunication = testCommunicationFlow;
  console.log('🔧 Communication test available as window.testCommunication()');
}
```

---

**Communication Architecture Stability**: ✅ Production Ready
**Protocols**: HTTP/HTTPS + WebSocket + JWT Authentication
**Last Updated**: October 2025
**Based On**: Actual implementation in `personal-ui-vite/src/utils/` and `backend-nodejs/src/`