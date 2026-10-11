import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app.js';
import { initWebSocketServer } from './server/websocket.js';
import { startNotificationScheduler } from './server/notificationScheduler.js';
import { initializeNeonSchema } from './server/storage/neon.js';
import { syncDatabaseFromRemote } from './server/db.js';

async function startServer() {
  const PORT = 3000;

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
    startNotificationScheduler();
  })();
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
