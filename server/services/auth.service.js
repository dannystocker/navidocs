/**
 * Authentication Service
 *
 * Handles user registration, login, token management, and password operations
 * Uses JWT for access tokens and refresh tokens for session management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/db.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds
const BCRYPT_ROUNDS = 12;

/**
 * Register a new user
 */
export async function register({ email, password, name }) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Check if user already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = now + (24 * 60 * 60); // 24 hours

  // Create user
  const userId = uuidv4();

  db.prepare(`
    INSERT INTO users (
      id, email, name, password_hash,
      email_verified, email_verification_token, email_verification_expires,
      status, failed_login_attempts, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    email.toLowerCase(),
    name || null,
    passwordHash,
    0, // email_verified
    verificationToken,
    verificationExpires,
    'active',
    0, // failed_login_attempts
    now,
    now
  );

  // TODO: Send verification email (implement email service)
  console.log(`[Auth] User registered: ${email} (verification token: ${verificationToken})`);

  return {
    userId,
    email: email.toLowerCase(),
    name,
    verificationToken // Return for testing, remove in production
  };
}

/**
 * Login user and issue tokens
 */
export async function login({ email, password, deviceInfo, ipAddress }) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Find user
  const user = db.prepare(`
    SELECT id, email, name, password_hash, status, email_verified,
           failed_login_attempts, locked_until
    FROM users
    WHERE email = ?
  `).get(email.toLowerCase());

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if account is locked
  if (user.locked_until && user.locked_until > now) {
    const minutesLeft = Math.ceil((user.locked_until - now) / 60);
    throw new Error(`Account is locked. Try again in ${minutesLeft} minutes`);
  }

  // Check if account is suspended
  if (user.status === 'suspended') {
    throw new Error('Account is suspended. Contact support');
  }

  if (user.status === 'deleted') {
    throw new Error('Account not found');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    // Increment failed login attempts
    const failedAttempts = (user.failed_login_attempts || 0) + 1;
    const lockUntil = failedAttempts >= 5 ? now + (15 * 60) : null; // Lock for 15 mins after 5 attempts

    db.prepare(`
      UPDATE users
      SET failed_login_attempts = ?,
          locked_until = ?
      WHERE id = ?
    `).run(failedAttempts, lockUntil, user.id);

    if (lockUntil) {
      throw new Error('Too many failed attempts. Account locked for 15 minutes');
    }

    throw new Error('Invalid email or password');
  }

  // Reset failed login attempts on successful login
  db.prepare(`
    UPDATE users
    SET failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = ?
    WHERE id = ?
  `).run(now, user.id);

  // Generate access token (JWT)
  const accessToken = generateAccessToken(user);

  // Generate refresh token
  const refreshToken = await createRefreshToken({
    userId: user.id,
    deviceInfo,
    ipAddress
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: Boolean(user.email_verified)
    }
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  // Hash the token to compare
  const tokenHash = hashToken(refreshToken);

  // Find refresh token
  const token = db.prepare(`
    SELECT id, user_id, expires_at, revoked
    FROM refresh_tokens
    WHERE token_hash = ?
  `).get(tokenHash);

  if (!token) {
    throw new Error('Invalid refresh token');
  }

  if (token.revoked) {
    throw new Error('Refresh token has been revoked');
  }

  if (token.expires_at < now) {
    throw new Error('Refresh token has expired');
  }

  // Get user
  const user = db.prepare(`
    SELECT id, email, name, status, email_verified
    FROM users
    WHERE id = ?
  `).get(token.user_id);

  if (!user || user.status !== 'active') {
    throw new Error('User not found or inactive');
  }

  // Generate new access token
  const accessToken = generateAccessToken(user);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: Boolean(user.email_verified)
    }
  };
}

/**
 * Revoke refresh token (logout)
 */
export async function revokeRefreshToken(refreshToken) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  if (!refreshToken) {
    return { success: true }; // Silently succeed if no token
  }

  const tokenHash = hashToken(refreshToken);

  db.prepare(`
    UPDATE refresh_tokens
    SET revoked = 1,
        revoked_at = ?
    WHERE token_hash = ?
  `).run(now, tokenHash);

  return { success: true };
}

/**
 * Revoke all refresh tokens for a user (logout all devices)
 */
export async function revokeAllUserTokens(userId) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    UPDATE refresh_tokens
    SET revoked = 1,
        revoked_at = ?
    WHERE user_id = ? AND revoked = 0
  `).run(now, userId);

  return { success: true };
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email, ipAddress) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Find user
  const user = db.prepare('SELECT id, email, status FROM users WHERE email = ?')
    .get(email.toLowerCase());

  // Always return success (don't reveal if email exists)
  if (!user || user.status !== 'active') {
    console.log(`[Auth] Password reset requested for non-existent/inactive user: ${email}`);
    return { success: true };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(resetToken);
  const expiresAt = now + (60 * 60); // 1 hour

  // Store reset token
  const tokenId = uuidv4();
  db.prepare(`
    INSERT INTO password_reset_tokens (
      id, user_id, token_hash, expires_at, used, ip_address, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(tokenId, user.id, tokenHash, expiresAt, 0, ipAddress, now);

  // TODO: Send password reset email
  console.log(`[Auth] Password reset token for ${email}: ${resetToken}`);

  return {
    success: true,
    resetToken // Return for testing, remove in production
  };
}

/**
 * Reset password using token
 */
export async function resetPassword(token, newPassword) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  if (!token || !newPassword) {
    throw new Error('Token and new password are required');
  }

  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const tokenHash = hashToken(token);

  // Find reset token
  const resetToken = db.prepare(`
    SELECT id, user_id, expires_at, used
    FROM password_reset_tokens
    WHERE token_hash = ?
  `).get(tokenHash);

  if (!resetToken) {
    throw new Error('Invalid or expired reset token');
  }

  if (resetToken.used) {
    throw new Error('Reset token has already been used');
  }

  if (resetToken.expires_at < now) {
    throw new Error('Reset token has expired');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password and mark token as used
  db.transaction(() => {
    db.prepare(`
      UPDATE users
      SET password_hash = ?,
          failed_login_attempts = 0,
          locked_until = NULL,
          updated_at = ?
      WHERE id = ?
    `).run(passwordHash, now, resetToken.user_id);

    db.prepare(`
      UPDATE password_reset_tokens
      SET used = 1,
          used_at = ?
      WHERE id = ?
    `).run(now, resetToken.id);

    // Revoke all refresh tokens for security
    db.prepare(`
      UPDATE refresh_tokens
      SET revoked = 1,
          revoked_at = ?
      WHERE user_id = ? AND revoked = 0
    `).run(now, resetToken.user_id);
  })();

  return { success: true };
}

/**
 * Verify email with token
 */
export async function verifyEmail(token) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  if (!token) {
    throw new Error('Verification token is required');
  }

  // Find user with this verification token
  const user = db.prepare(`
    SELECT id, email, email_verified, email_verification_expires
    FROM users
    WHERE email_verification_token = ?
  `).get(token);

  if (!user) {
    throw new Error('Invalid verification token');
  }

  if (user.email_verified) {
    return { success: true, message: 'Email already verified' };
  }

  if (user.email_verification_expires < now) {
    throw new Error('Verification token has expired');
  }

  // Mark email as verified
  db.prepare(`
    UPDATE users
    SET email_verified = 1,
        email_verification_token = NULL,
        email_verification_expires = NULL,
        updated_at = ?
    WHERE id = ?
  `).run(now, user.id);

  return {
    success: true,
    email: user.email
  };
}

// ==================== Helper Functions ====================

/**
 * Generate JWT access token
 */
function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    emailVerified: Boolean(user.email_verified)
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'navidocs',
    subject: user.id
  });
}

/**
 * Create refresh token
 */
async function createRefreshToken({ userId, deviceInfo, ipAddress }) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Generate random token
  const token = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(token);

  // Store in database
  const tokenId = uuidv4();
  const expiresAt = now + REFRESH_TOKEN_EXPIRES_IN;

  db.prepare(`
    INSERT INTO refresh_tokens (
      id, user_id, token_hash, device_info, ip_address,
      expires_at, revoked, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tokenId,
    userId,
    tokenHash,
    deviceInfo || null,
    ipAddress || null,
    expiresAt,
    0,
    now
  );

  return token;
}

/**
 * Hash token for storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify JWT token
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      valid: true,
      payload: decoded
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Get user by ID
 */
export function getUserById(userId) {
  const db = getDb();

  const user = db.prepare(`
    SELECT id, email, name, status, email_verified, created_at, last_login_at
    FROM users
    WHERE id = ?
  `).get(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    emailVerified: Boolean(user.email_verified),
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at
  };
}
