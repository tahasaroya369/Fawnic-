import { neon, Pool, neonConfig } from '@neondatabase/serverless';
import type { DatabaseSchema, SyncEvent } from '../db.js';

// Setup neon config if needed
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
      poolInstance = new Pool({ connectionString: dbUrl });
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
 * Initializes all required PostgreSQL tables, indexes, constraints, and timestamps for FAWNIC Atelier
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
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(7492019)');

        console.info('[Neon PostgreSQL] Initializing production tables and indexes for FAWNIC...');

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
            category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
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
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Orders Table
          CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(64) PRIMARY KEY,
            order_number VARCHAR(64) UNIQUE NOT NULL,
            customer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(64) DEFAULT '',
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
            billing_address JSONB DEFAULT '{}'::jsonb,
            status VARCHAR(32) NOT NULL DEFAULT 'new',
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
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Customer Queries (Support CRM) Table
          CREATE TABLE IF NOT EXISTS customer_queries (
            id VARCHAR(64) PRIMARY KEY,
            ticket_number VARCHAR(64) UNIQUE NOT NULL,
            customer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(64) DEFAULT '',
            subject VARCHAR(255) NOT NULL,
            category VARCHAR(64) DEFAULT 'General',
            message TEXT NOT NULL,
            messages JSONB DEFAULT '[]'::jsonb,
            status VARCHAR(32) NOT NULL DEFAULT 'open',
            priority VARCHAR(32) DEFAULT 'medium',
            order_number VARCHAR(64) DEFAULT '',
            is_deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Notifications Table
          CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(64) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(64) DEFAULT 'system',
            audience VARCHAR(64) DEFAULT 'all',
            target_user_id VARCHAR(64),
            link TEXT DEFAULT '',
            scheduled_for TIMESTAMPTZ,
            expires_at TIMESTAMPTZ,
            is_published BOOLEAN DEFAULT TRUE,
            is_automated BOOLEAN DEFAULT FALSE,
            created_by VARCHAR(255) DEFAULT 'System',
            read_by JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
            order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
            order_number VARCHAR(64) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
            tax NUMERIC(12, 2) DEFAULT 0,
            total NUMERIC(12, 2) NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Inventory Transactions Table
          CREATE TABLE IF NOT EXISTS inventory_transactions (
            id VARCHAR(64) PRIMARY KEY,
            product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
            change_amount INT NOT NULL,
            previous_stock INT NOT NULL,
            new_stock INT NOT NULL,
            reason VARCHAR(255) DEFAULT '',
            created_by VARCHAR(255) DEFAULT 'System',
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
          CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
          CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
          CREATE INDEX IF NOT EXISTS idx_queries_customer ON customer_queries(customer_id);
          CREATE INDEX IF NOT EXISTS idx_queries_status ON customer_queries(status);
          CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_user_id);
          CREATE INDEX IF NOT EXISTS idx_sync_events_timestamp ON sync_events(timestamp);
          CREATE INDEX IF NOT EXISTS idx_media_uploads_key ON media_uploads(file_key);
        `);

        await client.query('COMMIT');
      } catch (innerErr: any) {
        await client.query('ROLLBACK').catch(() => {});
        // If it's a catalog concurrency issue like pg_type_typname_nsp_index, the table/type already exists
        if (innerErr.message && innerErr.message.includes('pg_type_typname_nsp_index')) {
          console.info('[Neon PostgreSQL] Schema tables already exist or initialized concurrently.');
          schemaInitialized = true;
          return true;
        }
        throw innerErr;
      } finally {
        client.release();
      }

      schemaInitialized = true;
      isConnected = true;
      console.info('[Neon PostgreSQL] Schema successfully initialized.');
      return true;
    } catch (err: any) {
      if (err.message && err.message.includes('pg_type_typname_nsp_index')) {
        schemaInitialized = true;
        return true;
      }
      console.error('[Neon PostgreSQL] Error initializing schema:', err.message);
      return false;
    } finally {
      schemaInitPromise = null;
    }
  })();

  return schemaInitPromise;
}

/**
 * Saves a sync event to the Neon database for real-time synchronization across instances
 */
export async function recordSyncEventInNeon(event: SyncEvent): Promise<void> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return;

  try {
    const pool = getNeonPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO sync_events (id, event_type, action, payload, timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [event.id, event.type, event.action || '', JSON.stringify(event), event.timestamp]
    );

    // Prune old sync events older than 1 hour to keep database light
    const oneHourAgo = Date.now() - 3600000;
    await pool.query(`DELETE FROM sync_events WHERE timestamp < $1`, [oneHourAgo]);
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Failed to save sync event:', err.message);
  }
}

/**
 * Retrieves sync events from Neon since a specific timestamp
 */
export async function getSyncEventsFromNeon(sinceTimestamp: number, limit = 50): Promise<SyncEvent[]> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return [];

  try {
    const pool = getNeonPool();
    if (!pool) return [];

    const res = await pool.query(
      `SELECT payload FROM sync_events 
       WHERE timestamp > $1 
       ORDER BY timestamp ASC 
       LIMIT $2`,
      [sinceTimestamp, limit]
    );

    return res.rows.map((r: any) => (typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload));
  } catch (err: any) {
    console.error('[Neon PostgreSQL] Failed to query sync events:', err.message);
    return [];
  }
}

/**
 * Saves an uploaded media record into Neon media_uploads table
 */
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
    const pool = getNeonPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO media_uploads (id, file_name, file_key, bucket, url, content_type, size_bytes, uploaded_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url`,
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
    console.error('[Neon PostgreSQL] Failed to record media upload:', err.message);
  }
}

/**
 * Synchronizes entire DatabaseSchema into Neon PostgreSQL
 */
export async function syncSchemaToNeon(db: DatabaseSchema): Promise<boolean> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return false;

  try {
    await initializeNeonSchema();
    const pool = getNeonPool();
    if (!pool) return false;

    // Save app settings bundle
    await pool.query(
      `INSERT INTO app_settings (key, data, updated_at)
       VALUES ('bundle', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [
        JSON.stringify({
          users: db.users,
          categories: db.categories,
          products: db.products,
          orders: db.orders,
          queries: db.queries,
          notifications: db.notifications,
          notificationReads: db.notificationReads,
          coupons: db.coupons,
          reviews: db.reviews,
          faqs: db.faqs,
          policies: db.policies,
          settings: db.settings,
          homepageCms: db.homepageCms,
          invoices: db.invoices,
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

/**
 * Loads entire DatabaseSchema from Neon PostgreSQL
 */
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
