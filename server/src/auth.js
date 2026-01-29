import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  getUserByEmail,
  getUserById,
  createOtp,
  getOtpByEmail,
  incrementOtpAttempts,
  markOtpUsed,
  cleanupExpiredOtps,
  createRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  setUserAdmin,
} from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '30d';

// Check if email is in admin list
export function isAdminEmail(email) {
  const adminEmails = process.env.ADMIN_EMAILS || '';
  const adminList = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return adminList.includes(email.toLowerCase());
}

// Activity broadcast callback - set by admin routes
let activityBroadcaster = null;

export function setActivityBroadcaster(fn) {
  activityBroadcaster = fn;
}

export function broadcastActivity(type, data) {
  if (activityBroadcaster) {
    activityBroadcaster(type, data);
  }
}

// Generate a 6-digit OTP
export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash a token for storage
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Parse duration string to milliseconds
function parseDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 minutes

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
}

// Request OTP for email
export function requestOtp(email) {
  // Clean up expired OTPs
  cleanupExpiredOtps.run(new Date().toISOString());

  const code = generateOtp();
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  createOtp.run(id, email.toLowerCase(), code, expiresAt);

  // Log to console (development mode)
  console.log('\n========================================');
  console.log(`OTP Code for ${email}: ${code}`);
  console.log('========================================\n');

  return { success: true };
}

// Verify OTP and return tokens
export function verifyOtp(email, code) {
  const normalizedEmail = email.toLowerCase();
  const now = new Date().toISOString();

  const otp = getOtpByEmail.get(normalizedEmail, now);

  if (!otp) {
    return { success: false, error: 'Invalid or expired code' };
  }

  if (otp.attempts >= 5) {
    markOtpUsed.run(otp.id);
    return { success: false, error: 'Too many attempts. Please request a new code.' };
  }

  if (otp.code !== code) {
    incrementOtpAttempts.run(otp.id);
    return { success: false, error: 'Invalid code' };
  }

  // Mark OTP as used
  markOtpUsed.run(otp.id);

  // Get or create user
  let user = getUserByEmail.get(normalizedEmail);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const userId = uuidv4();
    createUser.run(userId, normalizedEmail, now);
    user = getUserById.get(userId);
  }

  // Check if user should be admin
  const shouldBeAdmin = isAdminEmail(normalizedEmail);
  if (shouldBeAdmin && !user.is_admin) {
    setUserAdmin.run(1, user.id);
    user = getUserById.get(user.id);
  }

  // Broadcast new signup
  if (isNewUser) {
    broadcastActivity('signup', { email: normalizedEmail, timestamp: now });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    success: true,
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, isAdmin: !!user.is_admin },
  };
}

// Generate access token
export function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, isAdmin: !!user.is_admin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Generate refresh token
export function generateRefreshToken(user) {
  const token = uuidv4();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + parseDuration(REFRESH_EXPIRES_IN)).toISOString();

  createRefreshToken.run(uuidv4(), user.id, tokenHash, expiresAt);

  return token;
}

// Refresh access token
export function refreshAccessToken(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const now = new Date().toISOString();

  const storedToken = getRefreshToken.get(tokenHash, now);

  if (!storedToken) {
    return { success: false, error: 'Invalid or expired refresh token' };
  }

  const user = getUserById.get(storedToken.user_id);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const accessToken = generateAccessToken(user);

  return {
    success: true,
    accessToken,
    user: { id: user.id, email: user.email, isAdmin: !!user.is_admin },
  };
}

// Revoke refresh token (logout)
export function logout(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  revokeRefreshToken.run(tokenHash);
  return { success: true };
}

// Verify access token
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { success: true, userId: decoded.userId, email: decoded.email, isAdmin: !!decoded.isAdmin };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
}

// Revoke all user tokens (for account deletion)
export function revokeAllTokens(userId) {
  revokeAllUserTokens.run(userId);
}
