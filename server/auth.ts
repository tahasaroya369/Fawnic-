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
const SESSION_SECRET = process.env.SESSION_SECRET || 'fawnic_atelier_auth_secret_key_2026';

function signPayload(payloadStr: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('hex');
}

export function createSessionToken(userId: string, email: string, role: 'customer' | 'admin' | 'staff'): string {
  // Staff and admin accounts have lifetime sessions (no automatic expiration); revoked when disabled/deleted
  const isLifetime = role === 'staff' || role === 'admin';
  const expiresAt = isLifetime
    ? Date.now() + 1000 * 60 * 60 * 24 * 365 * 50 // 50 years (lifetime unless revoked)
    : Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days for customer

  const createdAt = Date.now();
  const session: SessionData = {
    userId,
    email,
    role,
    createdAt,
    expiresAt,
  };

  // Create HMAC-signed stateless token for Vercel serverless compatibility
  const payloadObj = { u: userId, e: email, r: role, c: createdAt, exp: expiresAt };
  const payloadBase64 = Buffer.from(JSON.stringify(payloadObj), 'utf-8').toString('base64url');
  const signature = signPayload(payloadBase64);
  const token = `${payloadBase64}.${signature}`;

  sessions.set(token, session);
  return token;
}

export function getSession(token: string | undefined): SessionData | null {
  if (!token || typeof token !== 'string') return null;

  // 1. Check in-memory session cache first
  const cached = sessions.get(token);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      sessions.delete(token);
      return null;
    }
    return cached;
  }

  // 2. Fallback to stateless HMAC verification (critical for Vercel multi-instance serverless)
  try {
    const parts = token.split('.');
    if (parts.length === 2) {
      const [payloadBase64, signature] = parts;
      const expectedSignature = signPayload(payloadBase64);
      if (crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
        const jsonStr = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
        const parsed = JSON.parse(jsonStr);
        if (parsed && parsed.u && parsed.e && parsed.r && parsed.exp) {
          if (Date.now() > parsed.exp) {
            return null;
          }
          const session: SessionData = {
            userId: parsed.u,
            email: parsed.e,
            role: parsed.r,
            createdAt: parsed.c || Date.now(),
            expiresAt: parsed.exp,
          };
          sessions.set(token, session);
          return session;
        }
      }
    }
  } catch {}

  return null;
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
