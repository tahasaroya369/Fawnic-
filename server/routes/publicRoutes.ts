import express from 'express';
import { getDb, saveDatabase } from '../db.js';
import type { ContactMessage } from '../../src/types.js';
import { handleContactQuerySubmission } from './queryRoutes.js';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    store: 'FAWNIC Luxury Leather Goods',
    market: 'Pakistan (PKR)',
    timestamp: new Date().toISOString(),
  });
});

// Categories (Public endpoint)
router.get('/categories', (req, res) => {
  const db = getDb();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.json(db.categories);
});

// Homepage CMS Configuration
router.get('/cms', (req, res) => {
  const db = getDb();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.json(db.homepageCms);
});

// Active Promotions
router.get('/promotions', (req, res) => {
  const db = getDb();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  const active = (db.promotions || []).filter((p: any) => p.isActive);
  res.json(active);
});

// Store Settings
router.get('/settings', (req, res) => {
  const db = getDb();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.json(db.settings);
});

// FAQs
router.get('/faqs', (req, res) => {
  const db = getDb();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.json(db.faqs.sort((a, b) => a.order - b.order));
});

// Policies
router.get('/policies', (req, res) => {
  const db = getDb();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.json(db.policies);
});

// Single Policy by Slug
router.get('/policies/:slug', (req, res) => {
  const db = getDb();
  const policy = db.policies.find((p) => p.slug === req.params.slug);
  if (!policy) {
    res.status(404).json({ error: 'Policy document not found' });
    return;
  }
  res.json(policy);
});

// Submit Contact Message / Customer Query
router.post('/contact', handleContactQuerySubmission);

// Subscribe to Newsletter
router.post('/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email address is required' });
    return;
  }

  const db = getDb();
  const normalized = email.trim().toLowerCase();
  if (!db.newsletterSubscribers.includes(normalized)) {
    db.newsletterSubscribers.push(normalized);
    saveDatabase();
  }

  res.json({ message: 'Thank you for subscribing to Fawnic Private Editions & Leather Care guides.' });
});

// Validate Coupon
router.post('/validate-coupon', validateCouponHandler);
router.post('/coupons/validate', validateCouponHandler);

function validateCouponHandler(req: express.Request, res: express.Response) {
  const { code, subtotal, cartSubtotal } = req.body;
  const targetSubtotal = subtotal !== undefined ? subtotal : cartSubtotal;
  if (!code) {
    res.status(400).json({ error: 'Coupon code is required' });
    return;
  }

  const db = getDb();
  const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);

  if (!coupon) {
    res.status(404).json({ error: 'Invalid or expired promotional code', valid: false });
    return;
  }

  const orderSubtotal = Number(targetSubtotal) || 0;
  if (orderSubtotal < coupon.minOrderAmount) {
    res.status(400).json({
      error: `This coupon requires a minimum order of Rs. ${coupon.minOrderAmount.toLocaleString()}`,
      valid: false,
    });
    return;
  }

  let discountAmount = 0;
  if (coupon.type === 'percent') {
    discountAmount = (orderSubtotal * coupon.value) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = coupon.value;
  }

  res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discountAmount,
    message: `Coupon "${coupon.code}" applied successfully!`,
  });
}

export default router;
