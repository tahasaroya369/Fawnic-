import crypto from 'crypto';

// Secure password hashing using PBKDF2 with unique salts
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

// In-memory & persisted token sessions
interface SessionData {
  userId: string;
  email: string;
  role: 'customer' | 'admin' | 'staff';
  createdAt: number;
  expiresAt: number;
}

const sessions = new Map<string, SessionData>();

export function createSessionToken(userId: string, email: string, role: 'customer' | 'admin' | 'staff'): string {
  const token = crypto.randomBytes(32).toString('hex');
  // Staff and admin accounts have lifetime sessions (no automatic expiration); revoked when disabled/deleted
  const isLifetime = role === 'staff' || role === 'admin';
  const expiresAt = isLifetime
    ? Date.now() + 1000 * 60 * 60 * 24 * 365 * 50 // 50 years (lifetime unless revoked)
    : Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days for customer

  const session: SessionData = {
    userId,
    email,
    role,
    createdAt: Date.now(),
    expiresAt,
  };
  sessions.set(token, session);
  return token;
}

export function getSession(token: string | undefined): SessionData | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function removeSession(token: string | undefined): void {
  if (token) sessions.delete(token);
}

export function removeUserSessions(userId: string): void {
  for (const [token, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(token);
    }
  }
}
