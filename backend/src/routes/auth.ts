import express from 'express';
import { AuthService } from '../services/AuthService';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const authService = new AuthService();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateBody(schemas.register), asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
}));

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateBody(schemas.login), asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token
    }
  });
}));

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}));

/**
 * @route   PUT /auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  authenticateToken,
  validateBody({
    currentPassword: schemas.login.extract('password'),
    newPassword: schemas.register.extract('password')
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user!.userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

/**
 * @route   POST /auth/forgot-password
 * @desc    Generate password reset token
 * @access  Public
 */
router.post('/forgot-password',
  validateBody({
    email: schemas.register.extract('email')
  }),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const resetToken = await authService.generatePasswordResetToken(email);

    // In production, you would send this via email
    // For now, return the token (remove this in production!)
    logger.info(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'Password reset token generated',
      // Remove this in production - only send via email
      data: {
        resetToken,
        expiresIn: '1 hour'
      }
    });
  })
);

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password',
  validateBody({
    token: express.Router().use((req, res, next) => {
      if (!req.body.token || typeof req.body.token !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Reset token is required'
        });
      }
      next();
    }),
    newPassword: schemas.register.extract('password')
  }),
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  })
);

/**
 * @route   POST /auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token',
  validateBody({
    refreshToken: express.Router().use((req, res, next) => {
      if (!req.body.refreshToken || typeof req.body.refreshToken !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }
      next();
    })
  }),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const newToken = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken
      }
    });
  })
);

/**
 * @route   GET /auth/verify-token
 * @desc    Verify if token is valid (for debugging)
 * @access  Private
 */
router.get('/verify-token', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'No token provided'
    });
  }

  const decoded = authService.decodeToken(token);
  const isExpiringSoon = await authService.isTokenExpiringSoon(token);

  res.json({
    success: true,
    data: {
      valid: true,
      decoded,
      isExpiringSoon,
      user: req.user
    }
  });
}));

/**
 * @route   POST /auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // But we can log the event and potentially blacklist the token if needed
  logger.info(`User logged out: ${req.user?.email}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

export { router as authRoutes };