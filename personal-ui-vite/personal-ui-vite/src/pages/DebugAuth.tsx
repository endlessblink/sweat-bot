import { useEffect, useState } from 'react';
import { designTokens } from '../design-system/tokens';
import { Button } from '../design-system/components/base';

/**
 * Debug Auth Page - Check localStorage auth state
 */
export function DebugAuth() {
  const [storageData, setStorageData] = useState<string>('');
  const [loginResult, setLoginResult] = useState<string>('');
  const [authState, setAuthState] = useState<string>('');

  const BACKEND_URL = 'http://localhost:8000';

  const showLocalStorage = () => {
    const token = localStorage.getItem('sweatbot_auth_token');
    const userStr = localStorage.getItem('sweatbot_user');
    const deviceId = localStorage.getItem('sweatbot_device_id');

    let output = '📦 localStorage Contents:\n\n';

    if (token) {
      output += `✅ Token exists (${token.length} chars)\n`;
      output += `Token: ${token.substring(0, 50)}...\n\n`;
    } else {
      output += '❌ No token found\n\n';
    }

    if (userStr) {
      const user = JSON.parse(userStr);
      output += '✅ User data exists:\n';
      output += JSON.stringify(user, null, 2) + '\n\n';

      if (user.is_guest === false) {
        output += '✅ is_guest = false (REAL USER)\n';
      } else if (user.is_guest === true) {
        output += '⚠️ is_guest = true (GUEST USER)\n';
      } else {
        output += '❌ is_guest is undefined or null!\n';
      }
    } else {
      output += '❌ No user data found\n';
    }

    if (deviceId) {
      output += `\nDevice ID: ${deviceId}\n`;
    }

    setStorageData(output);
  };

  const clearAuth = () => {
    localStorage.removeItem('sweatbot_auth_token');
    localStorage.removeItem('sweatbot_user');
    localStorage.removeItem('sweatbot_device_id');
    alert('✅ All auth data cleared!');
    showLocalStorage();
  };

  const testLogin = async () => {
    setLoginResult('🔄 Logging in...');

    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'noamnau',
          password: 'Noam123!'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const authData = await response.json();

      // Store exactly like the real loginUser function
      localStorage.setItem('sweatbot_auth_token', authData.access_token);
      localStorage.setItem('sweatbot_user', JSON.stringify({
        ...authData.user,
        is_guest: false,
        created_at: Date.now()
      }));

      let output = '✅ Login Successful!\n\n';
      output += 'Response from server:\n';
      output += JSON.stringify(authData, null, 2) + '\n\n';
      output += 'Stored in localStorage with is_guest: false\n';

      setLoginResult(output);
      showLocalStorage();

    } catch (error) {
      setLoginResult(`❌ Login Failed:\n${(error as Error).message}`);
    }
  };

  const checkAuthState = () => {
    const userStr = localStorage.getItem('sweatbot_user');

    if (!userStr) {
      setAuthState('❌ No user in localStorage\nState: UNAUTHENTICATED');
      return;
    }

    const userData = JSON.parse(userStr);

    let output = '🔍 Auth State Check:\n\n';
    output += `Username: ${userData.username || 'N/A'}\n`;
    output += `Email: ${userData.email || 'N/A'}\n`;
    output += `is_guest value: ${userData.is_guest}\n`;
    output += `is_guest type: ${typeof userData.is_guest}\n\n`;

    // Simulate the isGuestUser() function
    const isGuest = userData.is_guest ?? true;
    output += `isGuestUser() would return: ${isGuest}\n\n`;

    if (isGuest) {
      output += '⚠️ STATE: GUEST USER\n';
      output += 'You will see "👤 אורח" badge\n';
    } else {
      output += '✅ STATE: REAL USER\n';
      output += `You should see "🔐 ${userData.username}" badge\n`;
    }

    setAuthState(output);
  };

  useEffect(() => {
    showLocalStorage();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: designTokens.colors.background.primary,
      color: designTokens.colors.text.primary,
      padding: designTokens.spacing[6],
    }}>
      <h1 style={{
        fontSize: designTokens.typography.fontSize['3xl'],
        marginBottom: designTokens.spacing[6],
      }}>
        🔍 SweatBot Authentication Debug
      </h1>

      {/* Current localStorage */}
      <div style={{
        background: designTokens.colors.background.secondary,
        padding: designTokens.spacing[6],
        borderRadius: designTokens.borderRadius.lg,
        border: `1px solid ${designTokens.colors.border.default}`,
        marginBottom: designTokens.spacing[6],
      }}>
        <h2 style={{
          color: designTokens.colors.interactive.primary,
          marginBottom: designTokens.spacing[4],
        }}>
          Current localStorage Data
        </h2>
        <div style={{ marginBottom: designTokens.spacing[4] }}>
          <Button onClick={showLocalStorage} style={{ marginRight: designTokens.spacing[2] }}>
            Refresh Data
          </Button>
          <Button onClick={clearAuth} variant="danger">
            Clear All Auth
          </Button>
        </div>
        <pre style={{
          background: designTokens.colors.background.primary,
          padding: designTokens.spacing[4],
          borderRadius: designTokens.borderRadius.md,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
        }}>
          {storageData || 'Click "Refresh Data" to see contents...'}
        </pre>
      </div>

      {/* Test Login */}
      <div style={{
        background: designTokens.colors.background.secondary,
        padding: designTokens.spacing[6],
        borderRadius: designTokens.borderRadius.lg,
        border: `1px solid ${designTokens.colors.border.default}`,
        marginBottom: designTokens.spacing[6],
      }}>
        <h2 style={{
          color: designTokens.colors.interactive.primary,
          marginBottom: designTokens.spacing[4],
        }}>
          Test Login (noamnau)
        </h2>
        <Button onClick={testLogin} variant="primary">
          Login as noamnau
        </Button>
        {loginResult && (
          <pre style={{
            background: designTokens.colors.background.primary,
            padding: designTokens.spacing[4],
            borderRadius: designTokens.borderRadius.md,
            marginTop: designTokens.spacing[4],
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {loginResult}
          </pre>
        )}
      </div>

      {/* Check Auth State */}
      <div style={{
        background: designTokens.colors.background.secondary,
        padding: designTokens.spacing[6],
        borderRadius: designTokens.borderRadius.lg,
        border: `1px solid ${designTokens.colors.border.default}`,
      }}>
        <h2 style={{
          color: designTokens.colors.interactive.primary,
          marginBottom: designTokens.spacing[4],
        }}>
          Check Auth State
        </h2>
        <Button onClick={checkAuthState}>
          Check State
        </Button>
        {authState && (
          <pre style={{
            background: designTokens.colors.background.primary,
            padding: designTokens.spacing[4],
            borderRadius: designTokens.borderRadius.md,
            marginTop: designTokens.spacing[4],
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {authState}
          </pre>
        )}
      </div>
    </div>
  );
}
