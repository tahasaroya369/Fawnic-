import express from 'express';
import { getDb, saveDatabase } from '../db.js';
import { hashPassword, verifyPassword, createSessionToken, removeSession } from '../auth.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware.js';
import type { User } from '../../src/types.js';

const router = express.Router();

// Customer Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
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

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    // Add audit log of failed attempt
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
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();

  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    name: name.trim(),
    phone: phone?.trim() || '+92 ',
    role: 'customer' as const,
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    salt,
  };

  db.users.push(newUser);
  saveDatabase();

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

// In-memory store for password reset codes (15-minute expiry)
interface PasswordResetEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  verified?: boolean;
  resetToken?: string;
}
const passwordResetStore = new Map<string, PasswordResetEntry>();

// Forgot Password - Step 1: Send Verification Code
router.post('/forgot-password/send-code', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }

  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    res.status(404).json({ error: 'No account registered with this email address.' });
    return;
  }

  if (user.isSuspended) {
    res.status(403).json({ error: 'This account has been suspended. Please contact customer care.' });
    return;
  }

  // Generate secure 6-digit numeric verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  passwordResetStore.set(normalizedEmail, {
    code,
    expiresAt,
    attempts: 0,
  });

  // Log to secure server console (simulates email dispatch in development)
  console.log(`[FAWNIC Auth Security] Verification code for ${normalizedEmail}: ${code} (expires in 15m)`);

  // Record audit log
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: normalizedEmail,
    action: 'PASSWORD_RESET_CODE_SENT',
    entityType: 'Security',
    details: `Verification code generated for password recovery on ${normalizedEmail}`,
    timestamp: new Date().toISOString(),
  });
  saveDatabase();

  // IMPORTANT: Never expose code in response
  res.json({
    success: true,
    message: 'Verification code has been sent to your registered email address.',
  });
});

// Forgot Password - Step 2: Verify Code
router.post('/forgot-password/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: 'Email and verification code are required.' });
    return;
  }

  const normalizedEmail = (typeof email === 'string' ? email : '').trim().toLowerCase();
  const cleanCode = (typeof code === 'string' ? code : '').trim();

  const entry = passwordResetStore.get(normalizedEmail);
  if (!entry) {
    res.status(400).json({ error: 'No verification code requested for this email, or it has expired.' });
    return;
  }

  if (entry.expiresAt < Date.now()) {
    passwordResetStore.delete(normalizedEmail);
    res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    return;
  }

  if (entry.attempts >= 5) {
    passwordResetStore.delete(normalizedEmail);
    res.status(429).json({ error: 'Too many incorrect attempts. Please request a new verification code.' });
    return;
  }

  if (entry.code !== cleanCode) {
    entry.attempts += 1;
    res.status(400).json({ error: 'Incorrect verification code. Please check your email and try again.' });
    return;
  }

  // Code is verified, generate one-time reset token valid for 10 minutes
  const resetToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  entry.verified = true;
  entry.resetToken = resetToken;
  entry.expiresAt = Date.now() + 10 * 60 * 1000;

  res.json({
    success: true,
    resetToken,
    message: 'Code verified successfully. Please enter your new password.',
  });
});

// Forgot Password - Step 3: Set New Password
router.post('/forgot-password/reset-password', (req, res) => {
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
  const entry = passwordResetStore.get(normalizedEmail);

  if (!entry || !entry.verified || entry.resetToken !== resetToken || entry.expiresAt < Date.now()) {
    res.status(400).json({ error: 'Password reset session has expired or is invalid. Please request a new code.' });
    return;
  }

  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  user.updatedAt = new Date().toISOString();

  // Clear reset session
  passwordResetStore.delete(normalizedEmail);

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: normalizedEmail,
    action: 'PASSWORD_RESET_SUCCESS',
    entityType: 'Security',
    details: `Password successfully updated via email verification for ${normalizedEmail}`,
    timestamp: new Date().toISOString(),
  });
  saveDatabase();

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
