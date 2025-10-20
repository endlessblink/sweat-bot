import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { DatabaseService } from './DatabaseService';
import { User, CreateUserRequest, LoginRequest } from '@/models/User';
import { CustomError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private db: DatabaseService;
  private saltRounds = 12;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  /**
   * Register a new user
   */
  async register(userData: CreateUserRequest): Promise<{ user: User; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.db.getUserByEmail(userData.email);
      if (existingUser) {
        throw new CustomError('Email already registered', 409);
      }

      // Hash password
      const passwordHash = await this.hashPassword(userData.password);

      // Create user
      const user = await this.db.createUser({
        email: userData.email,
        passwordHash,
        name: userData.name,
        age: userData.age,
        weight: userData.weight,
        height: userData.height,
        fitnessGoals: userData.fitnessGoals,
        preferredLanguage: userData.preferredLanguage || 'en'
      });

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id!,
        email: user.email,
        name: user.name
      });

      logger.info(`New user registered: ${user.email}`);

      // Return user without password hash
      const { passwordHash: _, ...userResponse } = user;
      return { user: userResponse as User, token };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate user and return token
   */
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    try {
      // Find user by email
      const user = await this.db.getUserByEmail(credentials.email);
      if (!user) {
        throw new CustomError('Invalid email or password', 401);
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(credentials.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new CustomError('Invalid email or password', 401);
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id!,
        email: user.email,
        name: user.name
      });

      logger.info(`User logged in: ${user.email}`);

      // Return user without password hash
      const { passwordHash: _, ...userResponse } = user;
      return { user: userResponse as User, token };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

      // Get user from database
      const user = await this.db.getUserById(decoded.userId);
      if (!user) {
        throw new CustomError('User not found', 401);
      }

      // Return user without password hash
      const { passwordHash: _, ...userResponse } = user;
      return userResponse as User;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid token', 401);
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new CustomError('Token expired', 401);
      }
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user
      const user = await this.db.getUserById(userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new CustomError('Current password is incorrect', 400);
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password in database
      await this.db.updateUser(userId, { passwordHash: newPasswordHash });

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await this.db.getUserByEmail(email);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = jwt.sign(
        { userId: user.id!, email: user.email, type: 'password_reset' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      logger.info(`Password reset token generated for: ${user.email}`);
      return resetToken;
    } catch (error) {
      logger.error('Password reset token generation error:', error);
      throw error;
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      // Verify reset token
      const decoded = jwt.verify(resetToken, config.JWT_SECRET) as any;

      if (decoded.type !== 'password_reset') {
        throw new CustomError('Invalid reset token', 400);
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      await this.db.updateUser(decoded.userId, { passwordHash: newPasswordHash });

      logger.info(`Password reset completed for user ID: ${decoded.userId}`);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid or expired reset token', 400);
      }
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET) as JWTPayload;

      // Get user to ensure they still exist
      const user = await this.db.getUserById(decoded.userId);
      if (!user) {
        throw new CustomError('User not found', 401);
      }

      // Generate new access token
      const newToken = this.generateToken({
        userId: user.id!,
        email: user.email,
        name: user.name
      });

      logger.info(`Token refreshed for user: ${user.email}`);
      return newToken;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: JWTPayload): string {
    const options: jwt.SignOptions = {
      expiresIn: (config.JWT_EXPIRES_IN || '7d') as any,
      issuer: 'sweatbot-api',
      audience: 'sweatbot-client'
    };
    return jwt.sign(payload, config.JWT_SECRET as string, options);
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token will expire within specified minutes
   */
  async isTokenExpiringSoon(token: string, minutesThreshold: number = 5): Promise<boolean> {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      const threshold = minutesThreshold * 60;

      return (decoded.exp - now) <= threshold;
    } catch (error) {
      return true;
    }
  }
}

export default AuthService;