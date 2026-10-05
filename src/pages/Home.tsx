import React, { useState, useEffect, useMemo } from 'react';
import { HeroCarousel } from '../components/home/HeroCarousel.js';
import { ThreeCoreCollections } from '../components/home/ThreeCoreCollections.js';
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection.js';
import { ProductCarouselSection } from '../components/home/ProductCarouselSection.js';
import { CraftedInDetailSection } from '../components/home/CraftedInDetailSection.js';
import { CinematicVideoSection } from '../components/home/CinematicVideoSection.js';
import { FawnicStandardSection } from '../components/home/FawnicStandardSection.js';
import { BrandStorySection } from '../components/home/BrandStorySection.js';
import { OffersSection } from '../components/home/OffersSection.js';
import { FinalCtaSection } from '../components/home/FinalCtaSection.js';
import { Wallet, ShieldCheck, Clock } from 'lucide-react';
import { getCachedProducts, setCachedProducts, prefetchProductImages } from '../services/productCache.js';
import { fetchWithRetry } from '../utils/apiClient.js';
import type { Product } from '../types.js';

interface HomeProps {
  onNavigate: (route: string, param?: any) => void;
  onQuickView: (product: Product) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onQuickView }) => {
  const [products, setProducts] = useState<Product[]>(() => getCachedProducts() || []);
  const [loading, setLoading] = useState(() => !getCachedProducts());

  useEffect(() => {
    let isMounted = true;

    async function loadHomeProducts(isInitial = false) {
      try {
        const hasCached = Boolean(getCachedProducts());
        if (isInitial && !hasCached) setLoading(true);

        const res = await fetchWithRetry('/api/products?limit=50', {}, 2, 500);
        if (res.ok && isMounted) {
          const data = await res.json();
          const items = data.products || [];
          setProducts(items);
          setCachedProducts(items);
          prefetchProductImages(items);
        }
      } catch (err) {
        // Fall back gracefully to cache or retry silently
        const cached = getCachedProducts();
        if (cached && cached.length > 0 && isMounted) {
          setProducts(cached);
        } else {
          console.warn('Temporary delay loading products, will re-sync:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHomeProducts(true);

    const handleProductChange = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.action === 'updated' && detail.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === detail.product.id ? { ...p, ...detail.product } : p))
        );
      } else if (detail.action === 'inventory' && detail.productId && detail.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === detail.productId ? { ...p, ...detail.product } : p))
        );
      } else if (detail.action === 'deleted') {
        const pid = detail.productId || detail.product?.id;
        if (pid) {
          setProducts((prev) => prev.filter((p) => p.id !== pid));
          const current = getCachedProducts();
          if (current) setCachedProducts(current.filter((p) => p.id !== pid));
        } else {
          loadHomeProducts(false);
        }
      } else {
        loadHomeProducts(false);
      }
    };

    window.addEventListener('fawnic:product_change', handleProductChange);

    return () => {
      isMounted = false;
      window.removeEventListener('fawnic:product_change', handleProductChange);
    };
  }, []);

  const walletProducts = useMemo(
    () =>
      products.filter((p) =>
        (p.categoryName || p.categoryId || '').toLowerCase().includes('wallet')
      ),
    [products]
  );
  const beltProducts = useMemo(
    () =>
      products.filter((p) =>
        (p.categoryName || p.categoryId || '').toLowerCase().includes('belt')
      ),
    [products]
  );
  const watchProducts = useMemo(
    () =>
      products.filter((p) =>
        (p.categoryName || p.categoryId || '').toLowerCase().includes('watch')
      ),
    [products]
  );

  return (
    <div className="relative w-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      {/* 1. HERO CAROUSEL */}
      <HeroCarousel onNavigate={onNavigate} />

      {/* 2. MAIN CATEGORIES */}
      <ThreeCoreCollections onNavigate={onNavigate} />

      {/* 3. FEATURED PRODUCTS (CURATED EDITORIAL GRID FROM REAL DB) */}
      <FeaturedProductsSection
        products={products}
        onNavigate={onNavigate}
        onQuickView={onQuickView}
      />

      {/* 4. MEN'S WALLET COLLECTION */}
      {walletProducts.length > 0 && (
        <ProductCarouselSection
          id="wallets-collection"
          title="Men's Leather Wallet Collection"
          eyebrow="Everyday Carry & Calibrated Silhouette"
          description="Hand-skived vegetable-tanned leather bifold, slim front pocket, and continental designs with certified RFID shielding."
          products={walletProducts}
          onNavigate={onNavigate}
          onQuickView={onQuickView}
          viewAllRoute="shop"
          viewAllParam="wallets"
          bgClass="bg-white dark:bg-stone-900"
          badgeIcon={<Wallet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
        />
      )}

      {/* 5. MEN'S BELT COLLECTION */}
      {beltProducts.length > 0 && (
        <ProductCarouselSection
          id="belts-collection"
          title="Men's Leather Belt Collection"
          eyebrow="Continuous Steerhide & Solid Forged Brass"
          description="Cut from continuous 9oz full-grain steerhide bends with hand-beveled edges and solid brass hardware built to last a lifetime."
          products={beltProducts}
          onNavigate={onNavigate}
          onQuickView={onQuickView}
          viewAllRoute="shop"
          viewAllParam="belts"
          bgClass="bg-stone-50/70 dark:bg-stone-950"
          badgeIcon={<ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
        />
      )}

      {/* 6. PREMIUM WATCHES */}
      {watchProducts.length > 0 && (
        <ProductCarouselSection
          id="watches-collection"
          title="Premium Watches & Independent Horology"
          eyebrow="Mechanical Precision & Sapphire Crystal"
          description="High-beat mechanical automatic and hand-wound calibers paired with bespoke handcrafted full-grain leather straps."
          products={watchProducts}
          onNavigate={onNavigate}
          onQuickView={onQuickView}
          viewAllRoute="shop"
          viewAllParam="watches"
          bgClass="bg-white dark:bg-stone-900"
          badgeIcon={<Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
        />
      )}

      {/* 7. CRAFTSMANSHIP / LEATHER DETAILS */}
      <CraftedInDetailSection onNavigate={onNavigate} />

      {/* 8. PRODUCT MARKETING VIDEO SECTION */}
      <CinematicVideoSection onNavigate={onNavigate} />

      {/* 9. WHY CHOOSE FAWNIC */}
      <FawnicStandardSection />

      {/* 10. BRAND STORY */}
      <BrandStorySection onNavigate={onNavigate} />

      {/* 11. NEWSLETTER / UPDATES */}
      <OffersSection onNavigate={onNavigate} />

      {/* 12. FINAL CALL TO ACTION */}
      <FinalCtaSection onNavigate={onNavigate} />
    </div>
  );
};

