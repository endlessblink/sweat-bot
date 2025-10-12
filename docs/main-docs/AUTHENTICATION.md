# SweatBot Authentication System

## Overview

SweatBot supports two types of users:
1. **Real Users**: Authenticated with username/password, persistent data
2. **Guest Users**: Anonymous users with device-based identification

## Real User Login

### Test Account Credentials

**Primary Test Account:**
- **Username**: `noamnau`
- **Password**: `Noam123`
- **User ID**: `68ce092a-61c4-4338-8f48-261b3fa04b06`
- **Email**: `noamnau@sweatbot.com`
- **Full Name**: Noam Nau
- **Preferred Language**: Hebrew (he)

### Login Methods

#### 1. Web UI Login
Navigate to: `http://localhost:8005/login`

Fill in:
- Username: `noamnau`
- Password: `Noam123`

Click "התחבר" (Login)

#### 2. API Login (cURL)
```bash
# Create login JSON
cat > /tmp/login.json << 'EOF'
{
  "username": "noamnau",
  "password": "Noam123!"
}
EOF

# Login request
curl -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d @/tmp/login.json | jq .
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 604800,
  "user": {
    "id": "68ce092a-61c4-4338-8f48-261b3fa04b06",
    "username": "noamnau",
    "email": "noamnau@sweatbot.com",
    "full_name": "Noam Nau",
    "preferred_language": "he"
  }
}
```

#### 3. Programmatic Login (TypeScript)
```typescript
import { loginUser } from '../utils/auth';

try {
  const authData = await loginUser('noamnau', 'Noam123!');
  console.log('Logged in as:', authData.user.username);
  console.log('Token:', authData.access_token);
} catch (error) {
  console.error('Login failed:', error);
}
```

## Token Management

### Storage Location
Tokens are stored in browser localStorage:

**Real Users:**
- `sweatbot_auth_token`: JWT access token
- `sweatbot_user`: User object (JSON string)

**Guest Users:**
- `sweatbot_auth_token`: JWT access token
- `sweatbot_user`: User object with `is_guest: true`
- `sweatbot_device_id`: Unique device identifier

### Token Lifetime
- **Real Users**: 7 days (604800 seconds)
- **Guest Users**: 23 hours (auto-refresh)

### Verify Token
```bash
# Get stored token (browser console)
localStorage.getItem('sweatbot_auth_token')

# Verify token with API
curl -s http://localhost:8000/auth/users/68ce092a-61c4-4338-8f48-261b3fa04b06 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq .
```

## Guest User System

Guest users are automatically created when:
- User visits the chat without logging in
- No valid auth token exists in localStorage

**Device ID:**
- Unique identifier: `dev_<UUID>`
- Stored in localStorage
- Persists across sessions
- Used to retrieve existing guest user

**Guest Username Format:**
- Pattern: `guest_<timestamp>`
- Example: `guest_1759749170830`

## Authentication Flow

### Real User Flow
```
1. User navigates to /login
2. Enters username/password
3. Frontend calls loginUser()
4. Backend validates credentials
5. Backend returns JWT token + user data
6. Frontend stores token in localStorage
7. User redirected to /chat
8. All API calls include Authorization header
```

### Guest User Flow
```
1. User navigates to /chat
2. Frontend checks for stored token
3. If no token, calls getOrCreateGuestToken()
4. Backend checks device_id
5. If device exists, returns existing guest user
6. If new device, creates new guest user
7. Frontend stores token
8. Chat loads with guest context
```

## API Endpoints

### Login (Real User)
**POST** `/auth/login`

**Request:**
```json
{
  "username": "noamnau",
  "password": "Noam123!"
}
```

**Response:** (See "API Login" section above)

### Create Guest User
**POST** `/auth/guest`

**Request:**
```json
{
  "device_id": "dev_550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 604800,
  "user": {
    "id": "uuid-here",
    "username": "guest_1759749170830",
    "email": "guest_1759749170830@sweatbot.local",
    "is_guest": true
  }
}
```

### Get User Info
**GET** `/auth/users/{user_id}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "id": "68ce092a-61c4-4338-8f48-261b3fa04b06",
  "username": "noamnau",
  "email": "noamnau@sweatbot.com",
  "full_name": "Noam Nau",
  "preferred_language": "he",
  "is_active": true,
  "created_at": "2025-10-05T10:30:00Z"
}
```

## Frontend Auth Functions

Located in: `personal-ui-vite/src/utils/auth.ts`

### Core Functions

#### loginUser()
```typescript
async function loginUser(username: string, password: string): Promise<AuthToken>
```
Authenticate with username/password, store token.

#### getOrCreateGuestToken()
```typescript
async function getOrCreateGuestToken(): Promise<string>
```
Get existing token or create guest user.

#### isAuthenticated()
```typescript
function isAuthenticated(): boolean
```
Check if user has valid token.

#### isGuestUser()
```typescript
function isGuestUser(): boolean
```
Check if current user is guest.

#### getUsername()
```typescript
function getUsername(): string | null
```
Get current username.

#### clearAuth()
```typescript
function clearAuth(): void
```
Clear all auth data from localStorage.

## Security Notes

### Password Hashing
- Backend uses **bcrypt** for password hashing
- Salt is auto-generated per user
- Never store plaintext passwords

### JWT Tokens
- Algorithm: **HS256** (HMAC SHA-256)
- Secret key stored in backend `.env`
- Token payload includes: `sub` (user_id), `exp` (expiration)

### Token Validation
```python
# Backend validation (simplified)
def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token
```

## Database Storage

### PostgreSQL (User Table)
```sql
SELECT * FROM users WHERE username = 'noamnau';
```

**Schema:**
- `id`: UUID (primary key)
- `username`: Unique string
- `email`: Unique string
- `password_hash`: Bcrypt hashed password
- `full_name`: Optional string
- `preferred_language`: Default 'he'
- `is_active`: Boolean (default true)
- `is_guest`: Boolean (default false)
- `device_id`: Optional (for guest users)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Testing Authentication

### Test Login UI
```bash
# Start frontend
cd personal-ui-vite
PORT=8005 npm run dev

# Open browser
http://localhost:8005/login

# Test credentials
Username: noamnau
Password: Noam123!
```

### Test API Directly
```bash
# Login and save token
curl -s -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"noamnau","password":"Noam123!"}' \
  > /tmp/auth_response.json

# Extract token
TOKEN=$(jq -r '.access_token' /tmp/auth_response.json)

# Use token for API calls
curl -s http://localhost:8000/exercises/ \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Check Token in Browser
```javascript
// Browser console
const token = localStorage.getItem('sweatbot_auth_token');
const user = JSON.parse(localStorage.getItem('sweatbot_user'));

console.log('Token:', token);
console.log('User:', user);
console.log('Is Guest:', user.is_guest);
```

## Troubleshooting

### "Invalid token" Error
- Token may have expired (7 days for real users)
- Clear localStorage and login again:
  ```javascript
  localStorage.clear();
  // Navigate to /login
  ```

### "Incorrect username or password"
- Verify credentials (case-sensitive)
- Check user exists in database:
  ```bash
  psql -h localhost -p 8001 -U fitness_user -d hebrew_fitness \
    -c "SELECT username, email, is_active FROM users WHERE username='noamnau';"
  ```

### Guest User Not Creating
- Check backend logs for errors
- Verify `/auth/guest` endpoint is accessible
- Check device_id generation in browser console

### Token Not Persisting
- Check localStorage is enabled in browser
- Verify no browser extensions blocking storage
- Check for incognito mode (clears on close)

## Migration from Guest to Real User

To convert a guest session to a real user:
1. User clicks "Login" (or navigates to /login)
2. Enters real credentials
3. `loginUser()` overwrites guest token
4. New token with `is_guest: false` stored
5. Chat continues with real user context

**Note:** Guest conversation history is not automatically migrated to real user account. This is a future feature.

## Creating New Users

### Via API
```bash
curl -X POST http://localhost:8000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "newuser",
    "email": "newuser@sweatbot.com",
    "password": "SecurePass123!",
    "full_name": "New User",
    "preferred_language": "he"
  }' | jq .
```

### Via Database (PostgreSQL)
```sql
-- Example user creation (use backend API instead)
INSERT INTO users (id, username, email, password_hash, full_name, preferred_language)
VALUES (
  gen_random_uuid(),
  'testuser',
  'test@sweatbot.com',
  -- Use backend hash_password() function
  '$2b$12$...',
  'Test User',
  'he'
);
```

## Environment Variables

Backend `.env` file:
```bash
# Security
SECRET_KEY=your-256-bit-secret-key-here
ALGORITHM=HS256

# Database
DATABASE_URL=postgresql+asyncpg://fitness_user:secure_password@localhost:8001/hebrew_fitness

# JWT Settings (optional overrides)
ACCESS_TOKEN_EXPIRE_DAYS=7  # Default token lifetime
```

## Summary

- **Real User**: `noamnau / Noam123!`
- **Login URL**: `http://localhost:8005/login`
- **API Endpoint**: `POST /auth/login`
- **Token Storage**: `localStorage.getItem('sweatbot_auth_token')`
- **Token Lifetime**: 7 days (real users), 23 hours (guests)
- **Auth Functions**: `personal-ui-vite/src/utils/auth.ts`
- **Backend Logic**: `backend/app/api/v1/auth.py`

---

**Generated:** 2025-10-06
**Version:** 1.0
**Status:** Production-ready authentication system
