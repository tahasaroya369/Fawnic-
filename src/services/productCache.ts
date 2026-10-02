import type { Product, Category } from '../types.js';

let cachedProducts: Product[] | null = null;
let cachedCategories: Category[] | null = null;
const productDetailCache = new Map<
  string,
  { product: Product; reviews: any[]; relatedProducts: Product[] }
>();

// In-memory set of image URLs that have already loaded successfully in this session
// Prevents reloading / resetting image lifecycle when scrolling away and back
const loadedImageUrls = new Set<string>();

export function getCachedProducts(): Product[] | null {
  return cachedProducts;
}

export function setCachedProducts(products: Product[]): void {
  cachedProducts = products;
}

export function getCachedCategories(): Category[] | null {
  return cachedCategories;
}

export function setCachedCategories(categories: Category[]): void {
  cachedCategories = categories;
}

export function getCachedProductDetail(
  slugOrId: string
): { product: Product; reviews: any[]; relatedProducts: Product[] } | null {
  return productDetailCache.get(slugOrId) || null;
}

export function setCachedProductDetail(
  slugOrId: string,
  data: { product: Product; reviews: any[]; relatedProducts: Product[] }
): void {
  productDetailCache.set(slugOrId, data);
  if (data.product.id) {
    productDetailCache.set(data.product.id, data);
  }
  if (data.product.slug) {
    productDetailCache.set(data.product.slug, data);
  }
}

export function isImageLoaded(url?: string): boolean {
  if (!url) return false;
  return loadedImageUrls.has(url);
}

export function markImageLoaded(url?: string): void {
  if (url) {
    loadedImageUrls.add(url);
  }
}

/**
 * Intelligent background prefetching of visible & upcoming product images
 * Runs strictly during browser idle cycles so mobile main thread is never blocked.
 */
export function prefetchProductImages(products: Product[]): void {
  if (typeof window === 'undefined' || !Array.isArray(products) || products.length === 0) return;

  const schedule = () => {
    products.slice(0, 16).forEach((p) => {
      if (!p || !p.mainImage || isImageLoaded(p.mainImage)) return;
      const img = new Image();
      img.onload = () => markImageLoaded(p.mainImage);
      img.src = p.mainImage;
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(schedule, { timeout: 1500 });
  } else {
    setTimeout(schedule, 250);
  }
}

// Global synchronization listener: updates cache instantly on admin mutations
if (typeof window !== 'undefined') {
  window.addEventListener('fawnic:product_change', (e: any) => {
    const detail = e.detail;
    if (!detail) return;

    if (detail.action === 'updated') {
      if (detail.product && cachedProducts) {
        cachedProducts = cachedProducts.map((p) =>
          p.id === detail.product.id ? { ...p, ...detail.product } : p
        );
        const cachedDetail =
          productDetailCache.get(detail.product.slug) ||
          productDetailCache.get(detail.product.id);
        if (cachedDetail) {
          cachedDetail.product = { ...cachedDetail.product, ...detail.product };
        }
      } else {
        // Bulk update or generic invalidation
        cachedProducts = null;
      }
    } else if (
      detail.action === 'inventory' &&
      detail.productId &&
      detail.product &&
      cachedProducts
    ) {
      cachedProducts = cachedProducts.map((p) =>
        p.id === detail.productId ? { ...p, ...detail.product } : p
      );
      const cachedDetail =
        productDetailCache.get(detail.productId) ||
        productDetailCache.get(detail.product.slug);
      if (cachedDetail) {
        cachedDetail.product = { ...cachedDetail.product, ...detail.product };
      }
    } else if (detail.action === 'deleted') {
      const pid = detail.productId || detail.product?.id;
      if (pid && cachedProducts) {
        cachedProducts = cachedProducts.filter((p) => p.id !== pid);
      } else {
        cachedProducts = null;
      }
      if (pid) productDetailCache.delete(pid);
      if (detail.product?.slug) {
        productDetailCache.delete(detail.product.slug);
      }
    } else if (detail.action === 'created' && detail.product && cachedProducts) {
      const exists = cachedProducts.some((p) => p.id === detail.product.id);
      if (!exists) {
        cachedProducts = [detail.product, ...cachedProducts];
      }
    }
  });

  window.addEventListener('fawnic:category_change', (e: any) => {
    const detail = e.detail;
    if (!detail) return;
    if (detail.action === 'deleted' && detail.categoryId && cachedCategories) {
      cachedCategories = cachedCategories.filter((c) => c.id !== detail.categoryId);
    } else if (detail.action === 'updated' && detail.category && cachedCategories) {
      cachedCategories = cachedCategories.map((c) =>
        c.id === detail.category.id ? { ...c, ...detail.category } : c
      );
    } else if (detail.action === 'created' && detail.category && cachedCategories) {
      const exists = cachedCategories.some((c) => c.id === detail.category.id);
      if (!exists) {
        cachedCategories = [...cachedCategories, detail.category];
      }
    }
  });
}
