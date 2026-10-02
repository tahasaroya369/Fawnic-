import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { authMiddleware } from './server/middleware.js';
import authRoutes from './server/routes/authRoutes.js';
import productRoutes from './server/routes/productRoutes.js';
import orderRoutes from './server/routes/orderRoutes.js';
import customerRoutes from './server/routes/customerRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import publicRoutes from './server/routes/publicRoutes.js';
import queryRoutes, { customerQueryRouter, adminQueryRouter } from './server/routes/queryRoutes.js';
import { initWebSocketServer } from './server/websocket.js';
import { startNotificationScheduler } from './server/notificationScheduler.js';
import { getDb } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const notifUploadsDir = path.join(uploadsDir, 'notifications');
  if (!fs.existsSync(notifUploadsDir)) {
    fs.mkdirSync(notifUploadsDir, { recursive: true });
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

  // Global auth session extraction
  app.use(authMiddleware);

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      store: 'FAWNIC Luxury Leather Goods',
      market: 'Pakistan (PKR)',
    });
  });

  // Public Categories endpoint
  app.get('/api/categories', (req, res) => {
    res.json(getDb().categories);
  });

  // API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/customer/queries', customerQueryRouter);
  app.use('/api/customer', customerRoutes);
  app.use('/api/admin/queries', adminQueryRouter);
  app.use('/api/admin', adminRoutes);
  app.use('/api/queries', queryRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api', publicRoutes);

  // Catch-all for API endpoints to prevent Vite SPA HTML fallback on 404s
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);

  // Initialize Real-time WebSocket Server on port 3000
  initWebSocketServer(server);

  // Start automated background scheduler for scheduled and expired notifications
  startNotificationScheduler();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FAWNIC LUXURY LEATHER ATELIER] Server running with WebSockets on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
