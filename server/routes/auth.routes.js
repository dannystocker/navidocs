/**
 * Authentication Routes
 *
 * POST /api/auth/register - Register new user
 * POST /api/auth/login - Login user
 * POST /api/auth/refresh - Refresh access token
 * POST /api/auth/logout - Logout (revoke refresh token)
 * POST /api/auth/logout-all - Logout all devices
 * POST /api/auth/password/reset-request - Request password reset
 * POST /api/auth/password/reset - Reset password with token
 * POST /api/auth/email/verify - Verify email with token
 * GET  /api/auth/me - Get current user info
 */

import express from 'express';
import * as authService from '../services/auth.service.js';
import { logAuditEvent } from '../services/audit.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await authService.register({ email, password, name });

    // Log audit event
    await logAuditEvent({
      userId: result.userId,
      eventType: 'user.register',
      status: 'success',
      ipAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      userId: result.userId,
      email: result.email
    });

  } catch (error) {
    await logAuditEvent({
      eventType: 'user.register',
      status: 'failure',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: JSON.stringify({ error: error.message, email: req.body.email })
    });

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const deviceInfo = req.headers['user-agent'];

    const result = await authService.login({
      email,
      password,
      deviceInfo,
      ipAddress
    });

    // Log audit event
    await logAuditEvent({
      userId: result.user.id,
      eventType: 'user.login',
      status: 'success',
      ipAddress,
      userAgent: deviceInfo
    });

    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user
    });

  } catch (error) {
    await logAuditEvent({
      eventType: 'user.login',
      status: 'failure',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: JSON.stringify({ error: error.message, email: req.body.email })
    });

    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    await logAuditEvent({
      userId: result.user.id,
      eventType: 'token.refresh',
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      accessToken: result.accessToken,
      user: result.user
    });

  } catch (error) {
    await logAuditEvent({
      eventType: 'token.refresh',
      status: 'failure',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: JSON.stringify({ error: error.message })
    });

    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Logout (revoke refresh token)
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    await authService.revokeRefreshToken(refreshToken);

    await logAuditEvent({
      userId: req.user?.id,
      eventType: 'user.logout',
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Logout all devices (revoke all refresh tokens)
 */
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    await authService.revokeAllUserTokens(req.user.userId);

    await logAuditEvent({
      userId: req.user.userId,
      eventType: 'user.logout_all',
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Request password reset
 */
router.post('/password/reset-request', async (req, res) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await authService.requestPasswordReset(email, ipAddress);

    await logAuditEvent({
      eventType: 'password.reset_request',
      status: 'success',
      ipAddress,
      userAgent: req.headers['user-agent'],
      metadata: JSON.stringify({ email })
    });

    res.json({
      success: true,
      message: 'If your email exists, you will receive a password reset link'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reset password with token
 */
router.post('/password/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    await authService.resetPassword(token, newPassword);

    await logAuditEvent({
      eventType: 'password.reset',
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    await logAuditEvent({
      eventType: 'password.reset',
      status: 'failure',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: JSON.stringify({ error: error.message })
    });

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Verify email with token
 */
router.post('/email/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    const result = await authService.verifyEmail(token);

    await logAuditEvent({
      eventType: 'email.verify',
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: JSON.stringify({ email: result.email })
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      email: result.email
    });

  } catch (error) {
    await logAuditEvent({
      eventType: 'email.verify',
      status: 'failure',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: JSON.stringify({ error: error.message })
    });

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get current user info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
