import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { designTokens } from '../design-system/tokens';
import { Button, Card, Input } from '../design-system/components/base';
import { loginUser } from '../utils/auth';

/**
 * Login Page - Authenticate with real user credentials
 * Uses design system components for consistent styling
 *
 * Default Test Account:
 * Username: noamnau
 * Password: Noam123!
 */
export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(username, password);
      // Navigate to chat
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${designTokens.colors.background.secondary} 0%, ${designTokens.colors.background.primary} 100%)`,
      padding: designTokens.spacing[4],
    }}>
      <Card variant="elevated" style={{
        maxWidth: '400px',
        width: '100%',
      }}>
        <div style={{
          padding: designTokens.spacing[6],
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: designTokens.spacing[6],
          }}>
            <h1 style={{
              fontSize: designTokens.typography.fontSize['3xl'],
              fontWeight: designTokens.typography.fontWeight.bold,
              color: designTokens.colors.text.primary,
              marginBottom: designTokens.spacing[2],
            }}>
              💪 SweatBot
            </h1>
            <p style={{
              fontSize: designTokens.typography.fontSize.sm,
              color: designTokens.colors.text.secondary,
            }}>
              התחבר לחשבון שלך
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: designTokens.spacing[4] }}>
              <label style={{
                display: 'block',
                fontSize: designTokens.typography.fontSize.sm,
                fontWeight: designTokens.typography.fontWeight.medium,
                color: designTokens.colors.text.primary,
                marginBottom: designTokens.spacing[2],
              }}>
                שם משתמש
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="noamnau"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: designTokens.spacing[4] }}>
              <label style={{
                display: 'block',
                fontSize: designTokens.typography.fontSize.sm,
                fontWeight: designTokens.typography.fontWeight.medium,
                color: designTokens.colors.text.primary,
                marginBottom: designTokens.spacing[2],
              }}>
                סיסמה
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{
                padding: designTokens.spacing[3],
                marginBottom: designTokens.spacing[4],
                backgroundColor: designTokens.colors.semantic.error + '20',
                borderRadius: designTokens.borderRadius.md,
                border: `1px solid ${designTokens.colors.semantic.error}`,
              }}>
                <p style={{
                  fontSize: designTokens.typography.fontSize.sm,
                  color: designTokens.colors.semantic.error,
                  margin: 0,
                }}>
                  {error}
                </p>
              </div>
            )}

            <Button
              variant="primary"
              fullWidth
              disabled={loading}
              type="submit"
            >
              {loading ? 'מתחבר...' : 'התחבר'}
            </Button>
          </form>

          {/* Guest Mode Option */}
          <div style={{
            marginTop: designTokens.spacing[4],
            textAlign: 'center',
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: designTokens.colors.text.secondary,
                fontSize: designTokens.typography.fontSize.sm,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              או המשך כאורח
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
