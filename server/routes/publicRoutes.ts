import express from 'express';
import { getDb, saveDatabase } from '../db.js';
import { isNeonConfigured, getCouponsFromNeon, getCategoriesFromNeon } from '../storage/neon.js';
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
router.get('/categories', async (req, res) => {
  if (isNeonConfigured()) {
    try {
      const neonCats = await getCategoriesFromNeon();
      if (Array.isArray(neonCats)) {
        getDb().categories = neonCats;
      }
    } catch {}
  }
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

async function validateCouponHandler(req: express.Request, res: express.Response) {
  const { code, subtotal, cartSubtotal } = req.body;
  const targetSubtotal = subtotal !== undefined ? subtotal : cartSubtotal;
  if (!code || typeof code !== 'string' || !code.trim()) {
    res.status(400).json({ error: 'Please enter a valid coupon code', valid: false });
    return;
  }

  const cleanCode = code.trim().toUpperCase();

  // Always fetch live coupons from Neon if configured to avoid stale status
  if (isNeonConfigured()) {
    try {
      const neonCoupons = await getCouponsFromNeon();
      if (Array.isArray(neonCoupons)) {
        getDb().coupons = neonCoupons;
      }
    } catch (err: any) {
      console.warn('[Neon PostgreSQL] Error getting live coupons:', err.message);
    }
  }

  const db = getDb();
  const coupon = (db.coupons || []).find((c) => c.code.toUpperCase() === cleanCode);

  if (!coupon) {
    res.status(404).json({ error: `Coupon code "${cleanCode}" is invalid or does not exist.`, valid: false });
    return;
  }

  // 1. Check Active Status
  if (!coupon.isActive) {
    res.status(400).json({
      error: `Coupon "${coupon.code}" is currently inactive or has been disabled.`,
      valid: false,
    });
    return;
  }

  // 2. Check Expiry Date
  const expiryStr = coupon.expiresAt || coupon.expiryDate;
  if (expiryStr) {
    const expiryDate = new Date(expiryStr);
    if (!isNaN(expiryDate.getTime()) && expiryDate.getTime() < Date.now()) {
      res.status(400).json({
        error: `Coupon "${coupon.code}" expired on ${expiryDate.toLocaleDateString('en-PK')}.`,
        valid: false,
      });
      return;
    }
  }

  // 3. Check Usage Limits
  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
    res.status(400).json({
      error: `Coupon "${coupon.code}" has reached its maximum usage limit (${coupon.usageLimit} uses).`,
      valid: false,
    });
    return;
  }

  // 4. Check Minimum Order Amount
  const orderSubtotal = Number(targetSubtotal) || 0;
  const minRequired = Number(coupon.minOrderAmount) || 0;
  if (orderSubtotal < minRequired) {
    res.status(400).json({
      error: `This coupon requires a minimum subtotal of Rs. ${minRequired.toLocaleString()}. (Current: Rs. ${orderSubtotal.toLocaleString()})`,
      valid: false,
      minOrderAmount: minRequired,
    });
    return;
  }

  // 5. Calculate Discount Correctly
  const isPercentage = coupon.type === 'percent' || coupon.type === 'percentage';
  let discountAmount = 0;
  if (isPercentage) {
    discountAmount = Math.round((orderSubtotal * Number(coupon.value)) / 100);
    if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
      discountAmount = Number(coupon.maxDiscount);
    }
  } else {
    discountAmount = Math.round(Number(coupon.value));
  }

  // Discount cannot exceed subtotal
  discountAmount = Math.max(0, Math.min(discountAmount, orderSubtotal));
  const finalPayable = Math.max(0, orderSubtotal - discountAmount);

  res.json({
    valid: true,
    code: coupon.code,
    type: isPercentage ? 'percent' : 'fixed',
    value: coupon.value,
    discountAmount,
    subtotal: orderSubtotal,
    finalAmount: finalPayable,
    minOrderAmount: minRequired,
    maxDiscount: coupon.maxDiscount,
    message: isPercentage
      ? `Coupon "${coupon.code}" applied: ${coupon.value}% off (Rs. ${discountAmount.toLocaleString()} saved)!`
      : `Coupon "${coupon.code}" applied: Rs. ${discountAmount.toLocaleString()} flat discount!`,
  });
}

export default router;
