import express from 'express';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from './middleware.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import queryRoutes, { customerQueryRouter, adminQueryRouter } from './routes/queryRoutes.js';
import { getDb } from './db.js';

export function createExpressApp(): express.Express {
  const app = express();

  // CORS headers for production and local environments
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch {}
  }
  const notifUploadsDir = path.join(uploadsDir, 'notifications');
  if (!fs.existsSync(notifUploadsDir)) {
    try {
      fs.mkdirSync(notifUploadsDir, { recursive: true });
    } catch {}
  }

  app.use(
    '/uploads',
    express.static(uploadsDir, {
      maxAge: '7d',
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
      },
    })
  );

  const publicDir = path.join(process.cwd(), 'public');
  app.use(
    express.static(publicDir, {
      maxAge: '30d',
      setHeaders: (res, filePath) => {
        if (/\.(jpg|jpeg|png|webp|svg|gif|avif|ico|mp4|woff2)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
        }
      },
    })
  );

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Normalize incoming URLs from Vercel serverless / rewrites
  app.use((req, res, next) => {
    if (req.query) {
      const subpath = req.query.__path
        ? String(req.query.__path)
        : req.query.path
        ? (Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path))
        : (req.query['0'] ? String(req.query['0']) : '');
      if (subpath && (!req.url || req.url === '/' || req.url === '/api' || req.url.startsWith('/api?'))) {
        const cleanSub = subpath.replace(/^\/+/, '');
        req.url = `/api/${cleanSub}`;
      }
    }
    next();
  });

  // Global auth session extraction
  app.use(authMiddleware);

  // API Health Check (handles /api/health, /health, /api, /)
  app.get(['/api/health', '/health', '/api'], (req, res) => {
    res.json({
      success: true,
      status: 'ok',
      store: 'FAWNIC Luxury Leather Goods',
      market: 'Pakistan (PKR)',
    });
  });

  // Public Categories endpoint
  app.get(['/api/categories', '/categories'], (req, res) => {
    try {
      res.json(getDb().categories || []);
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to load categories', message: err.message });
    }
  });

  // API Endpoints - mounted with and without '/api' prefix for bulletproof Vercel routing
  app.use('/api/auth', authRoutes);
  app.use('/auth', authRoutes);

  app.use('/api/products', productRoutes);
  app.use('/products', productRoutes);

  app.use('/api/orders', orderRoutes);
  app.use('/orders', orderRoutes);

  app.use('/api/customer/queries', customerQueryRouter);
  app.use('/customer/queries', customerQueryRouter);

  app.use('/api/customer', customerRoutes);
  app.use('/customer', customerRoutes);

  app.use('/api/admin/queries', adminQueryRouter);
  app.use('/admin/queries', adminQueryRouter);

  app.use('/api/admin', adminRoutes);
  app.use('/admin', adminRoutes);

  app.use('/api/queries', queryRoutes);
  app.use('/queries', queryRoutes);

  app.use('/api/public', publicRoutes);
  app.use('/public', publicRoutes);
  app.use('/api', publicRoutes);

  // Universal Catch-all for API endpoints to prevent HTML fallback on 404s (guarantees pure JSON response for API routes)
  // Non-API routes (like GET /, /shop, /assets, /index.html) pass through to Vite middleware or static frontend handler
  app.use((req, res, next) => {
    const url = req.originalUrl || req.url || '';
    const isApiRequest =
      url.startsWith('/api') ||
      req.path.startsWith('/api') ||
      url.startsWith('/auth') ||
      url.startsWith('/products') ||
      url.startsWith('/orders') ||
      url.startsWith('/customer/queries') ||
      url.startsWith('/admin/queries') ||
      url.startsWith('/queries');

    if (isApiRequest) {
      return res.status(404).json({
        success: false,
        error: `API route ${req.method} ${url} not found`,
        message: `API route ${req.method} ${url} not found`,
      });
    }
    next();
  });

  // Centralized Error Handling Middleware (always returns JSON for errors)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Server Error]', err);
    if (res.headersSent) {
      return next(err);
    }
    const statusCode = err.status && typeof err.status === 'number' ? err.status : 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error occurred',
      message: err.message || 'Internal server error occurred',
    });
  });

  return app;
}

export const app = createExpressApp();
