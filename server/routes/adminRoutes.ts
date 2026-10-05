import express from 'express';
import fs from 'fs';
import path from 'path';
import { getDb, saveDatabase, getNextInvoiceNumber } from '../db.js';
import { uploadMedia, deleteMedia } from '../storage/imagekit.js';
import { recordMediaUploadInNeon } from '../storage/neon.js';
import { requireAuth, requireAdminOrStaff, type AuthenticatedRequest } from '../middleware.js';
import { hashPassword, removeUserSessions } from '../auth.js';
import { createOrderNotification } from '../orderNotificationHelper.js';
import {
  broadcastNotificationEvent,
  broadcastAdminNotificationStats,
  broadcastOrderUpdate,
  broadcastProductEvent,
  broadcastCategoryEvent,
  broadcastSettingsEvent,
} from '../websocket.js';
import type {
  Product,
  Category,
  Coupon,
  FAQ,
  Policy,
  AuditLog,
  InventoryTransaction,
  InvoiceRecord,
  TeamMember,
  OrderStatus,
  OrderTimelineItem,
  MarketingPromotion,
  NotificationRecord,
  NotificationType,
  NotificationAudience,
  NotificationStatus,
} from '../../src/types.js';

const router = express.Router();

// Enforce authenticated admin or staff privileges on all routes in this router
router.use(requireAuth);
router.use(requireAdminOrStaff);

// Helper to log audit events
function logAdminAction(adminEmail: string, action: string, entityType: string, entityId?: string, details?: string) {
  const db = getDb();
  if (!db.auditLogs) db.auditLogs = [];
  const log: AuditLog = {
    id: `log_${Date.now()}`,
    adminEmail,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) db.auditLogs.pop();
}

// 1. Dashboard Statistics (100% Real Database Calculations)
router.get('/stats', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const orders = db.orders;
  const products = db.products;
  const customers = db.users.filter((u) => u.role === 'customer');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Valid orders that count towards sales (not cancelled)
  const validOrders = orders.filter((o) => o.status !== 'cancelled');

  const totalSales = validOrders.reduce((sum, o) => sum + o.total, 0);

  const todaySales = validOrders
    .filter((o) => new Date(o.createdAt).getTime() >= startOfToday)
    .reduce((sum, o) => sum + o.total, 0);

  const monthSales = validOrders
    .filter((o) => new Date(o.createdAt).getTime() >= startOfMonth)
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const processingOrders = orders.filter((o) => o.status === 'processing' || o.status === 'confirmed').length;
  const shippedOrders = orders.filter((o) => o.status === 'shipped' || o.status === 'out_for_delivery').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;

  // Real Sales Trend (Last 7 Days)
  const salesByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    salesByDay[dateStr] = 0;
  }

  validOrders.forEach((o) => {
    const dateStr = o.createdAt.split('T')[0];
    if (salesByDay[dateStr] !== undefined) {
      salesByDay[dateStr] += o.total;
    }
  });

  const chartData = Object.entries(salesByDay).map(([date, amount]) => ({
    date,
    amount,
  }));

  res.json({
    totalSales,
    todaySales,
    monthSales,
    totalOrders: orders.length,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalCustomers: customers.length,
    totalProducts: products.length,
    lowStockProducts,
    outOfStockProducts,
    totalReviews: db.reviews.length,
    recentOrders: orders.slice(0, 5),
    chartData,
  });
});

// 2. Product Management
router.get('/products', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.products);
});

router.post('/products', (req: AuthenticatedRequest, res) => {
  const {
    name,
    shortDescription,
    description,
    categoryId,
    brand,
    leatherType,
    sku,
    regularPrice,
    salePrice,
    costPrice,
    stock,
    lowStockThreshold,
    mainImage,
    images,
    tags,
    variants,
    hasVariations,
    variations,
    colorVariations,
    sizeVariations,
    features,
    specifications,
    careInstructions,
    isFeatured,
    isBestSeller,
    isNewArrival,
    status,
  } = req.body;

  if (!name || !regularPrice || !mainImage) {
    res.status(400).json({ error: 'Product name, price, and main image are required' });
    return;
  }

  const db = getDb();
  const category = db.categories.find((c) => c.id === categoryId);

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const newProduct: Product = {
    id: `fwn_prd_${Date.now()}`,
    name: name.trim(),
    slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
    shortDescription: shortDescription?.trim() || description?.slice(0, 120) || '',
    description: description?.trim() || '',
    categoryId: categoryId || 'cat_wallets',
    categoryName: category?.name || "Men's Leather Wallets",
    brand: brand?.trim() || 'FAWNIC',
    leatherType: leatherType?.trim() || 'Full-Grain Cowhide',
    sku: sku?.trim() || `FWN-${Math.floor(1000 + Math.random() * 9000)}`,
    regularPrice: Number(regularPrice),
    salePrice: salePrice ? Number(salePrice) : Number(regularPrice),
    costPrice: costPrice ? Number(costPrice) : undefined,
    stock: Number(stock) || 0,
    lowStockThreshold: Number(lowStockThreshold) || 5,
    stockStatus: Number(stock) > 0 ? 'in_stock' : 'out_of_stock',
    mainImage,
    images: images && images.length ? images : [mainImage],
    tags: tags || ['leather', 'luxury'],
    variants: variants || [],
    hasVariations: Boolean(hasVariations),
    variations: Array.isArray(variations) ? variations : [],
    colorVariations: Array.isArray(colorVariations) ? colorVariations : undefined,
    sizeVariations: Array.isArray(sizeVariations) ? sizeVariations : undefined,
    features: features || [],
    specifications: specifications || {},
    careInstructions,
    rating: 5.0,
    reviewCount: 0,
    isFeatured: Boolean(isFeatured),
    isBestSeller: Boolean(isBestSeller),
    isNewArrival: Boolean(isNewArrival),
    status: status || 'published',
    createdAt: new Date().toISOString(),
  };

  db.products.unshift(newProduct);
  logAdminAction(req.user!.email, 'PRODUCT_CREATED', 'Product', newProduct.id, `Created "${newProduct.name}"`);
  saveDatabase();
  broadcastProductEvent({ action: 'created', product: newProduct });

  res.status(201).json(newProduct);
});

router.put('/products/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const oldMainImage = product.mainImage;
  const oldImages = Array.isArray(product.images) ? [...product.images] : [];

  Object.assign(product, req.body, { updatedAt: new Date().toISOString() });
  if (req.body.hasVariations !== undefined) {
    product.hasVariations = Boolean(req.body.hasVariations);
  }
  if (req.body.variations !== undefined) {
    product.variations = Array.isArray(req.body.variations) ? req.body.variations : [];
  }
  if (req.body.colorVariations !== undefined) {
    product.colorVariations = Array.isArray(req.body.colorVariations) ? req.body.colorVariations : [];
  }
  if (req.body.sizeVariations !== undefined) {
    product.sizeVariations = Array.isArray(req.body.sizeVariations) ? req.body.sizeVariations : [];
  }

  // Update stock status based on stock value
  if (product.stock <= 0) {
    product.stockStatus = 'out_of_stock';
  } else if (product.stock <= product.lowStockThreshold) {
    product.stockStatus = 'low_stock';
  } else {
    product.stockStatus = 'in_stock';
  }

  // ImageKit Media Replacement: Clean up replaced old images asynchronously
  if (req.body.mainImage && req.body.mainImage !== oldMainImage && oldMainImage) {
    if (!oldMainImage.startsWith('/assets/')) {
      deleteMedia(oldMainImage).catch(() => {});
    }
  }
  if (Array.isArray(req.body.images)) {
    const newImages = req.body.images;
    const removedImages = oldImages.filter(
      (img) => !newImages.includes(img) && img !== req.body.mainImage && !img.startsWith('/assets/')
    );
    for (const img of removedImages) {
      deleteMedia(img).catch(() => {});
    }
  }

  logAdminAction(req.user!.email, 'PRODUCT_UPDATED', 'Product', product.id, `Updated "${product.name}"`);
  saveDatabase();
  broadcastProductEvent({ action: 'updated', product });

  res.json(product);
});

router.delete('/products/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const removed = db.products.splice(idx, 1)[0];

  // Clean up media from ImageKit asynchronously without blocking deletion
  if (removed.mainImage && !removed.mainImage.startsWith('/assets/')) {
    deleteMedia(removed.mainImage).catch(() => {});
  }
  if (Array.isArray(removed.images)) {
    for (const img of removed.images) {
      if (img && img !== removed.mainImage && !img.startsWith('/assets/')) {
        deleteMedia(img).catch(() => {});
      }
    }
  }

  logAdminAction(req.user!.email, 'PRODUCT_DELETED', 'Product', req.params.id, `Deleted "${removed.name}"`);
  saveDatabase();
  broadcastProductEvent({
    action: 'deleted',
    productId: req.params.id,
    product: { id: req.params.id, slug: removed.slug, name: removed.name },
  });

  res.json({ message: 'Product removed successfully' });
});

router.post('/products/:id/duplicate', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const source = db.products.find((p) => p.id === req.params.id);
  if (!source) {
    res.status(404).json({ error: 'Product not found to duplicate' });
    return;
  }

  const newSku = `FWN-${Math.floor(1000 + Math.random() * 9000)}`;
  const newProduct: Product = {
    ...source,
    id: `fwn_prd_${Date.now()}`,
    name: `${source.name} (Copy)`,
    sku: newSku,
    slug: `${source.slug}-copy-${Math.floor(100 + Math.random() * 900)}`,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };

  db.products.unshift(newProduct);
  logAdminAction(req.user!.email, 'PRODUCT_DUPLICATED', 'Product', newProduct.id, `Duplicated "${source.name}" as "${newProduct.name}"`);
  saveDatabase();
  broadcastProductEvent({ action: 'created', product: newProduct });

  res.status(201).json(newProduct);
});

router.post('/products/bulk-action', (req: AuthenticatedRequest, res) => {
  const { action, ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'Array of product IDs required' });
    return;
  }

  const db = getDb();
  let modifiedCount = 0;

  if (action === 'delete') {
    db.products = db.products.filter((p) => {
      if (ids.includes(p.id)) {
        modifiedCount++;
        return false;
      }
      return true;
    });
    logAdminAction(req.user!.email, 'BULK_PRODUCT_DELETE', 'Product', undefined, `Deleted ${modifiedCount} products`);
  } else if (action === 'publish' || action === 'draft' || action === 'hidden') {
    db.products.forEach((p) => {
      if (ids.includes(p.id)) {
        p.status = action === 'publish' ? 'published' : action === 'hidden' ? ('hidden' as any) : 'draft';
        modifiedCount++;
      }
    });
    logAdminAction(req.user!.email, 'BULK_PRODUCT_STATUS', 'Product', undefined, `Changed status of ${modifiedCount} products to ${action}`);
  } else {
    res.status(400).json({ error: 'Invalid action' });
    return;
  }

  saveDatabase();
  broadcastProductEvent({ action: 'updated' });
  res.json({ success: true, count: modifiedCount });
});

// Categories Management
router.get('/categories', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const catsWithCounts = db.categories.map((cat) => {
    const count = db.products.filter((p) => p.categoryId === cat.id || p.categoryName === cat.name).length;
    return {
      ...cat,
      productCount: count,
    };
  });
  res.json(catsWithCounts);
});

router.post('/categories', (req: AuthenticatedRequest, res) => {
  const { name, slug: customSlug, description, banner, image, icon, subcategories, isActive, order } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }

  const db = getDb();
  const baseSlug = customSlug?.trim() || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const existingWithSlug = db.categories.find((c) => c.slug === baseSlug);
  const slug = existingWithSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const newCat: Category = {
    id: `cat_${Date.now()}`,
    name: name.trim(),
    slug,
    description: description?.trim() || '',
    icon: icon?.trim() || 'briefcase',
    banner: banner?.trim() || image?.trim() || 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=80',
    image: image?.trim() || banner?.trim() || 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
    featured: true,
    subcategories: Array.isArray(subcategories) ? subcategories : [],
    isActive: isActive !== false,
    order: typeof order === 'number' ? order : db.categories.length + 1,
  };

  db.categories.push(newCat);
  logAdminAction(req.user!.email, 'CATEGORY_CREATED', 'Category', newCat.id, `Created "${newCat.name}"`);
  saveDatabase();
  broadcastCategoryEvent({ action: 'created', category: newCat });

  res.status(201).json(newCat);
});

router.put('/categories/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const cat = db.categories.find((c) => c.id === req.params.id);
  if (!cat) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const oldName = cat.name;
  const { name, slug, description, banner, image, icon, subcategories, isActive, order } = req.body;
  if (name !== undefined) cat.name = name.trim();
  if (slug !== undefined) cat.slug = slug.trim();
  if (description !== undefined) cat.description = description.trim();
  if (banner !== undefined) cat.banner = banner.trim();
  if (image !== undefined) cat.image = image.trim();
  if (icon !== undefined) cat.icon = icon.trim();
  if (subcategories !== undefined) cat.subcategories = Array.isArray(subcategories) ? subcategories : [];
  if (isActive !== undefined) cat.isActive = Boolean(isActive);
  if (order !== undefined) cat.order = Number(order);

  // Synchronize categoryName across all products belonging to this category
  if (name !== undefined && cat.name !== oldName) {
    db.products.forEach((p) => {
      if (p.categoryId === cat.id) {
        p.categoryName = cat.name;
      }
    });
  }

  logAdminAction(req.user!.email, 'CATEGORY_UPDATED', 'Category', cat.id, `Updated "${cat.name}"`);
  saveDatabase();
  broadcastCategoryEvent({ action: 'updated', category: cat });

  res.json(cat);
});

router.delete('/categories/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.categories.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const cat = db.categories[idx];
  const assignedProducts = db.products.filter((p) => p.categoryId === cat.id);

  // Safely reassign any assigned products to target category or fallback so products never become orphaned
  const reassignToId = (req.body && req.body.reassignTo) || req.query.reassignTo;
  let targetCat = db.categories.find((c) => c.id === reassignToId && c.id !== cat.id);
  if (!targetCat) {
    targetCat = db.categories.find((c) => c.id !== cat.id);
  }

  if (assignedProducts.length > 0) {
    if (targetCat) {
      assignedProducts.forEach((p) => {
        p.categoryId = targetCat!.id;
        p.categoryName = targetCat!.name;
      });
    } else {
      assignedProducts.forEach((p) => {
        p.categoryId = 'uncategorized';
        p.categoryName = 'Uncategorized';
      });
    }
  }

  db.categories.splice(idx, 1);
  logAdminAction(
    req.user!.email,
    'CATEGORY_DELETED',
    'Category',
    cat.id,
    `Deleted "${cat.name}". ${assignedProducts.length} products safely remapped to "${targetCat ? targetCat.name : 'Uncategorized'}".`
  );
  saveDatabase();
  broadcastCategoryEvent({ action: 'deleted', categoryId: req.params.id });

  res.json({
    message: 'Category removed successfully',
    remappedCount: assignedProducts.length,
    remappedTo: targetCat ? targetCat.name : 'Uncategorized',
  });
});

// 3. Orders Management
router.get('/orders', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const { status, search } = req.query;
  let list = db.orders;

  if (status && status !== 'all') {
    list = list.filter((o) => o.status === status);
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }

  res.json(list);
});

router.get('/orders/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(order);
});

router.put('/orders/:id/status', (req: AuthenticatedRequest, res) => {
  handleOrderTrackingUpdate(req, res);
});

router.put('/orders/:id/tracking', (req: AuthenticatedRequest, res) => {
  handleOrderTrackingUpdate(req, res);
});

function handleOrderTrackingUpdate(req: AuthenticatedRequest, res: express.Response) {
  const {
    status,
    trackingNumber,
    courier,
    courierName,
    dispatchDate,
    deliveryDate,
    expectedDelivery,
    estimatedDelivery,
    paymentStatus,
    notes,
    note,
    internalNotes,
    location,
  } = req.body;

  const db = getDb();
  // Safe targeting: Affects ONLY the single selected order
  const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const previousStatus = order.status;
  const targetCourier = courierName !== undefined ? courierName : courier;
  const targetExpectedDelivery = estimatedDelivery !== undefined ? estimatedDelivery : expectedDelivery;
  const targetNote = notes !== undefined ? notes : note;

  if (status) order.status = status;
  if (trackingNumber !== undefined) order.trackingNumber = String(trackingNumber).trim();
  if (targetCourier !== undefined) {
    order.courier = targetCourier;
    order.courierName = targetCourier;
  }
  if (dispatchDate !== undefined) order.dispatchDate = dispatchDate;
  if (deliveryDate !== undefined) order.deliveryDate = deliveryDate;
  if (targetExpectedDelivery !== undefined) {
    order.expectedDelivery = targetExpectedDelivery;
    order.estimatedDelivery = targetExpectedDelivery;
  }
  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (targetNote !== undefined) order.notes = targetNote;
  if (internalNotes !== undefined) order.internalNotes = internalNotes;
  order.updatedAt = new Date().toISOString();

  // Maintain complete chronological tracking history without overwriting
  if (!order.timeline) {
    order.timeline = [
      {
        status: previousStatus || 'pending',
        timestamp: order.createdAt || new Date().toISOString(),
        updatedBy: 'System',
        note: 'Order placed by customer',
        location: order.shippingAddress?.city ? `${order.shippingAddress.city}, Pakistan` : 'Karachi, Pakistan',
      },
    ];
  }

  // Record tracking event
  const isStatusChanged = Boolean(status && status !== previousStatus);
  const eventNote =
    targetNote ||
    (isStatusChanged
      ? `Order status updated to "${status}"`
      : targetCourier || trackingNumber
      ? `Courier consignment logged: ${order.courier || 'Express'} (#${order.trackingNumber || 'N/A'})`
      : 'Consignment tracking details updated');

  order.timeline.push({
    status: order.status,
    timestamp: new Date().toISOString(),
    updatedBy: req.user?.name || req.user?.email || 'Admin',
    note: eventNote,
    location: location || (order.status === 'delivered' ? `${order.shippingAddress?.city || 'Customer Address'}, Pakistan` : 'FAWNIC Logistics Center, Karachi'),
  });

  order.trackingHistory = [...order.timeline];

  // If status changed to cancelled, restore inventory and record transaction
  if (status === 'cancelled' && previousStatus !== 'cancelled') {
    for (const it of order.items) {
      const prod = db.products.find((p) => p.id === it.productId);
      if (prod) {
        const prev = prod.stock;
        prod.stock += it.quantity;
        if (prod.stock > 0) prod.stockStatus = 'in_stock';

        db.inventoryTransactions.unshift({
          id: `txn_rest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          previousStock: prev,
          change: it.quantity,
          newStock: prod.stock,
          reason: 'Order Cancelled',
          referenceId: order.orderNumber,
          adminEmail: req.user!.email,
          timestamp: new Date().toISOString(),
          notes: `Restored from cancelled order #${order.orderNumber}`,
        });
      }
    }
  }

  // Trigger customer notification for order update
  createOrderNotification(order, order.status, {
    courierName: order.courierName || order.courier,
    trackingNumber: order.trackingNumber,
    notes: eventNote,
  });

  // Realtime WebSocket broadcast to customer and admins
  broadcastOrderUpdate(order);

  logAdminAction(
    req.user!.email,
    'ORDER_TRACKING_UPDATED',
    'Order',
    order.orderNumber,
    `Tracking updated. Status: "${order.status}", Tracking #: "${order.trackingNumber || 'None'}", Courier: "${order.courier || 'None'}"`
  );
  saveDatabase();

  res.json({
    success: true,
    message: 'Tracking updated successfully.',
    order,
  });
}

// Payment Verification (Approve / Verify / Reject Bank Transfer Payments & Update Status)
router.post('/orders/:id/verify-payment', (req: AuthenticatedRequest, res) => {
  const { action, reason, paymentStatus: customPaymentStatus, paymentVerificationStatus: customVerificationStatus, notes } = req.body;
  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const adminName = req.user?.name || req.user?.email || 'Admin';

  if (action === 'approve' || action === 'verify') {
    order.paymentStatus = 'paid';
    order.paymentVerificationStatus = 'verified';
    order.paymentVerifiedAt = new Date().toISOString();
    order.paymentVerifiedBy = adminName;
    if (order.status === 'pending') {
      order.status = 'confirmed';
    }
    const note = notes?.trim() || 'Bank transfer payment verified and approved by atelier finance manager.';
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      updatedBy: adminName,
      note,
      location: 'FAWNIC Finance Atelier, Karachi',
    });
    order.trackingHistory = [...order.timeline];
    createOrderNotification(order, order.status, { notes: note });
    broadcastOrderUpdate(order);
    logAdminAction(req.user!.email, 'PAYMENT_VERIFIED', 'Order', order.orderNumber, `Bank transfer payment marked Verified & Paid.`);
  } else if (action === 'reject') {
    order.paymentStatus = 'rejected';
    order.paymentVerificationStatus = 'rejected';
    const rejectReason = reason?.trim() || notes?.trim() || 'Bank transfer receipt verification failed or transaction TID not found in bank statement.';
    order.paymentRejectionReason = rejectReason;
    const note = `Payment rejected: ${rejectReason}. Order preserved in database pending resolution.`;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      updatedBy: adminName,
      note,
      location: 'FAWNIC Finance Atelier, Karachi',
    });
    order.trackingHistory = [...order.timeline];
    createOrderNotification(order, order.status, { notes: note });
    broadcastOrderUpdate(order);
    logAdminAction(req.user!.email, 'PAYMENT_REJECTED', 'Order', order.orderNumber, `Payment rejected: ${rejectReason}`);
  } else if (action === 'update_status') {
    if (customPaymentStatus) {
      order.paymentStatus = customPaymentStatus;
    }
    if (customVerificationStatus) {
      order.paymentVerificationStatus = customVerificationStatus;
    }
    if (notes) {
      order.paymentVerificationNotes = notes.trim();
    }
    const note = `Payment verification status updated to ${order.paymentStatus} (${order.paymentVerificationStatus || 'status updated'})${notes ? `: ${notes}` : ''}`;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      updatedBy: adminName,
      note,
      location: 'FAWNIC Finance Atelier, Karachi',
    });
    order.trackingHistory = [...order.timeline];
    broadcastOrderUpdate(order);
    logAdminAction(req.user!.email, 'PAYMENT_STATUS_UPDATED', 'Order', order.orderNumber, note);
  } else {
    res.status(400).json({ error: 'Invalid action. Must be "approve", "verify", "reject", or "update_status".' });
    return;
  }

  order.updatedAt = new Date().toISOString();
  saveDatabase();

  res.json({
    success: true,
    order,
    message: action === 'approve' || action === 'verify'
      ? 'Payment marked as Verified and order confirmed.'
      : action === 'reject'
      ? 'Payment marked as Rejected. Order retained with rejected status.'
      : 'Payment verification status updated successfully.'
  });
});

router.post('/orders/:id/notes', (req: AuthenticatedRequest, res) => {
  const { note } = req.body;
  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  order.internalNotes = note;
  order.updatedAt = new Date().toISOString();
  saveDatabase();
  res.json(order);
});

router.post('/orders/:id/cancel', (req: AuthenticatedRequest, res) => {
  const { reason } = req.body;
  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (order.status === 'cancelled') {
    res.status(400).json({ error: 'Order is already cancelled' });
    return;
  }

  const previousStatus = order.status;
  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();

  // Restore inventory
  for (const it of order.items) {
    const prod = db.products.find((p) => p.id === it.productId);
    if (prod) {
      const prev = prod.stock;
      prod.stock += it.quantity;
      if (prod.stock > 0) prod.stockStatus = 'in_stock';

      db.inventoryTransactions.unshift({
        id: `txn_rest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        previousStock: prev,
        change: it.quantity,
        newStock: prod.stock,
        reason: 'Order Cancelled',
        referenceId: order.orderNumber,
        adminEmail: req.user!.email,
        timestamp: new Date().toISOString(),
        notes: reason || `Cancelled: Restored from order #${order.orderNumber}`,
      });
    }
  }

  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    status: 'cancelled',
    timestamp: new Date().toISOString(),
    updatedBy: req.user?.name || req.user?.email || 'Admin',
    note: reason ? `Cancelled: ${reason}` : 'Order cancelled by atelier manager',
  });

  logAdminAction(req.user!.email, 'ORDER_CANCELLED', 'Order', order.orderNumber, reason || 'Cancelled order');
  saveDatabase();
  broadcastOrderUpdate(order);

  res.json(order);
});

router.delete('/orders/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.orders.findIndex((o) => o.id === req.params.id || o.orderNumber === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const removed = db.orders.splice(idx, 1)[0];
  logAdminAction(req.user!.email, 'ORDER_PERMANENTLY_DELETED', 'Order', removed.orderNumber, `Deleted test order`);
  saveDatabase();

  broadcastOrderUpdate({
    ...removed,
    status: 'cancelled',
  });

  res.json({ message: 'Order removed permanently' });
});

// 4. Customers Management
router.get('/customers', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const customers = db.users
    .filter((u) => u.role === 'customer')
    .map((c) => {
      const userOrders = db.orders.filter(
        (o) => o.customerId === c.id || o.customerEmail.toLowerCase() === c.email.toLowerCase()
      );
      const totalSpent = userOrders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatar: c.avatar,
        isSuspended: c.isSuspended,
        ordersCount: userOrders.length,
        totalSpent,
        createdAt: c.createdAt,
      };
    });

  res.json(customers);
});

router.put('/customers/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const customer = db.users.find((u) => u.id === req.params.id && u.role === 'customer');
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  const { name, phone, email, isSuspended } = req.body;
  if (name) customer.name = name.trim();
  if (phone) customer.phone = phone.trim();
  if (email) customer.email = email.trim().toLowerCase();
  if (isSuspended !== undefined) customer.isSuspended = Boolean(isSuspended);

  logAdminAction(req.user!.email, 'CUSTOMER_UPDATED', 'Customer', customer.email, `Updated profile details`);
  saveDatabase();

  res.json(customer);
});

router.delete('/customers/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const customer = db.users.find((u) => u.id === req.params.id && u.role === 'customer');
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  // Safe deactivation to preserve historical order records
  customer.isSuspended = true;
  customer.name = `[Deactivated] ${customer.name}`;
  logAdminAction(req.user!.email, 'CUSTOMER_DEACTIVATED', 'Customer', customer.email, `Account deactivated safely`);
  saveDatabase();

  res.json({ message: 'Customer account deactivated successfully while preserving order history.' });
});

// 5. Reviews Moderation
router.get('/reviews', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.reviews);
});

router.put('/reviews/:id/approve', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const review = db.reviews.find((r) => r.id === req.params.id);
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  review.isApproved = true;
  logAdminAction(req.user!.email, 'REVIEW_APPROVED', 'Review', review.id);
  saveDatabase();
  res.json(review);
});

router.delete('/reviews/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.reviews.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  db.reviews.splice(idx, 1);
  logAdminAction(req.user!.email, 'REVIEW_DELETED', 'Review', req.params.id);
  saveDatabase();
  res.json({ message: 'Review removed' });
});

router.post('/reviews/:id/reply', (req: AuthenticatedRequest, res) => {
  const { reply } = req.body;
  const db = getDb();
  const review = db.reviews.find((r) => r.id === req.params.id);
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  review.adminReply = reply;
  saveDatabase();
  res.json(review);
});

// 6. Coupons Management
router.get('/coupons', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.coupons);
});

router.post('/coupons', (req: AuthenticatedRequest, res) => {
  const { code, type, value, minOrderAmount, maxDiscount, usageLimit, expiresAt } = req.body;
  if (!code || !value) {
    res.status(400).json({ error: 'Coupon code and value are required' });
    return;
  }

  const db = getDb();
  const newCoupon: Coupon = {
    id: `cpn_${Date.now()}`,
    code: code.trim().toUpperCase(),
    type: type || 'percent',
    value: Number(value),
    minOrderAmount: Number(minOrderAmount) || 0,
    maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
    usageLimit: Number(usageLimit) || 100,
    usedCount: 0,
    perUserLimit: 1,
    expiresAt: expiresAt || '2026-12-31T23:59:59.000Z',
    isActive: true,
  };

  db.coupons.unshift(newCoupon);
  logAdminAction(req.user!.email, 'COUPON_CREATED', 'Coupon', newCoupon.code);
  saveDatabase();

  res.status(201).json(newCoupon);
});

router.delete('/coupons/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.coupons.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Coupon not found' });
    return;
  }
  db.coupons.splice(idx, 1);
  saveDatabase();
  res.json({ message: 'Coupon deleted' });
});

// 7. Homepage CMS Management
router.get('/cms', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.homepageCms);
});

router.put('/cms', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  Object.assign(db.homepageCms, req.body);
  logAdminAction(req.user!.email, 'HOMEPAGE_CMS_UPDATED', 'CMS');
  saveDatabase();
  res.json(db.homepageCms);
});

// 8. Policies & FAQs Management
router.get('/policies', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.policies);
});

router.put('/policies/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const policy = db.policies.find((p) => p.id === req.params.id);
  if (!policy) {
    res.status(404).json({ error: 'Policy not found' });
    return;
  }
  Object.assign(policy, req.body, { lastUpdated: new Date().toISOString().split('T')[0] });
  saveDatabase();
  res.json(policy);
});

router.get('/faqs', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.faqs);
});

router.post('/faqs', (req: AuthenticatedRequest, res) => {
  const { category, question, answer } = req.body;
  const db = getDb();
  const newFaq: FAQ = {
    id: `faq_${Date.now()}`,
    category: category || 'General',
    question,
    answer,
    order: db.faqs.length + 1,
  };
  db.faqs.push(newFaq);
  saveDatabase();
  res.status(201).json(newFaq);
});

router.delete('/faqs/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.faqs.findIndex((f) => f.id === req.params.id);
  if (idx !== -1) {
    db.faqs.splice(idx, 1);
    saveDatabase();
  }
  res.json({ message: 'FAQ deleted' });
});

// 9. Store Settings
router.get('/settings', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.settings);
});

router.put('/settings', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  Object.assign(db.settings, req.body);
  logAdminAction(req.user!.email, 'STORE_SETTINGS_UPDATED', 'Settings');
  saveDatabase();
  broadcastSettingsEvent({ settings: db.settings });
  res.json(db.settings);
});

// 10. Audit Logs
router.get('/audit-logs', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.auditLogs);
});

// 11. Image Upload (WordPress / WooCommerce style image handler)
router.post('/upload', async (req: AuthenticatedRequest, res) => {
  try {
    const { dataUrl, filename, category } = req.body;
    if (!dataUrl) {
      res.status(400).json({ error: 'Image data is required' });
      return;
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If it's already an http/https URL (e.g. Unsplash URL), accept directly
      if (typeof dataUrl === 'string' && dataUrl.startsWith('http')) {
        res.json({ url: dataUrl, filename: filename || 'remote-image.jpg' });
        return;
      }
      res.status(400).json({ error: 'Invalid base64 image data' });
      return;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Max 10MB check
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'File size exceeds 10MB limit' });
      return;
    }

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else {
      res.status(400).json({ error: 'Unsupported format. Please upload JPG, PNG or WEBP' });
      return;
    }

    const safeBase = (filename || 'fawnic-product')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 30);
    const uniqueName = `${safeBase}-${Date.now()}.${ext}`;

    // Upload to ImageKit permanent storage (with local fallback if credentials pending)
    const uploadResult = await uploadMedia({
      buffer,
      filename: uniqueName,
      mimeType,
      folder: 'products',
      uploadedBy: req.user?.email || 'admin',
    });

    // Record persistent media upload metadata in Neon PostgreSQL
    await recordMediaUploadInNeon({
      id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: uniqueName,
      fileKey: uploadResult.fileId,
      bucket: 'imagekit',
      url: uploadResult.url,
      contentType: mimeType,
      sizeBytes: uploadResult.size,
      uploadedBy: req.user?.email || 'admin',
    });

    logAdminAction(req.user!.email, 'IMAGE_UPLOADED', 'Media', uploadResult.url);
    saveDatabase();

    res.json({
      url: uploadResult.url,
      filename: uniqueName,
      size: uploadResult.size,
      mimeType,
      isPersistentImageKit: uploadResult.isPersistentImageKit,
    });
  } catch (err: any) {
    console.error('Error handling upload:', err);
    res.status(500).json({ error: 'Failed to process image upload: ' + err.message });
  }
});

// 12. Inventory Stock Adjustment & History
router.get('/inventory/transactions', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.inventoryTransactions || []);
});

router.post('/inventory/adjust', (req: AuthenticatedRequest, res) => {
  const { productId, change, reason, notes } = req.body;
  const db = getDb();
  const product = db.products.find((p) => p.id === productId);

  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const delta = Number(change);
  if (isNaN(delta) || delta === 0) {
    res.status(400).json({ error: 'Valid non-zero adjustment number required' });
    return;
  }

  const previousStock = product.stock;
  const newStock = Math.max(0, previousStock + delta);
  product.stock = newStock;

  if (product.stock === 0) {
    product.stockStatus = 'out_of_stock';
  } else if (product.stock <= product.lowStockThreshold) {
    product.stockStatus = 'low_stock';
  } else {
    product.stockStatus = 'in_stock';
  }

  const transaction: InventoryTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    change: delta,
    previousStock,
    newStock,
    reason: reason || 'Manual Adjustment',
    adminEmail: req.user!.email,
    timestamp: new Date().toISOString(),
    notes: notes?.trim(),
  };

  if (!db.inventoryTransactions) db.inventoryTransactions = [];
  db.inventoryTransactions.unshift(transaction);

  logAdminAction(
    req.user!.email,
    'STOCK_ADJUSTED',
    'Inventory',
    product.sku,
    `${delta > 0 ? '+' : ''}${delta} (${previousStock} -> ${newStock}) - ${reason}`
  );

  saveDatabase();
  broadcastProductEvent({ action: 'inventory', productId: product.id, product });

  res.json({
    product,
    transaction,
  });
});

// 13. Invoices Management
router.get('/invoices', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.invoices || []);
});

router.get('/invoices/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const inv = (db.invoices || []).find((i) => i.id === req.params.id || i.invoiceNumber === req.params.id);
  if (!inv) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  res.json(inv);
});

router.delete('/invoices/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (!db.invoices) db.invoices = [];
  const idx = db.invoices.findIndex((i) => i.id === req.params.id || i.invoiceNumber === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  const deleted = db.invoices.splice(idx, 1)[0];
  logAdminAction(req.user!.email, 'INVOICE_DELETED', 'Invoice', deleted.invoiceNumber, `Deleted invoice ${deleted.invoiceNumber}`);
  saveDatabase();
  res.json({ message: 'Invoice deleted successfully', invoiceNumber: deleted.invoiceNumber });
});

router.post('/invoices/generate/:orderId', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const order = db.orders.find((o) => o.id === req.params.orderId || o.orderNumber === req.params.orderId);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (!db.invoices) db.invoices = [];

  // Check if invoice already exists
  const existing = db.invoices.find((i) => i.orderId === order.id || i.orderNumber === order.orderNumber);
  if (existing) {
    res.json(existing);
    return;
  }

  const invoiceNumber = getNextInvoiceNumber();

  const addr = order.shippingAddress;
  const fullAddress = [
    addr.houseNumber,
    addr.streetAddress,
    addr.area,
    addr.city,
    addr.province,
  ]
    .filter(Boolean)
    .join(', ');

  const newInvoice: InvoiceRecord = {
    id: `inv_${Date.now()}`,
    invoiceNumber,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customerAddress: fullAddress || 'Address on file',
    items: order.items,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    total: order.total,
    paymentMethod: order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Bank Transfer (1Link IBFT)',
    paymentStatus: order.paymentStatus,
    orderDate: order.createdAt,
    createdAt: new Date().toISOString(),
    status: order.paymentStatus === 'paid' ? 'paid' : 'issued',
  };

  db.invoices.unshift(newInvoice);
  logAdminAction(req.user!.email, 'INVOICE_GENERATED', 'Invoice', newInvoice.invoiceNumber, `Generated for order ${order.orderNumber}`);
  saveDatabase();

  res.status(201).json(newInvoice);
});

// Manual Invoice Creation
router.post('/invoices/manual', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const {
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    items,
    discount = 0,
    shippingFee = 0,
    tax = 0,
    taxType = 'none',
    taxRate = 0,
    paymentMethod = 'Cash on Delivery (COD)',
    orderReference,
    invoiceDate,
    notes,
  } = req.body;

  if (!customerName || !customerName.trim()) {
    res.status(400).json({ error: 'Customer Full Name is required.' });
    return;
  }

  if (!customerPhone || !customerPhone.trim()) {
    res.status(400).json({ error: 'Customer Phone Number is required.' });
    return;
  }

  if (!customerAddress || !customerAddress.trim()) {
    res.status(400).json({ error: 'Customer Address / Location is required.' });
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'At least one line item is required.' });
    return;
  }

  const hasValidItem = items.some((it: any) => (it.productName || it.name) && Number(it.unitPrice ?? it.price) >= 0);
  if (!hasValidItem) {
    res.status(400).json({ error: 'Please add at least one valid item with name and price.' });
    return;
  }

  if (!db.invoices) db.invoices = [];

  const invoiceNumber = getNextInvoiceNumber();

  const processedItems = items
    .filter((it: any) => (it.productName || it.name)?.trim())
    .map((it: any) => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const price = Math.max(0, Number(it.unitPrice ?? it.price) || 0);
      return {
        productId: it.productId || `prd_man_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        productName: (it.productName || it.name || 'Handcrafted Bespoke Leather Item').trim(),
        productImage: it.productImage || it.image || '',
        sku: it.sku || 'FAWNIC-BESPOKE',
        quantity: qty,
        unitPrice: price,
        subtotal: qty * price,
      };
    });

  const subtotal = processedItems.reduce((sum: number, it: any) => sum + it.subtotal, 0);
  const numDiscount = Math.max(0, Number(discount) || 0);
  const numShipping = Math.max(0, Number(shippingFee) || 0);
  const numTax = Math.max(0, Number(tax) || 0);
  const total = Math.max(0, subtotal - numDiscount + numShipping + numTax);

  const formattedOrderRef = (orderReference && orderReference.trim()) 
    ? orderReference.trim() 
    : `MAN-${Date.now().toString().slice(-6)}`;

  const invoiceDateValue = invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString();

  const manualInvoice: InvoiceRecord = {
    id: `inv_man_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    invoiceNumber,
    type: 'manual',
    orderId: undefined,
    orderNumber: formattedOrderRef,
    customerName: customerName.trim(),
    customerEmail: customerEmail?.trim() || '',
    customerPhone: customerPhone.trim(),
    customerAddress: customerAddress.trim(),
    items: processedItems,
    subtotal,
    shippingFee: numShipping,
    discount: numDiscount,
    tax: numTax,
    taxType: (taxType as any) || 'none',
    taxRate: Number(taxRate) || 0,
    total,
    paymentMethod: paymentMethod || 'Cash on Delivery (COD)',
    paymentStatus: 'paid',
    orderDate: invoiceDateValue,
    createdAt: new Date().toISOString(),
    status: 'issued',
    notes: notes?.trim() || '',
  };

  db.invoices.unshift(manualInvoice);
  logAdminAction(req.user!.email, 'MANUAL_INVOICE_CREATED', 'Invoice', invoiceNumber, `Created manual invoice ${invoiceNumber} for ${customerName}`);
  saveDatabase();

  res.status(201).json(manualInvoice);
});

// Update Existing Invoice (Edit Invoice)
router.put('/invoices/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (!db.invoices) db.invoices = [];
  const idx = db.invoices.findIndex((i) => i.id === req.params.id || i.invoiceNumber === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const existing = db.invoices[idx];
  const {
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    items,
    discount = 0,
    shippingFee = 0,
    tax = 0,
    taxType = 'none',
    taxRate = 0,
    paymentMethod,
    orderReference,
    invoiceDate,
    notes,
    paymentStatus,
    status,
  } = req.body;

  if (!customerName || !customerName.trim()) {
    res.status(400).json({ error: 'Customer Full Name is required.' });
    return;
  }

  if (!customerPhone || !customerPhone.trim()) {
    res.status(400).json({ error: 'Customer Phone Number is required.' });
    return;
  }

  if (!customerAddress || !customerAddress.trim()) {
    res.status(400).json({ error: 'Customer Address / Location is required.' });
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'At least one line item is required.' });
    return;
  }

  const processedItems = items
    .filter((it: any) => (it.productName || it.name)?.trim())
    .map((it: any) => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const price = Math.max(0, Number(it.unitPrice ?? it.price) || 0);
      return {
        productId: it.productId || `prd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        productName: (it.productName || it.name || 'Handcrafted Bespoke Leather Item').trim(),
        productImage: it.productImage || it.image || '',
        sku: it.sku || 'FAWNIC-BESPOKE',
        quantity: qty,
        unitPrice: price,
        subtotal: qty * price,
      };
    });

  const subtotal = processedItems.reduce((sum: number, it: any) => sum + it.subtotal, 0);
  const numDiscount = Math.max(0, Number(discount) || 0);
  const numShipping = Math.max(0, Number(shippingFee) || 0);
  const numTax = Math.max(0, Number(tax) || 0);
  const total = Math.max(0, subtotal - numDiscount + numShipping + numTax);

  existing.customerName = customerName.trim();
  existing.customerEmail = customerEmail?.trim() || '';
  existing.customerPhone = customerPhone.trim();
  existing.customerAddress = customerAddress.trim();
  if (paymentMethod) existing.paymentMethod = paymentMethod;
  if (orderReference && orderReference.trim()) existing.orderNumber = orderReference.trim();
  if (invoiceDate) existing.orderDate = new Date(invoiceDate).toISOString();
  if (notes !== undefined) existing.notes = notes.trim();
  if (paymentStatus) existing.paymentStatus = paymentStatus;
  if (status) existing.status = status;

  existing.items = processedItems;
  existing.subtotal = subtotal;
  existing.discount = numDiscount;
  existing.shippingFee = numShipping;
  existing.tax = numTax;
  existing.taxType = (taxType as any) || 'none';
  existing.taxRate = Number(taxRate) || 0;
  existing.total = total;

  logAdminAction(req.user!.email, 'INVOICE_UPDATED', 'Invoice', existing.invoiceNumber, `Updated invoice ${existing.invoiceNumber} for ${customerName}`);
  saveDatabase();

  res.json(existing);
});

router.get('/invoice-settings', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.invoiceSettings);
});

router.put('/invoice-settings', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  Object.assign(db.invoiceSettings, req.body);
  logAdminAction(req.user!.email, 'INVOICE_SETTINGS_UPDATED', 'Settings');
  saveDatabase();
  res.json(db.invoiceSettings);
});

// 14. Customer CRM Detail & Notes
router.get('/customers/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const customer = db.users.find((u) => u.id === req.params.id);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  const customerOrders = db.orders.filter(
    (o) => o.customerId === customer.id || o.customerEmail.toLowerCase() === customer.email.toLowerCase()
  );
  const totalSpent = customerOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const customerAddresses = db.addresses.filter((a) => a.userId === customer.id);
  const notes = db.customerNotes?.[customer.id] || '';

  res.json({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    avatar: customer.avatar,
    isSuspended: customer.isSuspended,
    createdAt: customer.createdAt,
    ordersCount: customerOrders.length,
    totalSpent,
    orders: customerOrders,
    addresses: customerAddresses,
    notes,
  });
});

router.put('/customers/:id/notes', (req: AuthenticatedRequest, res) => {
  const { notes } = req.body;
  const db = getDb();
  if (!db.customerNotes) db.customerNotes = {};
  db.customerNotes[req.params.id] = notes || '';
  saveDatabase();
  res.json({ success: true, notes });
});

// 15. Team & RBAC Management (Complete Staff System)
router.get('/team', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const safeList = (db.teamMembers || []).map((m) => {
    const { passwordHash, salt, ...safe } = m;
    return safe;
  });
  res.json(safeList);
});

router.post('/team', (req: AuthenticatedRequest, res) => {
  const { name, email, phone, role, avatar, permissions, password, confirmPassword, status } = req.body;
  if (!name || !email || !role) {
    res.status(400).json({ error: 'Name, email, and role are required.' });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    return;
  }

  const db = getDb();
  if (!db.teamMembers) db.teamMembers = [];

  const normalizedEmail = email.trim().toLowerCase();
  const existingInTeam = db.teamMembers.find((m) => m.email.toLowerCase() === normalizedEmail);
  const existingInUsers = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (existingInTeam || existingInUsers) {
    res.status(400).json({ error: 'A staff member or user with this email address already exists.' });
    return;
  }

  const { hash, salt } = hashPassword(password);

  const defaultPermissions = {
    pages: ['dashboard', 'orders', 'products', 'inventory'],
    actions: {
      products: { view: true, add: false, edit: false, publish: false, unpublish: false, delete: false },
      orders: { view: true, edit: false, cancel: false, delete: false },
      invoices: { view: false, create: false, edit: false, download: false, delete: false },
      staff: { view: false, create: false, edit: false, delete: false, manage_permissions: false },
    },
  };

  const newMember: TeamMember = {
    id: `tm_${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    phone: phone?.trim() || '+92 300 0000000',
    role: role || 'manager',
    avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    status: status === 'disabled' ? 'disabled' : 'active',
    createdAt: new Date().toISOString(),
    permissions: permissions || defaultPermissions,
    passwordHash: hash,
    salt,
  };

  db.teamMembers.push(newMember);
  logAdminAction(req.user!.email, 'STAFF_ACCOUNT_CREATED', 'Team', newMember.email, `Created lifetime staff account for ${newMember.name} as ${newMember.role}`);
  saveDatabase();

  const { passwordHash: _ph, salt: _s, ...safeMember } = newMember;
  res.status(201).json(safeMember);
});

router.put('/team/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const member = (db.teamMembers || []).find((m) => m.id === req.params.id);
  if (!member) {
    res.status(404).json({ error: 'Staff member not found' });
    return;
  }

  const { role, status, name, phone, permissions, avatar } = req.body;
  if (role !== undefined) member.role = role;
  if (name !== undefined) member.name = name.trim();
  if (phone !== undefined) member.phone = phone.trim();
  if (avatar !== undefined) member.avatar = avatar;
  if (permissions !== undefined) member.permissions = permissions;

  if (status !== undefined) {
    member.status = status;
    // If account was disabled or suspended, immediately revoke any active session token!
    if (status === 'disabled' || status === 'suspended') {
      removeUserSessions(member.id);
    }
  }

  logAdminAction(req.user!.email, 'STAFF_ACCOUNT_UPDATED', 'Team', member.email, `Updated staff profile & permissions for ${member.name}`);
  saveDatabase();

  const { passwordHash: _ph, salt: _s, ...safeMember } = member;
  res.json(safeMember);
});

// Change Staff Password
router.put('/team/:id/password', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const member = (db.teamMembers || []).find((m) => m.id === req.params.id);
  if (!member) {
    res.status(404).json({ error: 'Staff member not found' });
    return;
  }

  const { newPassword, confirmPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    return;
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  member.passwordHash = hash;
  member.salt = salt;

  // Revoke active sessions so staff must log in with new password
  removeUserSessions(member.id);

  logAdminAction(req.user!.email, 'STAFF_PASSWORD_RESET', 'Team', member.email, `Reset password for staff member ${member.name}`);
  saveDatabase();

  res.json({ message: `Password for ${member.name} updated successfully. Active sessions revoked.` });
});

// Toggle Staff Status (Enable / Disable)
router.put('/team/:id/status', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const member = (db.teamMembers || []).find((m) => m.id === req.params.id);
  if (!member) {
    res.status(404).json({ error: 'Staff member not found' });
    return;
  }

  const { status } = req.body;
  if (status !== 'active' && status !== 'disabled' && status !== 'suspended') {
    res.status(400).json({ error: 'Invalid status. Must be active, disabled, or suspended.' });
    return;
  }

  member.status = status;
  if (status === 'disabled' || status === 'suspended') {
    removeUserSessions(member.id);
  }

  logAdminAction(req.user!.email, 'STAFF_STATUS_CHANGED', 'Team', member.email, `Changed status of ${member.name} to ${status}`);
  saveDatabase();

  res.json({ message: `Staff status updated to ${status}`, status: member.status });
});

// Delete Staff Member Permanently
router.delete('/team/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = (db.teamMembers || []).findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Staff member not found' });
    return;
  }

  const removed = db.teamMembers.splice(idx, 1)[0];
  // Immediately revoke any active session
  removeUserSessions(removed.id);

  logAdminAction(req.user!.email, 'STAFF_ACCOUNT_DELETED', 'Team', removed.email, `Permanently deleted staff account ${removed.name}`);
  saveDatabase();

  res.json({ message: 'Staff member permanently removed and active sessions terminated.' });
});

// Staff Activity Log
router.get('/team/activity', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const logs = (db.auditLogs || []).filter(
    (l) => l.entityType === 'Team' || l.entityType === 'Staff' || l.entityType === 'Security'
  );
  res.json(logs);
});

// Delete Inventory Row (Removes product from catalog with audit trail)
router.delete('/inventory/:productId', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.products.findIndex((p) => p.id === req.params.productId);
  if (idx === -1) {
    res.status(404).json({ error: 'Product inventory item not found' });
    return;
  }

  const removed = db.products.splice(idx, 1)[0];

  // Record inventory transaction
  const tx: InventoryTransaction = {
    id: `tx_${Date.now()}`,
    productId: removed.id,
    productName: removed.name,
    sku: removed.sku,
    change: -removed.stock,
    previousStock: removed.stock,
    newStock: 0,
    reason: 'Correction',
    adminEmail: req.user!.email,
    timestamp: new Date().toISOString(),
    notes: 'Inventory row deleted by admin'
  };
  if (!db.inventoryTransactions) db.inventoryTransactions = [];
  db.inventoryTransactions.unshift(tx);

  logAdminAction(req.user!.email, 'INVENTORY_DELETED', 'Inventory', removed.id, `Removed inventory and catalog product "${removed.name}"`);
  saveDatabase();

  res.json({ message: `Inventory and product "${removed.name}" removed successfully.`, productId: removed.id });
});

// Marketing Promotions Endpoints
router.get('/marketing/promotions', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.promotions || []);
});

router.post('/marketing/promotions', (req: AuthenticatedRequest, res) => {
  const { title, type, description, code, discountPercentage, startDate, endDate, isActive } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Promotion title is required' });
    return;
  }

  const db = getDb();
  if (!db.promotions) db.promotions = [];

  const newPromo: MarketingPromotion = {
    id: `prm_${Date.now()}`,
    title: title.trim(),
    type: type || 'banner',
    description: description?.trim() || '',
    code: code?.trim().toUpperCase() || '',
    discountPercentage: Number(discountPercentage) || 0,
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    isActive: isActive !== false,
    createdAt: new Date().toISOString(),
  };

  db.promotions.unshift(newPromo);
  logAdminAction(req.user!.email, 'PROMOTION_CREATED', 'Marketing', newPromo.id, `Created promotion "${newPromo.title}"`);
  saveDatabase();

  res.status(201).json(newPromo);
});

router.put('/marketing/promotions/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (!db.promotions) db.promotions = [];
  const promo = db.promotions.find((p) => p.id === req.params.id);
  if (!promo) {
    res.status(404).json({ error: 'Promotion not found' });
    return;
  }

  Object.assign(promo, req.body);
  logAdminAction(req.user!.email, 'PROMOTION_UPDATED', 'Marketing', promo.id, `Updated promotion "${promo.title}"`);
  saveDatabase();

  res.json(promo);
});

router.delete('/marketing/promotions/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (!db.promotions) db.promotions = [];
  const idx = db.promotions.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Promotion not found' });
    return;
  }

  const removed = db.promotions.splice(idx, 1)[0];
  logAdminAction(req.user!.email, 'PROMOTION_DELETED', 'Marketing', removed.id, `Deleted promotion "${removed.title}"`);
  saveDatabase();

  res.json({ message: 'Promotion removed successfully' });
});

router.get('/roles', (req: AuthenticatedRequest, res) => {
  const roles = [
    {
      id: 'super_admin',
      name: 'Super Admin',
      description: 'Complete unrestricted access to all atelier operations, financial reports, team management, and server settings.',
      permissions: ['Products (All)', 'Orders (All)', 'Customers', 'Invoices', 'Inventory', 'Team Management', 'Settings', 'Reports'],
    },
    {
      id: 'manager',
      name: 'Atelier Manager',
      description: 'Oversees day-to-day operations, product catalog, customer service, discounts, and order workflow.',
      permissions: ['Products (All)', 'Orders (All)', 'Customers', 'Inventory', 'Coupons', 'Analytics'],
    },
    {
      id: 'order_manager',
      name: 'Order & Logistics Manager',
      description: 'Manages dispatch, courier assignments (TCS, Leopards), returns inspection, and packing status.',
      permissions: ['Orders (View & Edit)', 'Tracking & Courier', 'Customers (View)', 'Inventory (View)'],
    },
    {
      id: 'catalog_manager',
      name: 'Catalog & Leather Specialist',
      description: 'Manages product photography, descriptions, pricing, leather variants, specifications, and inventory updates.',
      permissions: ['Products (All)', 'Inventory (Adjust & Audit)', 'Categories'],
    },
    {
      id: 'accountant',
      name: 'Finance & Accounts',
      description: 'Handles FBR tax invoices, revenue reconciliation, 1Link IBFT verification, and financial reports.',
      permissions: ['Invoices (All)', 'Revenue Reports', 'Orders (View)', 'Export Data'],
    },
    {
      id: 'support',
      name: 'Customer Concierge',
      description: 'Handles order tracking queries, customer addresses, reviews moderation, and exchange inquiries.',
      permissions: ['Orders (View)', 'Customers (View & Notes)', 'Reviews', 'Tracking'],
    }
  ];

  res.json(roles);
});

// 16. Notification Management System
router.get('/notifications', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (!db.notifications) db.notifications = [];
  if (!db.notificationReads) db.notificationReads = [];

  const { search, status, type } = req.query;
  let list = [...db.notifications];

  // Status Filter
  if (status && status !== 'all') {
    list = list.filter((n) => n.status === status);
  }

  // Type Filter
  if (type && type !== 'all') {
    list = list.filter((n) => n.type === type);
  }

  // Search Filter
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q) ||
        (n.targetUserNames && n.targetUserNames.some((u) => u.toLowerCase().includes(q)))
    );
  }

  // Calculate live statistics strictly from database records
  const all = db.notifications;
  const stats = {
    total: all.length,
    published: all.filter((n) => n.status === 'published').length,
    scheduled: all.filter((n) => n.status === 'scheduled').length,
    draft: all.filter((n) => n.status === 'draft').length,
    expired: all.filter((n) => n.status === 'expired').length,
    unreadActive: all.filter((n) => n.status === 'published').length,
  };

  // Map each notification with its engagement / read count
  const enrichedList = list.map((n) => {
    const readCount = db.notificationReads.filter((r) => r.notificationId === n.id).length;
    return {
      ...n,
      readCount,
    };
  });

  res.json({
    notifications: enrichedList,
    stats,
  });
});

// Real-Time Notification Statistics
router.get('/notifications/stats', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const all = db.notifications || [];
  const stats = {
    total: all.length,
    published: all.filter((n) => n.status === 'published').length,
    scheduled: all.filter((n) => n.status === 'scheduled').length,
    draft: all.filter((n) => n.status === 'draft').length,
    expired: all.filter((n) => n.status === 'expired').length,
    unreadActive: all.filter((n) => n.status === 'published').length,
  };
  res.json(stats);
});

// Get registered customers for "Specific Customer" audience selection
router.get('/notifications/customers', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const customers = (db.users || [])
    .filter((u) => u.role === 'customer')
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
    }));
  res.json(customers);
});

// Create Notification
router.post('/notifications', (req: AuthenticatedRequest, res) => {
  const {
    title,
    message,
    type,
    image,
    link,
    buttonText,
    audience,
    targetUserIds,
    targetUserNames,
    status,
    scheduledAt,
    expiresAt,
  } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Notification title is required' });
    return;
  }
  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Notification message is required' });
    return;
  }

  const db = getDb();
  if (!db.notifications) db.notifications = [];

  const notifStatus: NotificationStatus = status || 'published';
  const now = new Date().toISOString();

  const newNotif: NotificationRecord = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: title.trim(),
    message: message.trim(),
    type: (type as NotificationType) || 'General',
    image: image ? image.trim() : undefined,
    link: link ? link.trim() : undefined,
    buttonText: buttonText ? buttonText.trim() : undefined,
    audience: (audience as NotificationAudience) || 'all',
    targetUserIds: Array.isArray(targetUserIds) ? targetUserIds : [],
    targetUserNames: Array.isArray(targetUserNames) ? targetUserNames : [],
    status: notifStatus,
    scheduledAt: scheduledAt || undefined,
    publishedAt: notifStatus === 'published' ? now : undefined,
    expiresAt: expiresAt || undefined,
    createdAt: now,
    updatedAt: now,
    createdBy: req.user?.name || req.user?.email || 'Admin',
  };

  db.notifications.unshift(newNotif);
  logAdminAction(
    req.user!.email,
    'NOTIFICATION_CREATED',
    'Notification',
    newNotif.id,
    `Created notification "${newNotif.title}" (${newNotif.status})`
  );
  saveDatabase();

  // Broadcast in real-time
  broadcastNotificationEvent({
    action: 'created',
    notification: newNotif,
  });
  broadcastAdminNotificationStats();

  res.status(201).json(newNotif);
});

// Update Notification
router.put('/notifications/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (!db.notifications) db.notifications = [];

  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  const prevStatus = notif.status;
  const now = new Date().toISOString();

  const {
    title,
    message,
    type,
    image,
    link,
    buttonText,
    audience,
    targetUserIds,
    targetUserNames,
    status,
    scheduledAt,
    expiresAt,
  } = req.body;

  if (title !== undefined) notif.title = title.trim();
  if (message !== undefined) notif.message = message.trim();
  if (type !== undefined) notif.type = type;
  if (image !== undefined) notif.image = image ? image.trim() : undefined;
  if (link !== undefined) notif.link = link ? link.trim() : undefined;
  if (buttonText !== undefined) notif.buttonText = buttonText ? buttonText.trim() : undefined;
  if (audience !== undefined) notif.audience = audience;
  if (targetUserIds !== undefined) notif.targetUserIds = targetUserIds;
  if (targetUserNames !== undefined) notif.targetUserNames = targetUserNames;
  if (status !== undefined) notif.status = status;
  if (scheduledAt !== undefined) notif.scheduledAt = scheduledAt || undefined;
  if (expiresAt !== undefined) notif.expiresAt = expiresAt || undefined;

  if (notif.status === 'published' && prevStatus !== 'published') {
    notif.publishedAt = now;
  }

  notif.updatedAt = now;

  logAdminAction(
    req.user!.email,
    'NOTIFICATION_UPDATED',
    'Notification',
    notif.id,
    `Updated notification "${notif.title}" (${notif.status})`
  );
  saveDatabase();

  // Broadcast in real-time
  broadcastNotificationEvent({
    action: 'updated',
    notification: notif,
  });
  broadcastAdminNotificationStats();

  res.json(notif);
});

// Publish Notification Toggle
router.put('/notifications/:id/publish', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const notif = (db.notifications || []).find((n) => n.id === req.params.id);
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  notif.status = 'published';
  notif.publishedAt = new Date().toISOString();
  notif.updatedAt = new Date().toISOString();

  logAdminAction(req.user!.email, 'NOTIFICATION_PUBLISHED', 'Notification', notif.id, `Published "${notif.title}"`);
  saveDatabase();

  broadcastNotificationEvent({
    action: 'created',
    notification: notif,
  });
  broadcastAdminNotificationStats();

  res.json(notif);
});

// Unpublish Notification (Set to Draft)
router.put('/notifications/:id/unpublish', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const notif = (db.notifications || []).find((n) => n.id === req.params.id);
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  notif.status = 'draft';
  notif.updatedAt = new Date().toISOString();

  logAdminAction(req.user!.email, 'NOTIFICATION_UNPUBLISHED', 'Notification', notif.id, `Unpublished "${notif.title}"`);
  saveDatabase();

  broadcastNotificationEvent({
    action: 'updated',
    notification: notif,
  });
  broadcastAdminNotificationStats();

  res.json(notif);
});

// Duplicate Notification
router.post('/notifications/:id/duplicate', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const source = (db.notifications || []).find((n) => n.id === req.params.id);
  if (!source) {
    res.status(404).json({ error: 'Notification not found to duplicate' });
    return;
  }

  const now = new Date().toISOString();
  const duplicateNotif: NotificationRecord = {
    ...source,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: `${source.title} — Copy`,
    status: 'draft',
    scheduledAt: undefined,
    publishedAt: undefined,
    createdAt: now,
    updatedAt: now,
    createdBy: req.user?.name || req.user?.email || 'Admin',
  };

  db.notifications.unshift(duplicateNotif);
  logAdminAction(
    req.user!.email,
    'NOTIFICATION_DUPLICATED',
    'Notification',
    duplicateNotif.id,
    `Duplicated "${source.title}"`
  );
  saveDatabase();

  broadcastAdminNotificationStats();

  res.status(201).json(duplicateNotif);
});

// Delete Notification
router.delete('/notifications/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = (db.notifications || []).findIndex((n) => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  const removed = db.notifications.splice(idx, 1)[0];

  // Clean up any read records for this notification
  if (db.notificationReads) {
    db.notificationReads = db.notificationReads.filter((r) => r.notificationId !== req.params.id);
  }

  logAdminAction(
    req.user!.email,
    'NOTIFICATION_DELETED',
    'Notification',
    req.params.id,
    `Deleted notification "${removed.title}"`
  );
  saveDatabase();

  // Real-time broadcast so it is immediately removed from customer dropdowns & admin panels
  broadcastNotificationEvent({
    action: 'deleted',
    notificationId: req.params.id,
  });
  broadcastAdminNotificationStats();

  res.json({ success: true, message: 'Notification removed successfully' });
});

// Upload Notification Image
router.post('/notifications/upload-image', async (req: AuthenticatedRequest, res) => {
  const { filename, data } = req.body;
  if (!data) {
    res.status(400).json({ error: 'Image data is required' });
    return;
  }

  try {
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const ext = filename ? path.extname(filename) : '.jpg';
    const safeName = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext || '.jpg'}`;

    let buffer: Buffer;
    let mimeType = 'image/jpeg';
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(data, 'base64');
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.webp') mimeType = 'image/webp';
    }

    const uploadResult = await uploadMedia({
      buffer,
      filename: safeName,
      mimeType,
      folder: 'notifications',
      uploadedBy: req.user?.email || 'admin',
    });

    await recordMediaUploadInNeon({
      id: `media_notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: safeName,
      fileKey: uploadResult.fileId,
      bucket: 'imagekit',
      url: uploadResult.url,
      contentType: mimeType,
      sizeBytes: uploadResult.size,
      uploadedBy: req.user?.email || 'admin',
    });

    res.json({ url: uploadResult.url });
  } catch (err: any) {
    console.error('Error saving notification image:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Explicit Media Delete endpoint for Admin Panel
router.delete('/media', async (req: AuthenticatedRequest, res) => {
  const { url, fileId } = req.body || {};
  const target = fileId || url || (req.query.url as string) || (req.query.fileId as string);
  if (!target) {
    res.status(400).json({ error: 'url or fileId is required' });
    return;
  }
  const deleted = await deleteMedia(target);
  res.json({ success: true, deleted });
});

// 17. Unified Global Search
router.get('/search', (req: AuthenticatedRequest, res) => {
  const q = ((req.query.q as string) || '').toLowerCase().trim();
  if (!q) {
    res.json({ products: [], orders: [], customers: [], invoices: [], team: [] });
    return;
  }

  const db = getDb();

  const products = db.products
    .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.leatherType?.toLowerCase().includes(q))
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, price: p.salePrice || p.regularPrice, stock: p.stock, image: p.mainImage }));

  const orders = db.orders
    .filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
    )
    .slice(0, 5)
    .map((o) => ({ id: o.id, orderNumber: o.orderNumber, customer: o.customerName, total: o.total, status: o.status, date: o.createdAt }));

  const customers = db.users
    .filter((u) => u.role === 'customer' && (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q)))
    .slice(0, 5)
    .map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar }));

  const invoices = (db.invoices || [])
    .filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.orderNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q))
    .slice(0, 5);

  const team = (db.teamMembers || [])
    .filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q))
    .slice(0, 5);

  res.json({ products, orders, customers, invoices, team });
});

// 18. Analytics with Date Range Filter
router.get('/analytics', (req: AuthenticatedRequest, res) => {
  const range = (req.query.range as string) || '30days';
  const db = getDb();

  const now = new Date();
  let days = 30;
  if (range === 'today') days = 1;
  else if (range === '7days') days = 7;
  else if (range === '30days') days = 30;
  else if (range === '3months') days = 90;
  else if (range === '6months') days = 180;
  else if (range === '1year') days = 365;

  const cutoffTime = now.getTime() - days * 24 * 60 * 60 * 1000;
  const validOrders = db.orders.filter((o) => o.status !== 'cancelled' && new Date(o.createdAt).getTime() >= cutoffTime);

  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = validOrders.length;
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Category breakdown
  const categorySales: Record<string, number> = {};
  validOrders.forEach((o) => {
    o.items.forEach((it) => {
      const prod = db.products.find((p) => p.id === it.productId);
      const catName = prod?.categoryName || 'Other Leather Goods';
      categorySales[catName] = (categorySales[catName] || 0) + it.subtotal;
    });
  });

  // Top products
  const productStats: Record<string, { product: Product; units: number; revenue: number }> = {};
  validOrders.forEach((o) => {
    o.items.forEach((it) => {
      const prod = db.products.find((p) => p.id === it.productId);
      if (prod) {
        if (!productStats[prod.id]) {
          productStats[prod.id] = { product: prod, units: 0, revenue: 0 };
        }
        productStats[prod.id].units += it.quantity;
        productStats[prod.id].revenue += it.subtotal;
      }
    });
  });

  const topSellingProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Time-series intervals
  const intervals: Record<string, { revenue: number; orders: number }> = {};
  const stepDays = days <= 7 ? 1 : days <= 30 ? 2 : days <= 90 ? 7 : 30;

  for (let d = days; d >= 0; d -= stepDays) {
    const dt = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const key = dt.toISOString().split('T')[0];
    intervals[key] = { revenue: 0, orders: 0 };
  }

  validOrders.forEach((o) => {
    const oDate = o.createdAt.split('T')[0];
    // Find closest interval key
    const keys = Object.keys(intervals);
    const match = keys.find((k) => k === oDate) || keys[keys.length - 1];
    if (match && intervals[match]) {
      intervals[match].revenue += o.total;
      intervals[match].orders += 1;
    }
  });

  const chartSeries = Object.entries(intervals).map(([label, data]) => ({
    date: label,
    revenue: data.revenue,
    orders: data.orders,
  }));

  res.json({
    range,
    totalRevenue,
    totalOrders: totalOrdersCount,
    averageOrderValue,
    categorySales,
    topSellingProducts,
    chartSeries,
  });
});

// 19. Export Reports (CSV)
router.get('/reports/export', (req: AuthenticatedRequest, res) => {
  const type = (req.query.type as string) || 'orders';
  const db = getDb();

  let csvContent = '';
  let filename = `fawnic-${type}-${new Date().toISOString().split('T')[0]}.csv`;

  if (type === 'orders') {
    csvContent = 'Order ID,Date,Customer,Email,Phone,Items Count,Subtotal,Shipping,Discount,Total (PKR),Payment Method,Payment Status,Status,Tracking Number,Courier\n';
    db.orders.forEach((o) => {
      const itemsCount = o.items.reduce((s, it) => s + it.quantity, 0);
      csvContent += `"${o.orderNumber}","${o.createdAt.split('T')[0]}","${o.customerName}","${o.customerEmail}","${o.customerPhone}",${itemsCount},${o.subtotal},${o.shippingFee},${o.discount},${o.total},"${o.paymentMethod}","${o.paymentStatus}","${o.status}","${o.trackingNumber || ''}","${o.courierName || ''}"\n`;
    });
  } else if (type === 'products' || type === 'inventory') {
    csvContent = 'SKU,Product Name,Category,Leather Type,Stock,Low Stock Alert,Status,Cost Price,Sale Price,Regular Price\n';
    db.products.forEach((p) => {
      csvContent += `"${p.sku}","${p.name}","${p.categoryName}","${p.leatherType || ''}",${p.stock},${p.lowStockThreshold},"${p.status}",${p.costPrice || 0},${p.salePrice},${p.regularPrice}\n`;
    });
  } else if (type === 'customers') {
    csvContent = 'Customer Name,Email,Phone,Registered Date,Total Orders,Total Spent (PKR)\n';
    db.users
      .filter((u) => u.role === 'customer')
      .forEach((u) => {
        const uOrders = db.orders.filter((o) => o.customerId === u.id || o.customerEmail === u.email);
        const spent = uOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
        csvContent += `"${u.name}","${u.email}","${u.phone}","${u.createdAt.split('T')[0]}",${uOrders.length},${spent}\n`;
      });
  } else if (type === 'invoices') {
    csvContent = 'Invoice Number,Order Reference,Customer,Phone,Email,Date,Payment Method,Subtotal,Discount,Total\n';
    (db.invoices || []).forEach((inv) => {
      const invDate = inv.orderDate || inv.createdAt || '';
      const dateOnly = invDate.includes('T') ? invDate.split('T')[0] : invDate;
      csvContent += `"${inv.invoiceNumber}","${inv.orderNumber || ''}","${inv.customerName}","${inv.customerPhone || ''}","${inv.customerEmail || ''}","${dateOnly}","${inv.paymentMethod}",${inv.subtotal},${inv.discount},${inv.total}\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

export default router;
