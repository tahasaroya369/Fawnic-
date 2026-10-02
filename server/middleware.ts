import type { Request, Response, NextFunction } from 'express';
import { getSession, removeSession } from './auth.js';
import { getDb } from './db.js';
import type { StaffPermissions } from '../src/types.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'customer' | 'admin' | 'staff';
    name: string;
    staffRole?: string;
    permissions?: StaffPermissions;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const session = getSession(token);
  if (!session) {
    return next();
  }

  const db = getDb();

  // Admin and customer accounts
  if (session.role === 'admin' || session.role === 'customer') {
    const user = db.users.find((u) => u.id === session.userId);
    if (user && !user.isSuspended) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };
    } else {
      removeSession(token);
    }
    return next();
  }

  // Staff accounts: check live status in db.teamMembers
  if (session.role === 'staff') {
    const member = (db.teamMembers || []).find((m) => m.id === session.userId);
    // If deleted or not active (disabled / suspended), invalidate session immediately!
    if (!member || member.status !== 'active') {
      removeSession(token);
      return next();
    }

    req.user = {
      id: member.id,
      email: member.email,
      role: 'staff',
      name: member.name,
      staffRole: member.role,
      permissions: member.permissions || { pages: ['dashboard'] },
    };
    return next();
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  next();
}

export function requireRole(...allowedRoles: Array<'customer' | 'admin' | 'staff'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges for this action.' });
      return;
    }
    next();
  };
}

export function requireAdminOrStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Administrative authentication required.' });
    return;
  }
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    res.status(403).json({ error: 'Forbidden: Restricted atelier operations console.' });
    return;
  }
  next();
}

export function checkPermission(
  page?: string,
  actionResource?: 'products' | 'orders' | 'invoices' | 'staff',
  actionName?: string
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // Admins always have full unrestricted permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Staff permissions check
    if (req.user.role === 'staff') {
      const perms = req.user.permissions;
      if (!perms) {
        res.status(403).json({ error: 'Access Denied: No staff permissions assigned.' });
        return;
      }

      // Check page access if specified
      if (page) {
        const allowedPages = perms.pages || [];
        if (!allowedPages.includes(page) && !allowedPages.includes('*')) {
          res.status(403).json({
            error: `Access Denied: You do not have permission to access ${page}. Contact administrator.`,
          });
          return;
        }
      }

      // Check granular action if specified
      if (actionResource && actionName) {
        const resourceActions = perms.actions?.[actionResource] as Record<string, boolean> | undefined;
        if (resourceActions && resourceActions[actionName] === false) {
          res.status(403).json({
            error: `Access Denied: You do not have permission to ${actionName} on ${actionResource}.`,
          });
          return;
        }
      }

      return next();
    }

    res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
  };
}
