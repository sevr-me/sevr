import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'sevr.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  -- Users
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    encryption_salt TEXT,
    encryption_verifier TEXT
  );

  -- Encrypted user data (E2E encrypted services)
  CREATE TABLE IF NOT EXISTS encrypted_data (
    user_id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    iv TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- OTP codes
  CREATE TABLE IF NOT EXISTS otp_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    used INTEGER DEFAULT 0
  );

  -- Refresh tokens
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Services
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    email TEXT,
    guide TEXT,
    migrated INTEGER DEFAULT 0,
    first_seen TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, domain)
  );

  -- Domain guides (community-editable)
  CREATE TABLE IF NOT EXISTS domain_guides (
    domain TEXT PRIMARY KEY,
    guide_content TEXT NOT NULL,
    settings_url TEXT,
    updated_by TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
  CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);
  CREATE INDEX IF NOT EXISTS idx_domain_guides_domain ON domain_guides(domain);
`);

// Migration: Add settings_url column if it doesn't exist
try {
  db.exec(`ALTER TABLE domain_guides ADD COLUMN settings_url TEXT`);
} catch (err) {
  // Column already exists, ignore
}

// Migration: Add encryption columns to users table
const userColumns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);

if (!userColumns.includes('encryption_salt')) {
  db.exec(`ALTER TABLE users ADD COLUMN encryption_salt TEXT`);
  console.log('Added encryption_salt column to users table');
}

if (!userColumns.includes('encryption_verifier')) {
  db.exec(`ALTER TABLE users ADD COLUMN encryption_verifier TEXT`);
  console.log('Added encryption_verifier column to users table');
}

if (!userColumns.includes('recovery_verifier')) {
  db.exec(`ALTER TABLE users ADD COLUMN recovery_verifier TEXT`);
  console.log('Added recovery_verifier column to users table');
}

if (!userColumns.includes('is_admin')) {
  db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
  console.log('Added is_admin column to users table');
}

if (!userColumns.includes('country_code')) {
  db.exec(`ALTER TABLE users ADD COLUMN country_code TEXT`);
  console.log('Added country_code column to users table');
}

// User queries
export const createUser = db.prepare(`
  INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)
`);

export const getUserByEmail = db.prepare(`
  SELECT * FROM users WHERE email = ?
`);

export const getUserById = db.prepare(`
  SELECT * FROM users WHERE id = ?
`);

export const deleteUser = db.prepare(`
  DELETE FROM users WHERE id = ?
`);

// OTP queries
export const createOtp = db.prepare(`
  INSERT INTO otp_codes (id, email, code, expires_at) VALUES (?, ?, ?, ?)
`);

export const getOtpByEmail = db.prepare(`
  SELECT * FROM otp_codes WHERE email = ? AND used = 0 AND expires_at > ? ORDER BY expires_at DESC LIMIT 1
`);

export const incrementOtpAttempts = db.prepare(`
  UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?
`);

export const markOtpUsed = db.prepare(`
  UPDATE otp_codes SET used = 1 WHERE id = ?
`);

export const cleanupExpiredOtps = db.prepare(`
  DELETE FROM otp_codes WHERE expires_at < ? OR used = 1
`);

// Refresh token queries
export const createRefreshToken = db.prepare(`
  INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)
`);

export const getRefreshToken = db.prepare(`
  SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > ?
`);

export const revokeRefreshToken = db.prepare(`
  UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?
`);

export const revokeAllUserTokens = db.prepare(`
  UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?
`);

// Service queries
export const getServicesByUser = db.prepare(`
  SELECT * FROM services WHERE user_id = ? ORDER BY name
`);

export const getServiceById = db.prepare(`
  SELECT * FROM services WHERE id = ? AND user_id = ?
`);

export const upsertService = db.prepare(`
  INSERT INTO services (id, user_id, domain, name, category, email, guide, migrated, first_seen, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(user_id, domain) DO UPDATE SET
    name = excluded.name,
    category = excluded.category,
    email = excluded.email,
    guide = excluded.guide
`);

export const updateService = db.prepare(`
  UPDATE services SET migrated = ? WHERE id = ? AND user_id = ?
`);

export const deleteService = db.prepare(`
  DELETE FROM services WHERE id = ? AND user_id = ?
`);

export const deleteAllUserServices = db.prepare(`
  DELETE FROM services WHERE user_id = ?
`);

// Domain guide queries
export const getGuideByDomain = db.prepare(`
  SELECT dg.domain, dg.guide_content, dg.settings_url, dg.updated_at, u.email as updated_by_email
  FROM domain_guides dg
  LEFT JOIN users u ON dg.updated_by = u.id
  WHERE dg.domain = ?
`);

export const getAllGuides = db.prepare(`
  SELECT dg.domain, dg.guide_content, dg.settings_url, dg.updated_at, u.email as updated_by_email
  FROM domain_guides dg
  LEFT JOIN users u ON dg.updated_by = u.id
`);

export const upsertGuide = db.prepare(`
  INSERT INTO domain_guides (domain, guide_content, settings_url, updated_by, updated_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(domain) DO UPDATE SET
    guide_content = excluded.guide_content,
    settings_url = excluded.settings_url,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at
`);

// User encryption setup
export const setUserEncryption = db.prepare(`
  UPDATE users SET encryption_salt = ?, encryption_verifier = ?, recovery_verifier = ? WHERE id = ?
`);

export const getUserEncryption = db.prepare(`
  SELECT encryption_salt, encryption_verifier, recovery_verifier FROM users WHERE id = ?
`);

export const resetUserEncryption = db.prepare(`
  UPDATE users SET encryption_salt = NULL, encryption_verifier = NULL, recovery_verifier = NULL WHERE id = ?
`);

// Encrypted data queries
export const getEncryptedData = db.prepare(`
  SELECT data, iv, updated_at FROM encrypted_data WHERE user_id = ?
`);

export const upsertEncryptedData = db.prepare(`
  INSERT INTO encrypted_data (user_id, data, iv, updated_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    data = excluded.data,
    iv = excluded.iv,
    updated_at = excluded.updated_at
`);

export const deleteEncryptedData = db.prepare(`
  DELETE FROM encrypted_data WHERE user_id = ?
`);

// Admin queries
export const getUserCount = db.prepare(`
  SELECT COUNT(*) as count FROM users
`);

export const getGuideCount = db.prepare(`
  SELECT COUNT(*) as count FROM domain_guides
`);

export const getAllUsersWithStats = db.prepare(`
  SELECT
    u.id,
    u.email,
    u.created_at,
    u.is_admin,
    (SELECT COUNT(*) FROM services WHERE user_id = u.id) as service_count
  FROM users u
  ORDER BY u.created_at DESC
`);

export const setUserAdmin = db.prepare(`
  UPDATE users SET is_admin = ? WHERE id = ?
`);

export const setUserCountry = db.prepare(`
  UPDATE users SET country_code = ? WHERE id = ?
`);

export const setAllUsersCountry = db.prepare(`
  UPDATE users SET country_code = ? WHERE country_code IS NULL
`);

export const getUsersOverTime = db.prepare(`
  SELECT DATE(created_at) as date, COUNT(*) as count
  FROM users
  GROUP BY DATE(created_at)
  ORDER BY date ASC
`);

export const getUsersByCountry = db.prepare(`
  SELECT country_code, COUNT(*) as count
  FROM users
  WHERE country_code IS NOT NULL
  GROUP BY country_code
  ORDER BY count DESC
`);

export default db;
