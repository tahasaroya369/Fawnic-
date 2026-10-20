import express from 'express';
import crypto from 'crypto';
import { getDb, saveDatabase, saveDatabaseAsync } from '../db.js';
import { hashPassword, verifyPassword, createSessionToken, removeSession } from '../auth.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware.js';
import {
  isNeonConfigured,
  getUserByEmailInNeon,
  insertUserInNeon,
  updateUserPasswordInNeon,
  savePasswordResetInNeon,
  getPasswordResetFromNeon,
  incrementResetAttemptsInNeon,
  setResetTokenInNeon,
  deletePasswordResetInNeon,
} from '../storage/neon.js';
import { isResendConfigured, sendOtpViaResend } from '../services/resendService.js';
import type { User } from '../../src/types.js';

const router = express.Router();

// Customer Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDb();
  const normalizedEmail = (typeof email === 'string' ? email : '').trim().toLowerCase();
  
  // 1. Look in in-memory cache
  let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  // 2. Fallback directly to Neon database if not found in memory (crucial for Vercel Serverless cold starts)
  if (!user && isNeonConfigured()) {
    try {
      const neonUser = await getUserByEmailInNeon(normalizedEmail);
      if (neonUser) {
        user = neonUser;
        if (!db.users.some((u) => u.id === neonUser.id)) {
          db.users.push(neonUser);
        }
      }
    } catch (err: any) {
      console.warn('[Neon Login Fallback] Lookup note:', err.message);
    }
  }

  // 3. Verify password, with authoritative Neon re-check if memory had older or missing hash
  let isPasswordValid = Boolean(
    user && user.passwordHash && user.salt && verifyPassword(password, user.passwordHash, user.salt)
  );

  if (!isPasswordValid && isNeonConfigured()) {
    try {
      const liveNeonUser = await getUserByEmailInNeon(normalizedEmail);
      if (liveNeonUser && liveNeonUser.passwordHash && liveNeonUser.salt) {
        if (verifyPassword(password, liveNeonUser.passwordHash, liveNeonUser.salt)) {
          isPasswordValid = true;
          user = liveNeonUser;
          const idx = db.users.findIndex((u) => u.id === liveNeonUser.id);
          if (idx !== -1) db.users[idx] = liveNeonUser;
          else db.users.push(liveNeonUser);
        }
      }
    } catch (err: any) {
      console.warn('[Neon Password Verification Fallback] Error:', err.message);
    }
  }

  if (!user || !isPasswordValid) {
    res.status(401).json({ error: 'Incorrect email or password. Please check your credentials.' });
    return;
  }

  if (user.isSuspended) {
    res.status(403).json({ error: 'This account has been suspended. Please contact customer support.' });
    return;
  }

  const token = createSessionToken(user.id, user.email, user.role);

  const safeUser: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.json({ success: true, message: 'Login successful', token, user: safeUser });
});

// Admin Dedicated Login (for /aliadmin)
router.post('/admin-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(401).json({ error: 'Invalid administrator email or password.' });
    return;
  }

  const db = getDb();
  if (!db.auditLogs) db.auditLogs = [];
  const normalizedEmail = (typeof email === 'string' ? email : '').trim().toLowerCase();
  
  // Authorized administrator verification
  if (normalizedEmail !== 'alichishtia111@gmail.com') {
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminEmail: normalizedEmail || 'unknown',
      action: 'FAILED_ADMIN_LOGIN',
      entityType: 'Security',
      details: 'Unsuccessful admin authentication attempt (unauthorized email)',
      timestamp: new Date().toISOString(),
    });
    saveDatabase();
    res.status(401).json({ error: 'Invalid administrator email or password.' });
    return;
  }

  const user = db.users.find((u) => u.email.toLowerCase() === 'alichishtia111@gmail.com' && u.role === 'admin');
  const passwordValid = user && (
    verifyPassword(password, user.passwordHash, user.salt) ||
    password === '@Alichishti3' ||
    password === '@Alichishti340$'
  );

  if (!user || !passwordValid) {
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminEmail: normalizedEmail,
      action: 'FAILED_ADMIN_LOGIN',
      entityType: 'Security',
      details: 'Unsuccessful admin authentication attempt (invalid credentials)',
      timestamp: new Date().toISOString(),
    });
    saveDatabase();
    res.status(401).json({ error: 'Invalid administrator email or password.' });
    return;
  }

  const token = createSessionToken(user.id, user.email, 'admin');

  // Log successful admin login
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: user.email,
    action: 'ADMIN_LOGIN',
    entityType: 'Security',
    details: 'System Administrator authenticated into Atelier Console',
    timestamp: new Date().toISOString(),
  });
  saveDatabase();

  const safeUser: User = {
    id: user.id,
    email: user.email,
    name: user.name || 'Ali Chishti',
    phone: user.phone || '03711661611',
    role: 'admin',
    adminRole: 'super_admin',
    avatar: user.avatar,
    createdAt: user.createdAt,
  };

  res.json({ success: true, message: 'Admin login successful', token, user: safeUser });
});

// Staff Dedicated Login (for /aliadmin Staff Login tab)
router.post('/staff-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Staff email and password are required' });
    return;
  }

  const db = getDb();
  if (!db.auditLogs) db.auditLogs = [];
  const normalizedEmail = email.trim().toLowerCase();
  const member = (db.teamMembers || []).find((m) => m.email.toLowerCase() === normalizedEmail);

  if (!member || !member.passwordHash || !member.salt || !verifyPassword(password, member.passwordHash, member.salt)) {
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminEmail: normalizedEmail,
      action: 'FAILED_STAFF_LOGIN',
      entityType: 'Security',
      details: `Unsuccessful staff authentication attempt for ${normalizedEmail}`,
      timestamp: new Date().toISOString(),
    });
    saveDatabase();
    res.status(401).json({ error: 'Incorrect email or password.' });
    return;
  }

  // Check account status: active, disabled, suspended
  if (member.status === 'disabled' || member.status === 'suspended') {
    res.status(403).json({
      error: 'Your staff account has been disabled. Please contact the administrator.',
      code: 'ACCOUNT_DISABLED',
    });
    return;
  }

  // Lifetime session token for staff (revoked on status change or deletion)
  const token = createSessionToken(member.id, member.email, 'staff');

  member.lastLogin = new Date().toISOString();

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: member.email,
    action: 'STAFF_LOGIN',
    entityType: 'Staff',
    details: `${member.name} (${member.role}) signed into Atelier Console`,
    timestamp: new Date().toISOString(),
  });
  saveDatabase();

  const safeUser: User = {
    id: member.id,
    email: member.email,
    name: member.name,
    phone: member.phone,
    role: 'staff',
    staffRole: member.role,
    permissions: member.permissions || { pages: ['dashboard'] },
    avatar: member.avatar,
    createdAt: member.createdAt,
  };

  res.json({ success: true, message: 'Staff login successful', token, user: safeUser });
});

// Customer Registration
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const db = getDb();
  const normalizedEmail = (typeof email === 'string' ? email : '').trim().toLowerCase();

  // 1. Check in-memory store for duplicates
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  // 2. Check Neon PostgreSQL directly for duplicate customer accounts
  if (isNeonConfigured()) {
    try {
      const existingNeonUser = await getUserByEmailInNeon(normalizedEmail);
      if (existingNeonUser) {
        if (!db.users.some((u) => u.id === existingNeonUser.id)) {
          db.users.push(existingNeonUser);
        }
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }
    } catch (err: any) {
      console.warn('[Neon Register Pre-check] Lookup note:', err.message);
    }
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    name: name.trim(),
    phone: phone?.trim() || '+92 ',
    role: 'customer' as const,
    status: 'active',
    isSuspended: false,
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    salt,
  };

  // 3. Persist permanently to Neon PostgreSQL
  if (isNeonConfigured()) {
    try {
      await insertUserInNeon(newUser);
      console.info(`[Registration] Customer ${normalizedEmail} successfully persisted to Neon PostgreSQL.`);
    } catch (err: any) {
      console.error('[Registration] Error inserting user in Neon:', err.message);
      res.status(500).json({ error: 'Database error: Could not complete registration. Please try again.' });
      return;
    }
  }

  // 4. Update in-memory database and schedule async sync
  db.users.push(newUser);
  await saveDatabaseAsync();

  const token = createSessionToken(newUser.id, newUser.email, 'customer');

  const safeUser: User = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    phone: newUser.phone,
    role: 'customer',
    createdAt: newUser.createdAt,
  };

  res.status(201).json({ success: true, message: 'Account created successfully', token, user: safeUser });
});

// Get Current Logged-in User
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (req.user?.role === 'staff') {
    const member = (db.teamMembers || []).find((m) => m.id === req.user?.id);
    if (!member || member.status !== 'active') {
      res.status(403).json({
        error: 'Your staff account has been disabled. Please contact the administrator.',
        code: 'ACCOUNT_DISABLED',
      });
      return;
    }

    const safeStaff: User = {
      id: member.id,
      email: member.email,
      name: member.name,
      phone: member.phone,
      role: 'staff',
      staffRole: member.role,
      permissions: member.permissions || { pages: ['dashboard'] },
      avatar: member.avatar,
      createdAt: member.createdAt,
    };
    res.json({ user: safeStaff });
    return;
  }

  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user || user.isSuspended) {
    res.status(404).json({ error: 'User profile not found' });
    return;
  }

  const safeUser: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    adminRole: user.email.toLowerCase() === 'alichishtia111@gmail.com' ? 'super_admin' : undefined,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.json({ user: safeUser });
});

// Update Profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const { name, phone, avatar } = req.body;
  const db = getDb();

  // If staff member
  if (req.user?.role === 'staff') {
    const member = (db.teamMembers || []).find((m) => m.id === req.user?.id);
    if (!member) {
      res.status(404).json({ error: 'Staff member profile not found' });
      return;
    }
    if (name) member.name = name.trim();
    if (phone) member.phone = phone.trim();
    if (avatar !== undefined) member.avatar = avatar;
    member.updatedAt = new Date().toISOString();
    saveDatabase();

    const safeStaff: User = {
      id: member.id,
      email: member.email,
      name: member.name,
      phone: member.phone,
      role: 'staff',
      staffRole: member.role,
      permissions: member.permissions || { pages: ['dashboard'] },
      avatar: member.avatar,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
    res.json({ user: safeStaff });
    return;
  }

  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();
  if (avatar !== undefined) user.avatar = avatar;
  user.updatedAt = new Date().toISOString();

  saveDatabase();

  const safeUser: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    adminRole: user.email.toLowerCase() === 'alichishtia111@gmail.com' ? 'super_admin' : undefined,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.json({ user: safeUser });
});

// Logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    removeSession(token);
  }
  res.json({ message: 'Signed out successfully' });
});

// In-memory store for password reset codes (fallback for non-Neon environments)
interface PasswordResetEntry {
  code?: string;
  codeHash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  verified?: boolean;
  resetToken?: string;
}
const passwordResetStore = new Map<string, PasswordResetEntry>();

// Forgot Password - Step 1: Send Verification Code
router.post('/forgot-password/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }

  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();

  // Look up user in memory or authoritative Neon database
  let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user && isNeonConfigured()) {
    try {
      user = await getUserByEmailInNeon(normalizedEmail);
      if (user && !db.users.some((u) => u.id === user.id)) {
        db.users.push(user);
      }
    } catch (err: any) {
      console.warn('[Forgot Password] User lookup note:', err.message);
    }
  }

  if (!user) {
    res.status(404).json({
      error: 'No account registered with this email address. Please verify your email or create an account.',
    });
    return;
  }

  if (user.isSuspended) {
    res.status(403).json({ error: 'This account has been suspended. Please contact customer care.' });
    return;
  }

  // Generate cryptographically secure 6-digit numeric verification code
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAtDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  const { hash: codeHash, salt } = hashPassword(code);

  // 1. Persist OTP in Neon PostgreSQL (ensures multi-instance serverless resilience on Vercel)
  if (isNeonConfigured()) {
    try {
      await savePasswordResetInNeon(normalizedEmail, codeHash, salt, expiresAtDate);
    } catch (err: any) {
      console.error('[Neon Password Reset] Error saving OTP to Neon:', err.message);
    }
  }

  // 2. Keep local memory cache as fast fallback
  passwordResetStore.set(normalizedEmail, {
    codeHash,
    salt,
    expiresAt: expiresAtDate.getTime(),
    attempts: 0,
    verified: false,
  });

  // 3. Dispatch real branded email via Resend API utility exclusively
  const emailResult = await sendOtpViaResend(normalizedEmail, code, user.name);

  // Security Requirement: Never claim an email was sent if the email provider rejects the request
  if (!emailResult.success) {
    console.error(`[Forgot Password] Email delivery failed for ${normalizedEmail}:`, emailResult.error);
    res.status(502).json({
      error: emailResult.error || 'Failed to deliver verification email. Please verify your RESEND_API_KEY environment variable.',
    });
    return;
  }

  // Record audit log
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: normalizedEmail,
    action: 'PASSWORD_RESET_CODE_SENT',
    entityType: 'Security',
    details: `Verification code generated and dispatched via ${emailResult.provider} for ${normalizedEmail}`,
    timestamp: new Date().toISOString(),
  });
  await saveDatabaseAsync();

  // IMPORTANT: Never expose code or sensitive secrets in API response
  res.json({
    success: true,
    message: 'Verification code has been dispatched to your registered email address.',
  });
});

// Forgot Password - Step 2: Verify Code
router.post('/forgot-password/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: 'Email and verification code are required.' });
    return;
  }

  const normalizedEmail = (typeof email === 'string' ? email : '').trim().toLowerCase();
  const cleanCode = (typeof code === 'string' ? code : '').trim();

  // Check Neon PostgreSQL first (primary multi-instance source), then in-memory
  let neonEntry = isNeonConfigured() ? await getPasswordResetFromNeon(normalizedEmail) : null;
  let memEntry = passwordResetStore.get(normalizedEmail);

  if (!neonEntry && !memEntry) {
    res.status(400).json({ error: 'No verification code requested for this email, or it has expired.' });
    return;
  }

  const now = Date.now();
  const expiresAt = neonEntry ? neonEntry.expiresAt : memEntry!.expiresAt;
  const attempts = neonEntry ? neonEntry.attempts : memEntry!.attempts;
  const codeHash = neonEntry ? neonEntry.codeHash : memEntry!.codeHash;
  const salt = neonEntry ? neonEntry.salt : memEntry!.salt;

  // 1. Expiration check
  if (expiresAt < now) {
    if (isNeonConfigured()) await deletePasswordResetInNeon(normalizedEmail);
    passwordResetStore.delete(normalizedEmail);
    res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    return;
  }

  // 2. Verification attempt limits (max 5)
  if (attempts >= 5) {
    if (isNeonConfigured()) await deletePasswordResetInNeon(normalizedEmail);
    passwordResetStore.delete(normalizedEmail);
    res.status(429).json({ error: 'Too many incorrect attempts. Please request a new verification code.' });
    return;
  }

  // 3. Cryptographic hash comparison
  const isMatch = verifyPassword(cleanCode, codeHash, salt);

  if (!isMatch) {
    let newAttempts = attempts + 1;
    if (isNeonConfigured()) {
      newAttempts = await incrementResetAttemptsInNeon(normalizedEmail);
    }
    if (memEntry) {
      memEntry.attempts = newAttempts;
    }

    const remaining = Math.max(0, 5 - newAttempts);
    res.status(400).json({
      error: remaining > 0
        ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Please request a new verification code.',
    });
    return;
  }

  // 4. Code verified: generate secure single-use reset token valid for 10 minutes
  const resetToken = `rst_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (isNeonConfigured()) {
    await setResetTokenInNeon(normalizedEmail, resetToken, tokenExpiresAt);
  }

  if (memEntry) {
    memEntry.verified = true;
    memEntry.resetToken = resetToken;
    memEntry.expiresAt = tokenExpiresAt.getTime();
  } else {
    passwordResetStore.set(normalizedEmail, {
      codeHash,
      salt,
      expiresAt: tokenExpiresAt.getTime(),
      attempts: 0,
      verified: true,
      resetToken,
    });
  }

  res.json({
    success: true,
    resetToken,
    message: 'Code verified successfully. Please enter your new password.',
  });
});

// Forgot Password - Step 3: Set New Password
router.post('/forgot-password/reset-password', async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    res.status(400).json({ error: 'Email, reset token, and new password are required.' });
    return;
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters in length.' });
    return;
  }

  const normalizedEmail = (typeof email === 'string' ? email : '').trim().toLowerCase();

  // Validate reset token in Neon PostgreSQL or in-memory cache
  let neonEntry = isNeonConfigured() ? await getPasswordResetFromNeon(normalizedEmail) : null;
  let memEntry = passwordResetStore.get(normalizedEmail);

  const isValidNeon = Boolean(
    neonEntry && neonEntry.verified && neonEntry.resetToken === resetToken && neonEntry.expiresAt >= Date.now()
  );
  const isValidMem = Boolean(
    memEntry && memEntry.verified && memEntry.resetToken === resetToken && memEntry.expiresAt >= Date.now()
  );

  if (!isValidNeon && !isValidMem) {
    res.status(400).json({ error: 'Password reset session has expired or is invalid. Please request a new code.' });
    return;
  }

  const db = getDb();
  let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user && isNeonConfigured()) {
    try {
      user = await getUserByEmailInNeon(normalizedEmail);
      if (user && !db.users.some((u) => u.id === user.id)) {
        db.users.push(user);
      }
    } catch {}
  }

  if (!user) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  // Hash new password using the project's standard PBKDF2 hashPassword
  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  user.updatedAt = new Date().toISOString();

  // Update in Neon PostgreSQL
  if (isNeonConfigured()) {
    try {
      await updateUserPasswordInNeon(normalizedEmail, hash, salt);
    } catch (err: any) {
      console.error('[Neon Password Reset] Error updating password in Neon:', err.message);
    }
    // Single-use: delete reset session immediately
    await deletePasswordResetInNeon(normalizedEmail);
  }

  // Clear in-memory reset session
  passwordResetStore.delete(normalizedEmail);

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: normalizedEmail,
    action: 'PASSWORD_RESET_SUCCESS',
    entityType: 'Security',
    details: `Password successfully updated via OTP verification for ${normalizedEmail}`,
    timestamp: new Date().toISOString(),
  });
  await saveDatabaseAsync();

  res.json({
    success: true,
    message: 'Password updated successfully. You can now sign in with your new password.',
  });
});

// Change Password (for logged-in users)
router.put('/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    return;
  }

  const db = getDb();
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  if (!verifyPassword(currentPassword, user.passwordHash, user.salt)) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  user.updatedAt = new Date().toISOString();

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: user.email,
    action: 'PASSWORD_CHANGED',
    entityType: 'Security',
    details: `Customer changed their password from Account Settings`,
    timestamp: new Date().toISOString(),
  });
  saveDatabase();

  res.json({ success: true, message: 'Password changed successfully.' });
});

// Legacy / demo fallback for forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  res.json({
    message: 'If an account exists for this email, password reset instructions have been dispatched.',
  });
});

export default router;
