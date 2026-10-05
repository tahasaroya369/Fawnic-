import express from 'express';
import { getDb, getDbVersion, getSyncEvents, recordSyncEvent } from '../db.js';

export const syncRouter = express.Router();

// Get real-time synchronization events since a given timestamp
syncRouter.get('/events', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const since = Number(req.query.since) || 0;
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const events = getSyncEvents(since, limit);

  res.json({
    success: true,
    timestamp: Date.now(),
    version: getDbVersion(),
    count: events.length,
    events,
  });
});

// Quick state fingerprint for lightweight polling
syncRouter.get('/state', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const db = getDb();
  res.json({
    success: true,
    timestamp: Date.now(),
    version: getDbVersion(),
    productCount: db.products ? db.products.length : 0,
    categoryCount: db.categories ? db.categories.length : 0,
    orderCount: db.orders ? db.orders.length : 0,
    notificationCount: db.notifications ? db.notifications.length : 0,
  });
});

// Optional client event broadcast proxy
syncRouter.post('/broadcast', (req, res) => {
  const { type, action, ...data } = req.body || {};
  if (!type) {
    return res.status(400).json({ error: 'Event type is required' });
  }

  const evt = recordSyncEvent({ type, action, ...data });
  res.json({ success: true, event: evt });
});
