import { Pool } from '@neondatabase/serverless';
import type { DatabaseSchema, SyncEvent } from '../db.js';
import type {
  Product,
  Category,
  Order,
  Coupon,
  NotificationRecord,
  CustomerQuery,
  InventoryTransaction,
  InvoiceRecord,
} from '../../src/types.js';

let poolInstance: Pool | null = null;
let isConnected = false;
let schemaInitialized = false;
let schemaInitPromise: Promise<boolean> | null = null;

export function getNeonDatabaseUrl(): string | null {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRESQL_URL;

  return url || null;
}

export function isNeonConfigured(): boolean {
  return Boolean(getNeonDatabaseUrl());
}

export function getNeonPool(): Pool | null {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return null;

  if (!poolInstance) {
    try {
      poolInstance = new Pool({
        connectionString: dbUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    } catch (err: any) {
      console.error('[Neon PostgreSQL] Failed to create connection pool:', err.message);
      return null;
    }
  }

  return poolInstance;
}

export async function executeNeonQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return (result.rows || []) as T[];
  } finally {
    client.release();
  }
}

/**
 * Initializes all required PostgreSQL tables, indexes, and constraints for FAWNIC Atelier
 * and ensures initial catalog data is seeded so the permanent store is never empty.
 */
export async function initializeNeonSchema(): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;
  if (schemaInitialized) return true;
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = (async () => {
    try {
      const pool = getNeonPool();
      if (!pool) return false;

      const client = await pool.connect();
      try {
        console.info('[Neon PostgreSQL] Verifying production schemas and tables for FAWNIC...');

        await client.query(`
          -- Users and Staff Table
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(64) DEFAULT '',
            role VARCHAR(32) NOT NULL DEFAULT 'customer',
            avatar TEXT DEFAULT '',
            address TEXT DEFAULT '',
            city VARCHAR(128) DEFAULT '',
            postal_code VARCHAR(32) DEFAULT '',
            notes TEXT DEFAULT '',
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Categories Table
          CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            icon VARCHAR(64) DEFAULT 'Folder',
            banner TEXT DEFAULT '',
            image TEXT DEFAULT '',
            description TEXT DEFAULT '',
            featured BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            display_order INT DEFAULT 0,
            subcategories JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Products Table
          CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            sku VARCHAR(128) UNIQUE NOT NULL,
            description TEXT DEFAULT '',
            short_description TEXT DEFAULT '',
            category_id VARCHAR(64),
            category_name VARCHAR(255) DEFAULT '',
            subcategory VARCHAR(255) DEFAULT '',
            regular_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
            sale_price NUMERIC(12, 2),
            cost_price NUMERIC(12, 2) DEFAULT 0,
            stock INT NOT NULL DEFAULT 0,
            low_stock_threshold INT DEFAULT 5,
            leather_type VARCHAR(128) DEFAULT '',
            finish VARCHAR(128) DEFAULT '',
            color VARCHAR(128) DEFAULT '',
            dimensions VARCHAR(128) DEFAULT '',
            weight VARCHAR(64) DEFAULT '',
            features JSONB DEFAULT '[]'::jsonb,
            tags JSONB DEFAULT '[]'::jsonb,
            images JSONB DEFAULT '[]'::jsonb,
            main_image TEXT DEFAULT '',
            is_active BOOLEAN DEFAULT TRUE,
            is_featured BOOLEAN DEFAULT FALSE,
            is_new BOOLEAN DEFAULT FALSE,
            order_count INT DEFAULT 0,
            views_count INT DEFAULT 0,
            rating NUMERIC(3, 2) DEFAULT 5.0,
            review_count INT DEFAULT 0,
            variations JSONB DEFAULT '[]'::jsonb,
            brand VARCHAR(128) DEFAULT 'FAWNIC',
            status VARCHAR(32) DEFAULT 'published',
            has_variations BOOLEAN DEFAULT FALSE,
            variants JSONB DEFAULT '[]'::jsonb,
            specifications JSONB DEFAULT '{}'::jsonb,
            care_instructions TEXT DEFAULT '',
            is_best_seller BOOLEAN DEFAULT FALSE,
            is_new_arrival BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Orders Table
          CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(64) PRIMARY KEY,
            order_number VARCHAR(64) UNIQUE NOT NULL,
            customer_id VARCHAR(64),
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(64) DEFAULT '',
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
            billing_address JSONB DEFAULT '{}'::jsonb,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            payment_method VARCHAR(64) DEFAULT 'cod',
            payment_status VARCHAR(32) DEFAULT 'pending',
            subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
            discount NUMERIC(12, 2) DEFAULT 0,
            shipping_cost NUMERIC(12, 2) DEFAULT 0,
            tax NUMERIC(12, 2) DEFAULT 0,
            total NUMERIC(12, 2) NOT NULL DEFAULT 0,
            coupon_code VARCHAR(64) DEFAULT '',
            notes TEXT DEFAULT '',
            tracking_number VARCHAR(128) DEFAULT '',
            courier VARCHAR(128) DEFAULT '',
            courier_name VARCHAR(128) DEFAULT '',
            timeline JSONB DEFAULT '[]'::jsonb,
            tracking_history JSONB DEFAULT '[]'::jsonb,
            payment_proof TEXT DEFAULT '',
            bank_tx_ref VARCHAR(128) DEFAULT '',
            internal_notes TEXT DEFAULT '',
            dispatch_date VARCHAR(64) DEFAULT '',
            delivery_date VARCHAR(64) DEFAULT '',
            expected_delivery VARCHAR(64) DEFAULT '',
            cashback_amount NUMERIC(12, 2) DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Customer Queries (Support CRM) Table
          CREATE TABLE IF NOT EXISTS customer_queries (
            id VARCHAR(64) PRIMARY KEY,
            ticket_number VARCHAR(64) UNIQUE NOT NULL,
            query_number VARCHAR(64) DEFAULT '',
            customer_id VARCHAR(64),
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(64) DEFAULT '',
            subject VARCHAR(255) NOT NULL,
            category VARCHAR(64) DEFAULT 'General',
            message TEXT NOT NULL,
            messages JSONB DEFAULT '[]'::jsonb,
            status VARCHAR(32) NOT NULL DEFAULT 'new',
            priority VARCHAR(32) DEFAULT 'normal',
            order_number VARCHAR(64) DEFAULT '',
            audit_timeline JSONB DEFAULT '[]'::jsonb,
            internal_notes TEXT DEFAULT '',
            is_deleted BOOLEAN DEFAULT FALSE,
            is_archived BOOLEAN DEFAULT FALSE,
            is_read_by_customer BOOLEAN DEFAULT TRUE,
            is_read_by_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Notifications Table
          CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(64) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(64) DEFAULT 'General',
            audience VARCHAR(64) DEFAULT 'all',
            target_user_id VARCHAR(64),
            target_user_ids JSONB DEFAULT '[]'::jsonb,
            target_user_names JSONB DEFAULT '[]'::jsonb,
            link TEXT DEFAULT '',
            button_text VARCHAR(128) DEFAULT '',
            image TEXT DEFAULT '',
            status VARCHAR(32) DEFAULT 'published',
            scheduled_at TIMESTAMPTZ,
            published_at TIMESTAMPTZ,
            expires_at TIMESTAMPTZ,
            is_published BOOLEAN DEFAULT TRUE,
            is_automated BOOLEAN DEFAULT FALSE,
            created_by VARCHAR(255) DEFAULT 'System',
            read_by JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Coupons Table
          CREATE TABLE IF NOT EXISTS coupons (
            id VARCHAR(64) PRIMARY KEY,
            code VARCHAR(64) UNIQUE NOT NULL,
            type VARCHAR(32) NOT NULL DEFAULT 'percentage',
            value NUMERIC(10, 2) NOT NULL DEFAULT 0,
            min_order_amount NUMERIC(10, 2) DEFAULT 0,
            max_discount NUMERIC(10, 2),
            usage_limit INT DEFAULT 100,
            used_count INT DEFAULT 0,
            per_user_limit INT DEFAULT 1,
            is_active BOOLEAN DEFAULT TRUE,
            expires_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Media Uploads Table (ImageKit Media Metadata)
          CREATE TABLE IF NOT EXISTS media_uploads (
            id VARCHAR(64) PRIMARY KEY,
            file_name VARCHAR(255) NOT NULL,
            file_key VARCHAR(512) NOT NULL,
            bucket VARCHAR(128) NOT NULL DEFAULT 'imagekit',
            url TEXT NOT NULL,
            content_type VARCHAR(128) DEFAULT 'image/jpeg',
            size_bytes BIGINT DEFAULT 0,
            uploaded_by VARCHAR(255) DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Invoices Table
          CREATE TABLE IF NOT EXISTS invoices (
            id VARCHAR(64) PRIMARY KEY,
            invoice_number VARCHAR(64) UNIQUE NOT NULL,
            order_id VARCHAR(64),
            order_number VARCHAR(64) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(64) DEFAULT '',
            customer_address TEXT DEFAULT '',
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
            shipping_fee NUMERIC(12, 2) DEFAULT 0,
            discount NUMERIC(12, 2) DEFAULT 0,
            total NUMERIC(12, 2) NOT NULL DEFAULT 0,
            payment_method VARCHAR(64) DEFAULT '',
            payment_status VARCHAR(32) DEFAULT 'pending',
            status VARCHAR(32) DEFAULT 'issued',
            order_date TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Inventory Transactions Table
          CREATE TABLE IF NOT EXISTS inventory_transactions (
            id VARCHAR(64) PRIMARY KEY,
            product_id VARCHAR(64) NOT NULL,
            product_name VARCHAR(255) DEFAULT '',
            sku VARCHAR(128) DEFAULT '',
            change INT NOT NULL,
            previous_stock INT NOT NULL,
            new_stock INT NOT NULL,
            reason VARCHAR(255) DEFAULT '',
            admin_email VARCHAR(255) DEFAULT '',
            reference_id VARCHAR(128) DEFAULT '',
            notes TEXT DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- App Settings Table (Key/Value store for CMS, policies, settings)
          CREATE TABLE IF NOT EXISTS app_settings (
            key VARCHAR(64) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Realtime Sync Events Table
          CREATE TABLE IF NOT EXISTS sync_events (
            id VARCHAR(64) PRIMARY KEY,
            event_type VARCHAR(64) NOT NULL,
            action VARCHAR(64) DEFAULT '',
            payload JSONB DEFAULT '{}'::jsonb,
            timestamp BIGINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Indexes for fast queries
          CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
          CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
          CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
          CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
          CREATE INDEX IF NOT EXISTS idx_queries_customer ON customer_queries(customer_id);
          CREATE INDEX IF NOT EXISTS idx_queries_status ON customer_queries(status);
          CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_user_id);
          CREATE INDEX IF NOT EXISTS idx_sync_events_timestamp ON sync_events(timestamp);

          -- Safe schema migrations
          ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(128) DEFAULT 'FAWNIC';
          ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'published';
          ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variations BOOLEAN DEFAULT FALSE;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS care_instructions TEXT DEFAULT '';
          ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT FALSE;
          ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;

          ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_history JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof TEXT DEFAULT '';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS bank_tx_ref VARCHAR(128) DEFAULT '';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(128) DEFAULT '';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT '';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatch_date VARCHAR(64) DEFAULT '';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date VARCHAR(64) DEFAULT '';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS expected_delivery VARCHAR(64) DEFAULT '';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS cashback_amount NUMERIC(12, 2) DEFAULT 0;

          ALTER TABLE customer_queries ADD COLUMN IF NOT EXISTS query_number VARCHAR(64) DEFAULT '';
          ALTER TABLE customer_queries ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE customer_queries ADD COLUMN IF NOT EXISTS audit_timeline JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE customer_queries ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT '';
          ALTER TABLE customer_queries ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
          ALTER TABLE customer_queries ADD COLUMN IF NOT EXISTS is_read_by_customer BOOLEAN DEFAULT TRUE;
          ALTER TABLE customer_queries ADD COLUMN IF NOT EXISTS is_read_by_admin BOOLEAN DEFAULT FALSE;

          ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_user_ids JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_user_names JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'published';
          ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
          ALTER TABLE notifications ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
          ALTER TABLE notifications ADD COLUMN IF NOT EXISTS button_text VARCHAR(128) DEFAULT '';
          ALTER TABLE notifications ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '';

          ALTER TABLE coupons ADD COLUMN IF NOT EXISTS per_user_limit INT DEFAULT 1;

          -- Resilient columns & constraint alterations
          ALTER TABLE products ALTER COLUMN sku DROP NOT NULL;
          ALTER TABLE products ALTER COLUMN slug DROP NOT NULL;
          ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
          ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type VARCHAR(32) DEFAULT 'order';
          ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax NUMERIC(12, 2) DEFAULT 0;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS salt TEXT DEFAULT '';

          -- Essential Categories Seeding
          INSERT INTO categories (id, name, slug, icon, banner, description, featured, is_active, display_order, subcategories, created_at, updated_at)
          VALUES
            ('cat_wallets', 'Men''s Wallets', 'wallets', 'Wallet', '/assets/images/cat_mens_wallet_v2_1790449008902.jpg', 'Quality leather wallets designed for easy everyday carry.', true, true, 1, '["Bifold Wallets", "Slim Front-Pocket", "Long Continental", "RFID Wallets", "Zipper Wallets"]'::jsonb, NOW(), NOW()),
            ('cat_belts', 'Men''s Belts', 'belts', 'Shield', '/assets/images/cat_mens_belt_v2_1790449023189.jpg', 'Strong leather belts with solid hardware that lasts.', true, true, 2, '["Formal Dress Belts", "Casual Harness Belts", "Reversible Belts", "Braided Belts"]'::jsonb, NOW(), NOW()),
            ('cat_watches', 'Premium Watches', 'watches', 'Clock', '/assets/images/cat_luxury_watch_v2_1790449038082.jpg', 'Classic timepieces with leather straps and precision movements.', true, true, 3, '["Automatic Chronographs", "Field Timepieces", "Dress Watches", "Exhibition Calibers"]'::jsonb, NOW(), NOW()),
            ('cat_cardholders', 'Card Holders', 'card-holders', 'CreditCard', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1000&auto=format&fit=crop&q=85', 'Ultra-thin card sleeves and accordion cases for seamless everyday carry.', false, true, 4, '["Minimalist Sleeves", "Accordion Cases", "Lanyard ID Holders"]'::jsonb, NOW(), NOW()),
            ('cat_accessories', 'Leather Accessories', 'accessories', 'Package', 'https://images.unsplash.com/photo-1563903530908-afdd155d057a?w=1000&auto=format&fit=crop&q=85', 'Key cloches, valet catchall trays, travel watch rolls, and heirloom gift box ensembles.', false, true, 5, '["Heirloom Gift Sets", "Valet Trays", "Key Accessories", "Watch Rolls"]'::jsonb, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            icon = EXCLUDED.icon,
            banner = EXCLUDED.banner,
            description = EXCLUDED.description,
            subcategories = EXCLUDED.subcategories,
            updated_at = NOW();
        `);

        // Check if coupons table is empty. If so, seed initial coupons.
        const cpnCountRes = await client.query('SELECT count(*) as count FROM coupons');
        const cpnCount = parseInt(cpnCountRes.rows[0]?.count || '0', 10);
        if (cpnCount === 0) {
          try {
            const { getInitialDatabase } = await import('../db.js');
            const initialData = getInitialDatabase();
            if (initialData && Array.isArray(initialData.coupons) && initialData.coupons.length > 0) {
              for (const c of initialData.coupons) {
                await client.query(
                  `INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount, usage_limit, used_count, per_user_limit, is_active, expires_at, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                   ON CONFLICT (id) DO NOTHING`,
                  [
                    c.id,
                    c.code,
                    c.type || 'percentage',
                    Number(c.value) || 0,
                    Number(c.minOrderAmount) || 0,
                    c.maxDiscount ? Number(c.maxDiscount) : null,
                    Number(c.usageLimit) || 100,
                    Number(c.usedCount) || 0,
                    Number(c.perUserLimit) || 1,
                    Boolean(c.isActive),
                    c.expiresAt ? new Date(c.expiresAt) : null,
                  ]
                );
              }
            }
          } catch {}
        }
      } finally {
        client.release();
      }

      schemaInitialized = true;
      isConnected = true;
      console.info('[Neon PostgreSQL] Schema successfully verified and ready.');
      return true;
    } catch (err: any) {
      console.error('[Neon PostgreSQL] Schema initialization warning:', err.message);
      schemaInitialized = true;
      return true;
    }
  })();

  return schemaInitPromise;
}

/**
 * Transforms a raw PostgreSQL products row into a FAWNIC Product object
 */
export function rowToProduct(row: any): Product {
  const images = Array.isArray(row.images)
    ? row.images
    : (typeof row.images === 'string'
        ? (row.images.startsWith('[') ? JSON.parse(row.images) : [row.images])
        : (row.main_image ? [row.main_image] : []));

  const features = Array.isArray(row.features)
    ? row.features
    : (typeof row.features === 'string' && row.features.startsWith('[') ? JSON.parse(row.features) : []);

  const tags = Array.isArray(row.tags)
    ? row.tags
    : (typeof row.tags === 'string' && row.tags.startsWith('[') ? JSON.parse(row.tags) : []);

  const variations = Array.isArray(row.variations)
    ? row.variations
    : (typeof row.variations === 'string' && row.variations.startsWith('[') ? JSON.parse(row.variations) : []);

  const variants = Array.isArray(row.variants)
    ? row.variants
    : (typeof row.variants === 'string' && row.variants.startsWith('[') ? JSON.parse(row.variants) : []);

  let specifications = {};
  if (typeof row.specifications === 'object' && row.specifications !== null) {
    specifications = row.specifications;
  } else if (typeof row.specifications === 'string' && row.specifications.startsWith('{')) {
    try {
      specifications = JSON.parse(row.specifications);
    } catch {}
  }

  const stock = Number(row.stock) || 0;
  const lowStockThreshold = Number(row.low_stock_threshold) || 5;
  const regularPrice = Number(row.regular_price) || 0;
  const salePrice = row.sale_price !== null && row.sale_price !== undefined ? Number(row.sale_price) : regularPrice;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    description: row.description || '',
    shortDescription: row.short_description || '',
    categoryId: row.category_id || '',
    categoryName: row.category_name || '',
    subcategoryId: row.subcategory || undefined,
    subcategoryName: row.subcategory || undefined,
    subcategory: row.subcategory || undefined,
    regularPrice,
    salePrice,
    costPrice: row.cost_price !== null && row.cost_price !== undefined ? Number(row.cost_price) : undefined,
    stock,
    lowStockThreshold,
    stockStatus: stock <= 0 ? 'out_of_stock' : (stock <= lowStockThreshold ? 'low_stock' : 'in_stock'),
    leatherType: row.leather_type || '',
    mainImage: row.main_image || (images[0] || ''),
    images: images.length ? images : (row.main_image ? [row.main_image] : []),
    features,
    tags,
    variations,
    variants,
    specifications,
    careInstructions: row.care_instructions || undefined,
    isFeatured: Boolean(row.is_featured),
    isBestSeller: Boolean(row.is_best_seller),
    isNewArrival: Boolean(row.is_new_arrival || row.is_new),
    hasVariations: Boolean(row.has_variations),
    status: (row.status || (row.is_active ? 'published' : 'draft')) as 'published' | 'draft' | 'archived',
    brand: row.brand || 'FAWNIC',
    rating: Number(row.rating) || 5.0,
    reviewCount: Number(row.review_count) || 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

// =========================================================================
// PRODUCTS OPERATIONS
// =========================================================================

async function insertProductDirect(client: any, p: Product): Promise<Product> {
  // Ensure category exists
  if (p.categoryId) {
    await client.query(
      `INSERT INTO categories (id, name, slug, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [p.categoryId, p.categoryName || "Men's Wallets", p.categoryId.replace('cat_', '')]
    ).catch(() => {});
  }

  // Ensure safe, unique slug
  let uniqueSlug =
    p.slug?.trim() ||
    p.name?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') ||
    `fwn-${Date.now()}`;
  const existingSlug = await client.query('SELECT id FROM products WHERE slug = $1 AND id != $2 LIMIT 1', [uniqueSlug, p.id]);
  if (existingSlug.rows && existingSlug.rows.length > 0) {
    uniqueSlug = `${uniqueSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  // Ensure safe, unique sku
  let uniqueSku =
    p.sku?.trim() ||
    `FWN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const existingSku = await client.query('SELECT id FROM products WHERE sku = $1 AND id != $2 LIMIT 1', [uniqueSku, p.id]);
  if (existingSku.rows && existingSku.rows.length > 0) {
    uniqueSku = `${uniqueSku}-${Date.now().toString().slice(-4)}`;
  }

  const query = `
    INSERT INTO products (
      id, name, slug, sku, description, short_description,
      category_id, category_name, subcategory,
      regular_price, sale_price, cost_price,
      stock, low_stock_threshold,
      leather_type, finish, color, dimensions, weight,
      features, tags, images, main_image,
      is_active, is_featured, is_new,
      order_count, views_count, rating, review_count,
      variations, brand, status, has_variations, variants, specifications,
      care_instructions, is_best_seller, is_new_arrival,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9,
      $10, $11, $12,
      $13, $14,
      $15, $16, $17, $18, $19,
      $20, $21, $22, $23,
      $24, $25, $26,
      $27, $28, $29, $30,
      $31, $32, $33, $34, $35, $36,
      $37, $38, $39,
      $40, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      sku = EXCLUDED.sku,
      description = EXCLUDED.description,
      short_description = EXCLUDED.short_description,
      category_id = EXCLUDED.category_id,
      category_name = EXCLUDED.category_name,
      subcategory = EXCLUDED.subcategory,
      regular_price = EXCLUDED.regular_price,
      sale_price = EXCLUDED.sale_price,
      cost_price = EXCLUDED.cost_price,
      stock = EXCLUDED.stock,
      low_stock_threshold = EXCLUDED.low_stock_threshold,
      leather_type = EXCLUDED.leather_type,
      finish = EXCLUDED.finish,
      color = EXCLUDED.color,
      dimensions = EXCLUDED.dimensions,
      weight = EXCLUDED.weight,
      features = EXCLUDED.features,
      tags = EXCLUDED.tags,
      images = EXCLUDED.images,
      main_image = EXCLUDED.main_image,
      is_active = EXCLUDED.is_active,
      is_featured = EXCLUDED.is_featured,
      is_new = EXCLUDED.is_new,
      order_count = EXCLUDED.order_count,
      views_count = EXCLUDED.views_count,
      rating = EXCLUDED.rating,
      review_count = EXCLUDED.review_count,
      variations = EXCLUDED.variations,
      brand = EXCLUDED.brand,
      status = EXCLUDED.status,
      has_variations = EXCLUDED.has_variations,
      variants = EXCLUDED.variants,
      specifications = EXCLUDED.specifications,
      care_instructions = EXCLUDED.care_instructions,
      is_best_seller = EXCLUDED.is_best_seller,
      is_new_arrival = EXCLUDED.is_new_arrival,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    p.id,
    p.name,
    uniqueSlug,
    uniqueSku,
    p.description || '',
    p.shortDescription || '',
    p.categoryId || null,
    p.categoryName || '',
    p.subcategory || p.subcategoryId || '',
    Number(p.regularPrice) || 0,
    p.salePrice !== undefined && p.salePrice !== null ? Number(p.salePrice) : Number(p.regularPrice) || 0,
    p.costPrice !== undefined && p.costPrice !== null ? Number(p.costPrice) : null,
    Number(p.stock) || 0,
    Number(p.lowStockThreshold) || 5,
    p.leatherType || '',
    (p as any).finish || '',
    (p as any).color || '',
    (p as any).dimensions || '',
    (p as any).weight || '',
    JSON.stringify(p.features || []),
    JSON.stringify(p.tags || []),
    JSON.stringify(p.images && p.images.length ? p.images : [p.mainImage || '']),
    p.mainImage || '',
    p.status === 'published',
    Boolean(p.isFeatured),
    Boolean(p.isNewArrival),
    (p as any).orderCount || 0,
    (p as any).viewsCount || 0,
    Number(p.rating) || 5.0,
    Number(p.reviewCount) || 0,
    JSON.stringify(p.variations || []),
    p.brand || 'FAWNIC',
    p.status || 'published',
    Boolean(p.hasVariations),
    JSON.stringify(p.variants || []),
    JSON.stringify(p.specifications || {}),
    p.careInstructions || '',
    Boolean(p.isBestSeller),
    Boolean(p.isNewArrival),
    p.createdAt ? new Date(p.createdAt) : new Date(),
  ];

  const res = await client.query(query, values);
  if (!res.rows || res.rows.length === 0) {
    throw new Error('Insert into products returned no rows');
  }

  return rowToProduct(res.rows[0]);
}

export async function insertProductInNeon(p: Product): Promise<Product> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const client = await pool.connect();
  try {
    return await insertProductDirect(client, p);
  } finally {
    client.release();
  }
}

export async function updateProductInNeon(id: string, updates: Partial<Product>): Promise<Product> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const client = await pool.connect();
  try {
    const existingRes = await client.query('SELECT * FROM products WHERE id = $1 LIMIT 1', [id]);
    let existingProduct: Product;
    if (existingRes.rows && existingRes.rows.length > 0) {
      existingProduct = rowToProduct(existingRes.rows[0]);
    } else {
      existingProduct = {
        id,
        name: updates.name || 'Untitled Article',
        slug: updates.slug || `product-${id}`,
        sku: updates.sku || `FWN-${id}`,
        description: '',
        shortDescription: '',
        categoryId: updates.categoryId || 'cat_wallets',
        categoryName: updates.categoryName || "Men's Wallets",
        regularPrice: updates.regularPrice || 0,
        salePrice: updates.salePrice || updates.regularPrice || 0,
        stock: updates.stock || 0,
        lowStockThreshold: 5,
        stockStatus: 'in_stock',
        mainImage: updates.mainImage || '',
        images: updates.images || [],
        tags: [],
        variants: [],
        features: [],
        specifications: {},
        rating: 5,
        reviewCount: 0,
        isFeatured: false,
        isBestSeller: false,
        isNewArrival: false,
        status: 'published',
        brand: 'FAWNIC',
        createdAt: new Date().toISOString(),
      };
    }

    const merged: Product = {
      ...existingProduct,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return await insertProductDirect(client, merged);
  } finally {
    client.release();
  }
}

export async function deleteProductInNeon(id: string): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error deleting product:', err.message);
    throw err;
  }
}

export async function deleteProductsInNeon(ids: string[]): Promise<boolean> {
  if (!Array.isArray(ids) || ids.length === 0) return true;
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    await pool.query('DELETE FROM products WHERE id = ANY($1::varchar[])', [ids]);
    return true;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error bulk deleting products in Neon:', err.message);
    throw err;
  }
}

export async function getProductsFromNeon(): Promise<Product[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return [];

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return [];

    const res = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    return (res.rows || []).map(rowToProduct);
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error querying products from Neon:', err.message);
    return [];
  }
}

// =========================================================================
// CATEGORIES OPERATIONS
// =========================================================================

export async function getCategoriesFromNeon(): Promise<Category[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return [];

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return [];

    const res = await pool.query('SELECT * FROM categories ORDER BY display_order ASC, created_at ASC');
    return (res.rows || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon: row.icon || 'Folder',
      banner: row.banner || '',
      image: row.image || row.banner || '',
      description: row.description || '',
      featured: Boolean(row.featured),
      isActive: Boolean(row.is_active),
      order: Number(row.display_order) || 0,
      subcategories: Array.isArray(row.subcategories)
        ? row.subcategories
        : (typeof row.subcategories === 'string' && row.subcategories.startsWith('[')
            ? JSON.parse(row.subcategories)
            : []),
    }));
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error querying categories from Neon:', err.message);
    return [];
  }
}

export async function insertCategoryInNeon(cat: Category): Promise<Category> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  // Ensure unique slug
  let uniqueSlug = cat.slug;
  const existing = await pool.query('SELECT id FROM categories WHERE slug = $1 AND id != $2 LIMIT 1', [uniqueSlug, cat.id]);
  if (existing.rows && existing.rows.length > 0) {
    uniqueSlug = `${cat.slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const query = `
    INSERT INTO categories (
      id, name, slug, icon, banner, image, description,
      featured, is_active, display_order, subcategories,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      icon = EXCLUDED.icon,
      banner = EXCLUDED.banner,
      image = EXCLUDED.image,
      description = EXCLUDED.description,
      featured = EXCLUDED.featured,
      is_active = EXCLUDED.is_active,
      display_order = EXCLUDED.display_order,
      subcategories = EXCLUDED.subcategories,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    cat.id,
    cat.name,
    uniqueSlug,
    cat.icon || 'Folder',
    cat.banner || '',
    cat.image || cat.banner || '',
    cat.description || '',
    Boolean(cat.featured),
    cat.isActive !== false,
    Number(cat.order) || 0,
    JSON.stringify(cat.subcategories || []),
  ];

  const res = await pool.query(query, values);
  const row = res.rows[0];
  return {
    ...cat,
    slug: row.slug,
    name: row.name,
  };
}

export async function updateCategoryInNeon(id: string, updates: Partial<Category>): Promise<Category> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const existingRes = await pool.query('SELECT * FROM categories WHERE id = $1 LIMIT 1', [id]);
  const existingRow = existingRes.rows[0];

  const merged: Category = {
    id,
    name: updates.name !== undefined ? updates.name : (existingRow?.name || 'Category'),
    slug: updates.slug !== undefined ? updates.slug : (existingRow?.slug || id),
    icon: updates.icon !== undefined ? updates.icon : (existingRow?.icon || 'Folder'),
    banner: updates.banner !== undefined ? updates.banner : (existingRow?.banner || ''),
    image: updates.image !== undefined ? updates.image : (existingRow?.image || ''),
    description: updates.description !== undefined ? updates.description : (existingRow?.description || ''),
    featured: updates.featured !== undefined ? updates.featured : Boolean(existingRow?.featured),
    isActive: updates.isActive !== undefined ? updates.isActive : Boolean(existingRow?.is_active),
    order: updates.order !== undefined ? Number(updates.order) : Number(existingRow?.display_order || 0),
    subcategories: updates.subcategories !== undefined ? updates.subcategories : (existingRow?.subcategories || []),
  };

  return await insertCategoryInNeon(merged);
}

export async function deleteCategoryInNeon(id: string): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error deleting category from Neon:', err.message);
    throw err;
  }
}

// =========================================================================
// ORDERS OPERATIONS
// =========================================================================

export async function getOrdersFromNeon(): Promise<Order[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return [];

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return [];

    const res = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    return (res.rows || []).map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      customerId: row.customer_id || undefined,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone || '',
      items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
      shippingAddress: typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : (row.shipping_address || {}),
      billingAddress: typeof row.billing_address === 'string' ? JSON.parse(row.billing_address) : (row.billing_address || {}),
      status: row.status,
      paymentMethod: row.payment_method || 'cod',
      paymentStatus: row.payment_status || 'pending',
      subtotal: Number(row.subtotal) || 0,
      shippingFee: Number(row.shipping_cost) || 0,
      discount: Number(row.discount) || 0,
      total: Number(row.total) || 0,
      couponCode: row.coupon_code || undefined,
      notes: row.notes || undefined,
      trackingNumber: row.tracking_number || undefined,
      courier: row.courier || undefined,
      courierName: row.courier_name || row.courier || undefined,
      timeline: typeof row.timeline === 'string' ? JSON.parse(row.timeline) : (row.timeline || []),
      trackingHistory: typeof row.tracking_history === 'string' ? JSON.parse(row.tracking_history) : (row.tracking_history || []),
      paymentProof: row.payment_proof || undefined,
      bankTxRef: row.bank_tx_ref || undefined,
      internalNotes: row.internal_notes || undefined,
      dispatchDate: row.dispatch_date || undefined,
      deliveryDate: row.delivery_date || undefined,
      expectedDelivery: row.expected_delivery || undefined,
      cashbackAmount: Number(row.cashback_amount) || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    }));
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error querying orders from Neon:', err.message);
    return [];
  }
}

export async function insertOrderInNeon(order: Order): Promise<Order> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const query = `
    INSERT INTO orders (
      id, order_number, customer_id, customer_name, customer_email, customer_phone,
      items, shipping_address, billing_address, status, payment_method, payment_status,
      subtotal, discount, shipping_cost, total, coupon_code, notes,
      tracking_number, courier, courier_name, timeline, tracking_history,
      payment_proof, bank_tx_ref, internal_notes, dispatch_date, delivery_date, expected_delivery,
      cashback_amount, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18,
      $19, $20, $21, $22, $23,
      $24, $25, $26, $27, $28, $29,
      $30, $31, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      order_number = EXCLUDED.order_number,
      customer_name = EXCLUDED.customer_name,
      customer_email = EXCLUDED.customer_email,
      customer_phone = EXCLUDED.customer_phone,
      items = EXCLUDED.items,
      shipping_address = EXCLUDED.shipping_address,
      billing_address = EXCLUDED.billing_address,
      status = EXCLUDED.status,
      payment_method = EXCLUDED.payment_method,
      payment_status = EXCLUDED.payment_status,
      subtotal = EXCLUDED.subtotal,
      discount = EXCLUDED.discount,
      shipping_cost = EXCLUDED.shipping_cost,
      total = EXCLUDED.total,
      coupon_code = EXCLUDED.coupon_code,
      notes = EXCLUDED.notes,
      tracking_number = EXCLUDED.tracking_number,
      courier = EXCLUDED.courier,
      courier_name = EXCLUDED.courier_name,
      timeline = EXCLUDED.timeline,
      tracking_history = EXCLUDED.tracking_history,
      payment_proof = EXCLUDED.payment_proof,
      bank_tx_ref = EXCLUDED.bank_tx_ref,
      internal_notes = EXCLUDED.internal_notes,
      dispatch_date = EXCLUDED.dispatch_date,
      delivery_date = EXCLUDED.delivery_date,
      expected_delivery = EXCLUDED.expected_delivery,
      cashback_amount = EXCLUDED.cashback_amount,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    order.id,
    order.orderNumber,
    order.customerId || null,
    order.customerName,
    order.customerEmail,
    order.customerPhone || '',
    JSON.stringify(order.items || []),
    JSON.stringify(order.shippingAddress || {}),
    JSON.stringify((order as any).billingAddress || {}),
    order.status || 'pending',
    order.paymentMethod || 'cod',
    order.paymentStatus || 'pending',
    Number(order.subtotal) || 0,
    Number(order.discount) || 0,
    Number(order.shippingFee) || 0,
    Number(order.total) || 0,
    order.couponCode || '',
    order.notes || '',
    order.trackingNumber || '',
    order.courier || '',
    order.courierName || order.courier || '',
    JSON.stringify(order.timeline || []),
    JSON.stringify(order.trackingHistory || []),
    order.paymentProof || '',
    order.bankTxRef || '',
    (order as any).internalNotes || '',
    (order as any).dispatchDate ? new Date((order as any).dispatchDate) : null,
    (order as any).deliveryDate ? new Date((order as any).deliveryDate) : null,
    (order as any).expectedDelivery ? String((order as any).expectedDelivery) : '',
    Number(order.cashbackAmount) || 0,
    order.createdAt ? new Date(order.createdAt) : new Date(),
  ];

  await pool.query(query, values);
  return order;
}

export async function updateOrderInNeon(idOrNumber: string, updates: Partial<Order>): Promise<Order | null> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const existingRes = await pool.query(
    'SELECT * FROM orders WHERE id = $1 OR order_number = $1 LIMIT 1',
    [idOrNumber]
  );
  if (!existingRes.rows || existingRes.rows.length === 0) return null;

  const existing = existingRes.rows[0];
  const merged: Order = {
    id: existing.id,
    orderNumber: existing.order_number,
    customerId: existing.customer_id,
    customerName: updates.customerName || existing.customer_name,
    customerEmail: updates.customerEmail || existing.customer_email,
    customerPhone: updates.customerPhone || existing.customer_phone || '',
    items: updates.items || (typeof existing.items === 'string' ? JSON.parse(existing.items) : existing.items),
    shippingAddress: updates.shippingAddress || (typeof existing.shipping_address === 'string' ? JSON.parse(existing.shipping_address) : existing.shipping_address),
    status: updates.status || existing.status,
    paymentMethod: updates.paymentMethod || existing.payment_method,
    paymentStatus: updates.paymentStatus || existing.payment_status,
    subtotal: updates.subtotal !== undefined ? Number(updates.subtotal) : Number(existing.subtotal),
    shippingFee: updates.shippingFee !== undefined ? Number(updates.shippingFee) : Number(existing.shipping_cost),
    discount: updates.discount !== undefined ? Number(updates.discount) : Number(existing.discount),
    total: updates.total !== undefined ? Number(updates.total) : Number(existing.total),
    couponCode: updates.couponCode !== undefined ? updates.couponCode : existing.coupon_code,
    notes: updates.notes !== undefined ? updates.notes : existing.notes,
    trackingNumber: updates.trackingNumber !== undefined ? updates.trackingNumber : existing.tracking_number,
    courier: updates.courier !== undefined ? updates.courier : existing.courier,
    courierName: updates.courierName !== undefined ? updates.courierName : existing.courier_name,
    timeline: updates.timeline || (typeof existing.timeline === 'string' ? JSON.parse(existing.timeline) : existing.timeline),
    trackingHistory: updates.trackingHistory || (typeof existing.tracking_history === 'string' ? JSON.parse(existing.tracking_history) : existing.tracking_history),
    paymentProof: updates.paymentProof !== undefined ? updates.paymentProof : existing.payment_proof,
    bankTxRef: updates.bankTxRef !== undefined ? updates.bankTxRef : existing.bank_tx_ref,
    internalNotes: (updates as any).internalNotes !== undefined ? (updates as any).internalNotes : existing.internal_notes,
    dispatchDate: (updates as any).dispatchDate !== undefined ? (updates as any).dispatchDate : existing.dispatch_date,
    deliveryDate: (updates as any).deliveryDate !== undefined ? (updates as any).deliveryDate : existing.delivery_date,
    expectedDelivery: (updates as any).expectedDelivery !== undefined ? (updates as any).expectedDelivery : existing.expected_delivery,
    cashbackAmount: updates.cashbackAmount !== undefined ? updates.cashbackAmount : Number(existing.cashback_amount),
    createdAt: existing.created_at ? new Date(existing.created_at).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return await insertOrderInNeon(merged);
}

export async function deleteOrderInNeon(idOrNumber: string): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    await pool.query('DELETE FROM orders WHERE id = $1 OR order_number = $1', [idOrNumber]);
    return true;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error deleting order from Neon:', err.message);
    throw err;
  }
}

// =========================================================================
// INVENTORY OPERATIONS
// =========================================================================

export async function adjustProductStockInNeon(
  productId: string,
  delta: number,
  reason: string,
  adminEmail: string,
  notes?: string
): Promise<{ product: Product; transaction: InventoryTransaction }> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const res = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId]);
    if (!res.rows || res.rows.length === 0) {
      throw new Error(`Product not found: ${productId}`);
    }

    const currentProd = rowToProduct(res.rows[0]);
    const previousStock = currentProd.stock;
    const newStock = Math.max(0, previousStock + delta);
    const stockStatus = newStock === 0 ? 'out_of_stock' : newStock <= currentProd.lowStockThreshold ? 'low_stock' : 'in_stock';

    await client.query(
      `UPDATE products SET stock = $1, is_active = $2, updated_at = NOW() WHERE id = $3`,
      [newStock, currentProd.status === 'published', productId]
    );

    const txnId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const txn: InventoryTransaction = {
      id: txnId,
      productId: currentProd.id,
      productName: currentProd.name,
      sku: currentProd.sku,
      change: delta,
      previousStock,
      newStock,
      reason: reason || 'Manual Adjustment',
      adminEmail: adminEmail || 'Admin',
      timestamp: new Date().toISOString(),
      notes: notes || undefined,
    };

    await client.query(
      `INSERT INTO inventory_transactions (id, product_id, product_name, sku, change, previous_stock, new_stock, reason, admin_email, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [txn.id, txn.productId, txn.productName, txn.sku, txn.change, txn.previousStock, txn.newStock, txn.reason, txn.adminEmail, txn.notes || '']
    );

    await client.query('COMMIT');

    const updatedProduct: Product = {
      ...currentProd,
      stock: newStock,
      stockStatus,
      updatedAt: new Date().toISOString(),
    };

    return { product: updatedProduct, transaction: txn };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function getInventoryTransactionsFromNeon(): Promise<InventoryTransaction[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return [];

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return [];

    const res = await pool.query('SELECT * FROM inventory_transactions ORDER BY created_at DESC LIMIT 200');
    return (res.rows || []).map((row: any) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      sku: row.sku,
      change: Number(row.change),
      previousStock: Number(row.previous_stock),
      newStock: Number(row.new_stock),
      reason: row.reason,
      adminEmail: row.admin_email,
      referenceId: row.reference_id || undefined,
      timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      notes: row.notes || undefined,
    }));
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error querying inventory transactions:', err.message);
    return [];
  }
}

// =========================================================================
// NOTIFICATIONS OPERATIONS
// =========================================================================

export async function getNotificationsFromNeon(): Promise<NotificationRecord[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return [];

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return [];

    const res = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    return (res.rows || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type || 'General',
      audience: row.audience || 'all',
      targetUserIds: typeof row.target_user_ids === 'string' ? JSON.parse(row.target_user_ids) : (row.target_user_ids || []),
      targetUserNames: typeof row.target_user_names === 'string' ? JSON.parse(row.target_user_names) : (row.target_user_names || []),
      link: row.link || undefined,
      buttonText: row.button_text || undefined,
      image: row.image || undefined,
      status: row.status || 'published',
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : undefined,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
      createdBy: row.created_by || 'Admin',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error querying notifications:', err.message);
    return [];
  }
}

export async function insertNotificationInNeon(notif: NotificationRecord): Promise<NotificationRecord> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const query = `
    INSERT INTO notifications (
      id, title, message, type, audience, target_user_ids, target_user_names,
      link, button_text, image, status, scheduled_at, published_at, expires_at,
      created_by, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14,
      $15, $16, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      message = EXCLUDED.message,
      type = EXCLUDED.type,
      audience = EXCLUDED.audience,
      target_user_ids = EXCLUDED.target_user_ids,
      target_user_names = EXCLUDED.target_user_names,
      link = EXCLUDED.link,
      button_text = EXCLUDED.button_text,
      image = EXCLUDED.image,
      status = EXCLUDED.status,
      scheduled_at = EXCLUDED.scheduled_at,
      published_at = EXCLUDED.published_at,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    notif.id,
    notif.title,
    notif.message,
    notif.type || 'General',
    notif.audience || 'all',
    JSON.stringify(notif.targetUserIds || []),
    JSON.stringify(notif.targetUserNames || []),
    notif.link || '',
    notif.buttonText || '',
    notif.image || '',
    notif.status || 'published',
    notif.scheduledAt ? new Date(notif.scheduledAt) : null,
    notif.publishedAt ? new Date(notif.publishedAt) : null,
    notif.expiresAt ? new Date(notif.expiresAt) : null,
    notif.createdBy || 'Admin',
    notif.createdAt ? new Date(notif.createdAt) : new Date(),
  ];

  await pool.query(query, values);
  return notif;
}

export async function updateNotificationInNeon(id: string, updates: Partial<NotificationRecord>): Promise<NotificationRecord | null> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const existingRes = await pool.query('SELECT * FROM notifications WHERE id = $1 LIMIT 1', [id]);
  if (!existingRes.rows || existingRes.rows.length === 0) return null;

  const existing = existingRes.rows[0];
  const merged: NotificationRecord = {
    id: existing.id,
    title: updates.title !== undefined ? updates.title : existing.title,
    message: updates.message !== undefined ? updates.message : existing.message,
    type: updates.type !== undefined ? updates.type : (existing.type || 'General'),
    audience: updates.audience !== undefined ? updates.audience : (existing.audience || 'all'),
    targetUserIds: updates.targetUserIds !== undefined ? updates.targetUserIds : (typeof existing.target_user_ids === 'string' ? JSON.parse(existing.target_user_ids) : existing.target_user_ids || []),
    targetUserNames: updates.targetUserNames !== undefined ? updates.targetUserNames : (typeof existing.target_user_names === 'string' ? JSON.parse(existing.target_user_names) : existing.target_user_names || []),
    link: updates.link !== undefined ? updates.link : existing.link,
    buttonText: updates.buttonText !== undefined ? updates.buttonText : existing.button_text,
    image: updates.image !== undefined ? updates.image : existing.image,
    status: updates.status !== undefined ? updates.status : (existing.status || 'published'),
    scheduledAt: updates.scheduledAt !== undefined ? updates.scheduledAt : (existing.scheduled_at ? new Date(existing.scheduled_at).toISOString() : undefined),
    publishedAt: updates.publishedAt !== undefined ? updates.publishedAt : (existing.published_at ? new Date(existing.published_at).toISOString() : undefined),
    expiresAt: updates.expiresAt !== undefined ? updates.expiresAt : (existing.expires_at ? new Date(existing.expires_at).toISOString() : undefined),
    createdBy: existing.created_by || 'Admin',
    createdAt: existing.created_at ? new Date(existing.created_at).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return await insertNotificationInNeon(merged);
}

export async function deleteNotificationInNeon(id: string): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error deleting notification from Neon:', err.message);
    throw err;
  }
}

// =========================================================================
// COUPONS OPERATIONS
// =========================================================================

export async function getCouponsFromNeon(): Promise<Coupon[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return [];

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return [];

    const res = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    return (res.rows || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      type: row.type || 'percentage',
      value: Number(row.value) || 0,
      minOrderAmount: Number(row.min_order_amount) || 0,
      maxDiscount: row.max_discount !== null ? Number(row.max_discount) : undefined,
      usageLimit: Number(row.usage_limit) || 100,
      usedCount: Number(row.used_count) || 0,
      perUserLimit: Number(row.per_user_limit) || 1,
      isActive: Boolean(row.is_active),
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
    }));
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error querying coupons from Neon:', err.message);
    return [];
  }
}

export async function insertCouponInNeon(coupon: Coupon): Promise<Coupon> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const query = `
    INSERT INTO coupons (
      id, code, type, value, min_order_amount, max_discount,
      usage_limit, used_count, per_user_limit, is_active, expires_at, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      code = EXCLUDED.code,
      type = EXCLUDED.type,
      value = EXCLUDED.value,
      min_order_amount = EXCLUDED.min_order_amount,
      max_discount = EXCLUDED.max_discount,
      usage_limit = EXCLUDED.usage_limit,
      used_count = EXCLUDED.used_count,
      per_user_limit = EXCLUDED.per_user_limit,
      is_active = EXCLUDED.is_active,
      expires_at = EXCLUDED.expires_at
    RETURNING *;
  `;

  const values = [
    coupon.id,
    coupon.code.trim().toUpperCase(),
    coupon.type || 'percentage',
    Number(coupon.value) || 0,
    Number(coupon.minOrderAmount) || 0,
    coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
    Number(coupon.usageLimit) || 100,
    Number(coupon.usedCount) || 0,
    Number(coupon.perUserLimit) || 1,
    coupon.isActive !== false,
    coupon.expiresAt ? new Date(coupon.expiresAt) : null,
  ];

  await pool.query(query, values);
  return coupon;
}

export async function deleteCouponInNeon(id: string): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    await pool.query('DELETE FROM coupons WHERE id = $1', [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error deleting coupon from Neon:', err.message);
    throw err;
  }
}

// =========================================================================
// CUSTOMER QUERIES OPERATIONS (CRM)
// =========================================================================

export async function getCustomerQueriesFromNeon(): Promise<CustomerQuery[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return [];

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return [];

    const res = await pool.query('SELECT * FROM customer_queries WHERE is_deleted = FALSE ORDER BY created_at DESC');
    return (res.rows || []).map((row: any) => ({
      id: row.id,
      ticketNumber: row.ticket_number,
      queryNumber: row.query_number || row.ticket_number,
      customerId: row.customer_id || '',
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone || '',
      subject: row.subject,
      category: row.category || 'General',
      message: row.message,
      messages: typeof row.messages === 'string' ? JSON.parse(row.messages) : (row.messages || []),
      status: row.status,
      priority: row.priority || 'normal',
      orderNumber: row.order_number || '',
      auditTimeline: typeof row.audit_timeline === 'string' ? JSON.parse(row.audit_timeline) : (row.audit_timeline || []),
      internalNotes: row.internal_notes || '',
      isArchived: Boolean(row.is_archived),
      isDeleted: Boolean(row.is_deleted),
      isReadByCustomer: Boolean(row.is_read_by_customer),
      isReadByAdmin: Boolean(row.is_read_by_admin),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error querying customer queries from Neon:', err.message);
    return [];
  }
}

export async function insertCustomerQueryInNeon(q: CustomerQuery): Promise<CustomerQuery> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const query = `
    INSERT INTO customer_queries (
      id, ticket_number, query_number, customer_id, customer_name, customer_email, customer_phone,
      subject, category, message, messages, status, priority, order_number,
      audit_timeline, internal_notes, is_deleted, is_archived, is_read_by_customer, is_read_by_admin,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14,
      $15, $16, $17, $18, $19, $20,
      $21, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      query_number = EXCLUDED.query_number,
      customer_name = EXCLUDED.customer_name,
      customer_email = EXCLUDED.customer_email,
      customer_phone = EXCLUDED.customer_phone,
      subject = EXCLUDED.subject,
      category = EXCLUDED.category,
      message = EXCLUDED.message,
      messages = EXCLUDED.messages,
      status = EXCLUDED.status,
      priority = EXCLUDED.priority,
      order_number = EXCLUDED.order_number,
      audit_timeline = EXCLUDED.audit_timeline,
      internal_notes = EXCLUDED.internal_notes,
      is_deleted = EXCLUDED.is_deleted,
      is_archived = EXCLUDED.is_archived,
      is_read_by_customer = EXCLUDED.is_read_by_customer,
      is_read_by_admin = EXCLUDED.is_read_by_admin,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    q.id,
    q.ticketNumber || q.queryNumber,
    q.queryNumber || q.ticketNumber,
    q.customerId || null,
    q.customerName,
    q.customerEmail,
    q.customerPhone || '',
    q.subject,
    q.category || 'General',
    q.message,
    JSON.stringify(q.messages || []),
    q.status || 'new',
    q.priority || 'normal',
    q.orderNumber || '',
    JSON.stringify(q.auditTimeline || []),
    q.internalNotes || '',
    Boolean(q.isDeleted),
    Boolean(q.isArchived),
    q.isReadByCustomer !== false,
    Boolean(q.isReadByAdmin),
    q.createdAt ? new Date(q.createdAt) : new Date(),
  ];

  await pool.query(query, values);
  return q;
}

export async function deleteCustomerQueryInNeon(id: string): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    await pool.query('UPDATE customer_queries SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1', [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error soft-deleting customer query in Neon:', err.message);
    throw err;
  }
}

// =========================================================================
// USERS / STAFF OPERATIONS
// =========================================================================

export async function updateUserInNeon(id: string, updates: any): Promise<void> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return;

    if (updates.name || updates.phone || updates.role || updates.notes) {
      await pool.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             role = COALESCE($3, role),
             notes = COALESCE($4, notes)
         WHERE id = $5`,
        [updates.name || null, updates.phone || null, updates.role || null, updates.notes || null, id]
      );
    }
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error updating user in Neon:', err.message);
  }
}

export async function deleteUserInNeon(id: string): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error deleting user in Neon:', err.message);
    throw err;
  }
}

export async function insertUserInNeon(user: any): Promise<void> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO users (id, email, name, phone, role, avatar, address, city, postal_code, notes, status, is_suspended, permissions, password_hash, salt, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role,
         avatar = EXCLUDED.avatar,
         notes = EXCLUDED.notes,
         status = EXCLUDED.status,
         is_suspended = EXCLUDED.is_suspended,
         permissions = EXCLUDED.permissions,
         password_hash = CASE WHEN EXCLUDED.password_hash != '' THEN EXCLUDED.password_hash ELSE users.password_hash END,
         salt = CASE WHEN EXCLUDED.salt != '' THEN EXCLUDED.salt ELSE users.salt END`,
      [
        user.id,
        user.email,
        user.name,
        user.phone || '',
        user.role || 'customer',
        user.avatar || '',
        user.address || '',
        user.city || '',
        user.postalCode || '',
        user.notes || '',
        user.status || 'active',
        Boolean(user.isSuspended),
        JSON.stringify(user.permissions || {}),
        user.passwordHash || '',
        user.salt || '',
      ]
    );
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error inserting/updating user in Neon:', err.message);
    throw err;
  }
}

// =========================================================================
// INVOICES OPERATIONS
// =========================================================================

export async function getInvoicesFromNeon(): Promise<InvoiceRecord[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return [];

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return [];

    const res = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    return (res.rows || []).map((row: any) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      type: (row.type as any) || 'order',
      orderId: row.order_id || undefined,
      orderNumber: row.order_number || undefined,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone || '',
      customerAddress: row.customer_address || '',
      items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
      subtotal: Number(row.subtotal) || 0,
      shippingFee: Number(row.shipping_cost ?? row.shipping_fee) || 0,
      discount: Number(row.discount) || 0,
      tax: Number(row.tax) || 0,
      total: Number(row.total) || 0,
      paymentMethod: row.payment_method || 'Cash on Delivery (COD)',
      paymentStatus: row.payment_status || 'pending',
      orderDate: row.due_date || row.order_date ? new Date(row.due_date || row.order_date).toISOString() : new Date().toISOString(),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      status: (row.status as any) || 'issued',
      notes: row.notes || undefined,
    }));
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error querying invoices from Neon:', err.message);
    return [];
  }
}

export async function insertInvoiceInNeon(inv: InvoiceRecord): Promise<InvoiceRecord> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) throw new Error('Neon database URL not configured');

  await initializeNeonSchema();
  const pool = getNeonPool();
  if (!pool) throw new Error('Neon database pool unavailable');

  const query = `
    INSERT INTO invoices (
      id, invoice_number, order_id, order_number, customer_name, customer_email,
      customer_phone, customer_address, items, subtotal, shipping_cost, discount,
      tax, total, payment_method, payment_status, status, due_date, created_at, notes, type
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18, $19, $20, $21
    )
    ON CONFLICT (id) DO UPDATE SET
      invoice_number = EXCLUDED.invoice_number,
      order_id = EXCLUDED.order_id,
      order_number = EXCLUDED.order_number,
      customer_name = EXCLUDED.customer_name,
      customer_email = EXCLUDED.customer_email,
      customer_phone = EXCLUDED.customer_phone,
      customer_address = EXCLUDED.customer_address,
      items = EXCLUDED.items,
      subtotal = EXCLUDED.subtotal,
      shipping_cost = EXCLUDED.shipping_cost,
      discount = EXCLUDED.discount,
      tax = EXCLUDED.tax,
      total = EXCLUDED.total,
      payment_method = EXCLUDED.payment_method,
      payment_status = EXCLUDED.payment_status,
      status = EXCLUDED.status,
      due_date = EXCLUDED.due_date,
      notes = EXCLUDED.notes,
      type = EXCLUDED.type
    RETURNING *;
  `;

  const values = [
    inv.id,
    inv.invoiceNumber,
    inv.orderId || null,
    inv.orderNumber || '',
    inv.customerName,
    inv.customerEmail,
    inv.customerPhone || '',
    inv.customerAddress || '',
    JSON.stringify(inv.items || []),
    Number(inv.subtotal) || 0,
    Number(inv.shippingFee) || 0,
    Number(inv.discount) || 0,
    Number(inv.tax) || 0,
    Number(inv.total) || 0,
    inv.paymentMethod || '',
    inv.paymentStatus || 'pending',
    inv.status || 'issued',
    inv.orderDate ? new Date(inv.orderDate) : new Date(),
    inv.createdAt ? new Date(inv.createdAt) : new Date(),
    inv.notes || '',
    inv.type || 'order',
  ];

  await pool.query(query, values);
  return inv;
}

export async function deleteInvoiceInNeon(idOrNumber: string): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    await pool.query('DELETE FROM invoices WHERE id = $1 OR invoice_number = $1', [idOrNumber]);
    return true;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error deleting invoice from Neon:', err.message);
    throw err;
  }
}

// =========================================================================
// APP SETTINGS / CMS / BUNDLE
// =========================================================================

export async function saveSettingInNeon(key: string, data: any): Promise<void> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO app_settings (key, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [key, JSON.stringify(data)]
    );
  } catch (err: any) {
    console.error(`[Neon PostgreSQL] Error saving setting key "${key}":`, err.message);
  }
}

export async function getSettingFromNeon(key: string): Promise<any | null> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return null;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return null;

    const res = await pool.query('SELECT data FROM app_settings WHERE key = $1 LIMIT 1', [key]);
    if (res.rows && res.rows.length > 0 && res.rows[0].data) {
      const d = res.rows[0].data;
      return typeof d === 'string' ? JSON.parse(d) : d;
    }
    return null;
  } catch (err: any) {
    console.error(`[Neon PostgreSQL] Error reading setting key "${key}":`, err.message);
    return null;
  }
}

export async function syncSchemaToNeon(db: DatabaseSchema): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    let productsToSave = db.products;
    try {
      const liveNeonProducts = await getProductsFromNeon();
      if (Array.isArray(liveNeonProducts)) {
        productsToSave = liveNeonProducts;
      }
    } catch {}

    let categoriesToSave = db.categories;
    try {
      const liveNeonCats = await getCategoriesFromNeon();
      if (Array.isArray(liveNeonCats)) {
        categoriesToSave = liveNeonCats;
      }
    } catch {}

    let ordersToSave = db.orders;
    try {
      const liveNeonOrders = await getOrdersFromNeon();
      if (Array.isArray(liveNeonOrders)) {
        ordersToSave = liveNeonOrders;
      }
    } catch {}

    let notifsToSave = db.notifications;
    try {
      const liveNeonNotifs = await getNotificationsFromNeon();
      if (Array.isArray(liveNeonNotifs)) {
        notifsToSave = liveNeonNotifs;
      }
    } catch {}

    let couponsToSave = db.coupons;
    try {
      const liveNeonCoupons = await getCouponsFromNeon();
      if (Array.isArray(liveNeonCoupons)) {
        couponsToSave = liveNeonCoupons;
      }
    } catch {}

    let queriesToSave = db.queries;
    try {
      const liveNeonQueries = await getCustomerQueriesFromNeon();
      if (Array.isArray(liveNeonQueries)) {
        queriesToSave = liveNeonQueries;
      }
    } catch {}

    let invoicesToSave = db.invoices;
    try {
      const liveNeonInvoices = await getInvoicesFromNeon();
      if (Array.isArray(liveNeonInvoices)) {
        invoicesToSave = liveNeonInvoices;
      }
    } catch {}

    await pool.query(
      `INSERT INTO app_settings (key, data, updated_at)
       VALUES ('bundle', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [
        JSON.stringify({
          users: db.users,
          categories: categoriesToSave,
          products: productsToSave,
          orders: ordersToSave,
          queries: queriesToSave,
          notifications: notifsToSave,
          notificationReads: db.notificationReads,
          coupons: couponsToSave,
          reviews: db.reviews,
          faqs: db.faqs,
          policies: db.policies,
          settings: db.settings,
          homepageCms: db.homepageCms,
          invoices: invoicesToSave,
          invoiceSettings: db.invoiceSettings,
          teamMembers: db.teamMembers,
          inventoryTransactions: db.inventoryTransactions,
          promotions: db.promotions,
          customerNotes: db.customerNotes,
          wishlists: db.wishlists,
          _version: db._version,
          _updatedAt: db._updatedAt,
        }),
      ]
    );

    return true;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Sync error:', err.message);
    return false;
  }
}

export async function loadSchemaFromNeon(): Promise<DatabaseSchema | null> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return null;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return null;

    const res = await pool.query(`SELECT data FROM app_settings WHERE key = 'bundle' LIMIT 1`);
    if (res.rows && res.rows.length > 0 && res.rows[0].data) {
      const data = res.rows[0].data;
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      return data as DatabaseSchema;
    }
    return null;
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Error loading schema from Neon:', err.message);
    return null;
  }
}

// =========================================================================
// REALTIME & MEDIA SYNC
// =========================================================================

export async function recordSyncEventInNeon(event: SyncEvent): Promise<void> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO sync_events (id, event_type, action, payload, timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        event.id,
        event.type,
        event.action || '',
        JSON.stringify(event.payload || event),
        event.timestamp || Date.now(),
      ]
    );
  } catch (err: any) {
    console.warn('[Neon PostgreSQL] Could not record sync event:', err.message);
  }
}

export async function getSyncEventsFromNeon(sinceTimestamp: number, limit = 50): Promise<SyncEvent[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return [];

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return [];

    const res = await pool.query(
      `SELECT * FROM sync_events
       WHERE timestamp > $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [sinceTimestamp, limit]
    );

    return (res.rows || []).map((row: any) => ({
      id: row.id,
      type: row.event_type,
      action: row.action,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
      timestamp: Number(row.timestamp),
    }));
  } catch (err: any) {
    console.warn('[Neon PostgreSQL] Could not fetch sync events:', err.message);
    return [];
  }
}

export async function recordMediaUploadInNeon(media: {
  id: string;
  fileName: string;
  fileKey: string;
  bucket: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
}): Promise<void> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO media_uploads (id, file_name, file_key, bucket, url, content_type, size_bytes, uploaded_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        media.id,
        media.fileName,
        media.fileKey,
        media.bucket,
        media.url,
        media.contentType,
        media.sizeBytes,
        media.uploadedBy,
      ]
    );
  } catch (err: any) {
    console.warn('[Neon PostgreSQL] Error recording media upload metadata:', err.message);
  }
}
