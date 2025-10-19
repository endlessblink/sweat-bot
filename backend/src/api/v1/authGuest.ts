import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from '../../utils/logger';
import { redisService } from '../../services/redisService';

export interface GuestUser {
  id: string;
  sessionId: string;
  deviceInfo?: string;
  userAgent?: string;
  createdAt: Date;
  lastActive: Date;
}

export interface GuestAuthResponse {
  success: boolean;
  data?: {
    user: Omit<GuestUser, 'lastActive'>;
    token: string;
    refreshToken?: string;
    expiresAt: number;
  };
  error?: string;
  timestamp: string;
}

// Guest sessions are now stored in Redis via redisService
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export class AuthGuestController {
  public async createGuestSession(req: Request, res: Response): Promise<void> {
    try {
      const deviceInfo = req.headers['user-agent'];
      const userAgent = req.headers['user-agent'];

      const userId = `guest_${crypto.randomUUID()}`;
      const sessionId = `session_${crypto.randomUUID()}`;
      const now = new Date();

      const guestUser: GuestUser = {
        id: userId,
        sessionId,
        deviceInfo,
        userAgent,
        createdAt: now,
        lastActive: now,
      };

      // Store user session in Redis
      await redisService.createSession({
        userId,
        sessionId,
        deviceInfo,
        userAgent,
        createdAt: now,
        lastActive: now,
        username: `אורח_${userId.slice(-8)}`, // Hebrew guest username
        email: `guest_${userId.slice(-8)}@sweatbot.local`, // Guest email
        is_guest: true,
        role: 'guest'
      });

      // Generate JWT token
      const token = generateToken(guestUser);
      const refreshToken = generateRefreshToken(guestUser);
      const expiresAt = Date.now() + TOKEN_EXPIRY;

      logger.info('Guest session created', {
        userId,
        sessionId,
        deviceInfo,
        userAgent,
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: guestUser.id,
            username: `אורח_${guestUser.id.slice(-8)}`, // Hebrew guest username
            email: `guest_${guestUser.id.slice(-8)}@sweatbot.local`, // Guest email
            is_guest: true,
            role: 'guest',
            sessionId: guestUser.sessionId,
            deviceInfo: guestUser.deviceInfo,
            userAgent: guestUser.userAgent,
            createdAt: guestUser.createdAt,
          },
          token,
          refreshToken,
          expiresAt,
        },
        timestamp: new Date().toISOString(),
      } as GuestAuthResponse);
    } catch (error) {
      logger.error('Failed to create guest session:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create guest session',
        timestamp: new Date().toISOString(),
      } as GuestAuthResponse);
    }
  }

  public async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Token is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Check if user session exists in Redis
      const user = await redisService.getSession(decoded.sessionId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User session not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Update last active time in Redis
      await redisService.updateSessionActivity(decoded.sessionId);

      res.json({
        success: true,
        data: {
          user: {
            id: user.userId,
            username: user.username || `אורח_${user.userId.slice(-8)}`, // Hebrew guest username
            email: user.email || `guest_${user.userId.slice(-8)}@sweatbot.local`, // Guest email
            is_guest: user.is_guest,
            role: user.role,
            sessionId: user.sessionId,
            deviceInfo: user.deviceInfo,
            userAgent: user.userAgent,
            createdAt: user.createdAt,
          },
          valid: true,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Token validation failed:', error);
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid token',
        timestamp: new Date().toISOString(),
      });
    }
  }

  public async refreshSession(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const decoded = jwt.verify(refreshToken, JWT_SECRET + '-refresh') as any;

      const user = await redisService.getSession(decoded.sessionId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          timestamp: new Date().toISOString(),
        } as GuestAuthResponse);
        return;
      }

      // Generate new tokens
      const guestUserForToken = {
        id: user.userId,
        sessionId: user.sessionId,
        deviceInfo: user.deviceInfo,
        userAgent: user.userAgent,
        createdAt: user.createdAt,
        lastActive: new Date(),
      };
      const newToken = generateToken(guestUserForToken);
      const newRefreshToken = generateRefreshToken(guestUserForToken);
      const expiresAt = Date.now() + TOKEN_EXPIRY;

      // Update last active in Redis
      await redisService.updateSessionActivity(decoded.sessionId);

      res.json({
        success: true,
        data: {
          user: {
            id: user.userId,
            username: user.username || `אורח_${user.userId.slice(-8)}`, // Hebrew guest username
            email: user.email || `guest_${user.userId.slice(-8)}@sweatbot.local`, // Guest email
            is_guest: user.is_guest,
            role: user.role,
            sessionId: user.sessionId,
            deviceInfo: user.deviceInfo,
            userAgent: user.userAgent,
            createdAt: user.createdAt,
          },
          token: newToken,
          refreshToken: newRefreshToken,
          expiresAt,
        },
        timestamp: new Date().toISOString(),
      } as GuestAuthResponse);
    } catch (error) {
      logger.error('Session refresh failed:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        timestamp: new Date().toISOString(),
      } as GuestAuthResponse);
    }
  }

  public async logoutUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, sessionId } = req.body;

      if (!userId && !sessionId) {
        res.status(400).json({
          success: false,
          error: 'User ID or Session ID is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Delete session from Redis
      if (sessionId) {
        await redisService.deleteSession(sessionId);
        logger.info('User logged out by session', { sessionId });
      } else if (userId) {
        // If only userId provided, we need to find and delete all user sessions
        const userSessions = await redisService.getUserSessions(userId);
        for (const session of userSessions) {
          await redisService.deleteSession(session);
        }
        logger.info('User logged out by userId', { userId, sessionsDeleted: userSessions.length });
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Logout failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  public async getHealthStatus(req: Request, res: Response): Promise<void> {
    // Get Redis health status and session count
    const redisHealth = await redisService.healthCheck();

    res.json({
      success: true,
      data: {
        jwtReady: !!JWT_SECRET && JWT_SECRET !== 'fallback-secret-key-for-development',
        redisConnected: redisHealth.connected,
        sessionCount: 'Redis-based sessions',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Helper functions
function generateToken(user: GuestUser): string {
  return jwt.sign(
    {
      userId: user.id,
      sessionId: user.sessionId,
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function generateRefreshToken(user: GuestUser): string {
  return jwt.sign(
    {
      userId: user.id,
      sessionId: user.sessionId,
      type: 'refresh',
    },
    JWT_SECRET + '-refresh',
    { expiresIn: '7d' }
  );
}

// Export singleton instance
export const authGuestController = new AuthGuestController();