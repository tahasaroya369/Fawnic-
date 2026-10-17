import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app.js';
import { initWebSocketServer } from './server/websocket.js';
import { startNotificationScheduler } from './server/notificationScheduler.js';
import { initializeNeonSchema } from './server/storage/neon.js';
import { syncDatabaseFromRemote } from './server/db.js';

// Global process resilience handlers to prevent unexpected process exit
process.on('unhandledRejection', (reason) => {
  console.warn('[Process] Unhandled Rejection caught:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception caught:', err);
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  const server = http.createServer(app);

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is already in use. Please terminate existing process.`);
    } else {
      console.error('[Server] Server error:', err);
    }
  });

  // Handle termination signals gracefully
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });

  // Initialize Real-time Application WebSocket Server on port 3000
  initWebSocketServer(server);

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FAWNIC LUXURY LEATHER ATELIER] Server running with WebSockets on http://0.0.0.0:${PORT}`);
  });

  // Asynchronously initialize Neon PostgreSQL Schema & sync in background so server starts immediately
  (async () => {
    try {
      const ok = await initializeNeonSchema();
      if (ok) {
        await syncDatabaseFromRemote();
      }
    } catch (err: any) {
      console.warn('[DB Init] Background database init note:', err.message);
    }

    // Start automated background scheduler for scheduled and expired notifications
    try {
      startNotificationScheduler();
    } catch (err: any) {
      console.warn('[Scheduler] Background notification scheduler note:', err.message);
    }
  })();
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
