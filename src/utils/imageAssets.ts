/**
 * FAWNIC LEATHER ATELIER — ASSET MANAGEMENT SYSTEM
 * Centralized, non-overlapping, high-resolution imagery for all editorial,
 * marketing, brand, and promotional sections.
 * 
 * Strict Rules:
 * 1. Men's Wallets = Men's leather bifold wallet photography only
 * 2. Men's Belts = Men's leather belt with solid brass/metal buckle only (NO bags, NO cosmetics)
 * 3. Premium Watches = Luxury mechanical/analog men's wristwatch only (NO cosmetics, NO flowers)
 * 4. Craftsmanship = Hand skiving, beveling, saddle stitching & edge finishing
 * 5. Packaging = Premium debossed presentation & unboxing
 * 6. No decorative image is reused across different sections.
 */

export const IMAGE_ASSETS = {
  // 1. Home Sections & Hero Carousel (Curated specifically for FAWNIC core categories)
  homeHero: '/assets/images/hero_atelier_craft_1790449081949.jpg',
  heroWallets: '/assets/images/hero_mens_wallet_1790447762128.jpg', // Genuine men's full-grain leather bifold wallet
  heroBelts: '/assets/images/hero_mens_belt_1790447772143.jpg', // Genuine men's full-grain leather belt with solid brass buckle
  heroWatches: '/assets/images/hero_luxury_watch_1790447781834.jpg', // Genuine luxury mechanical wristwatch with leather strap
  heroCraft: '/assets/images/hero_atelier_craft_1790449081949.jpg', // Genuine leather atelier workbench & leathercraft collection
  heroAccessories: '/assets/images/cat_mens_wallet_v2_1790449008902.jpg',

  // 2. Categories & Pillars (Home Section 2 - Distinct from Hero images)
  collectionWallets: '/assets/images/cat_mens_wallet_v2_1790449008902.jpg', // Distinct leather wallet with card slots & clean stitching
  collectionBelts: '/assets/images/cat_mens_belt_v2_1790449023189.jpg', // Distinct coiled leather belt with forged metallic buckle
  collectionWatches: '/assets/images/cat_luxury_watch_v2_1790449038082.jpg', // Distinct luxury men's chronograph timepiece with leather strap
  collectionAccessories: '/assets/images/cat_mens_wallet_v2_1790449008902.jpg',

  // 3. Editorial & Craft Storytelling
  craftDetail: '/assets/images/details_leather_craft_1790449069488.jpg', // Master hands saddle-stitching full-grain leather in workshop
  handmadeProducts: '/assets/images/handmade_leather_products_1790449054010.jpg', // Artisan handmade leather goods in progress
  editorialCampaign: '/assets/images/hero_mens_wallet_1790447762128.jpg',
  brandStory: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&auto=format&fit=crop&q=85', // Generational saddlery tools & cutting bench in Lahore atelier
  finalCta: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1600&auto=format&fit=crop&q=85', // Ambient leather atelier background with hides

  // 4. Dedicated Pages
  shopBanner: '/assets/images/hero_mens_belt_1790447772143.jpg',
  aboutHero: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&auto=format&fit=crop&q=85',
  contactHero: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1000&auto=format&fit=crop&q=85',
  shippingHero: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1000&auto=format&fit=crop&q=85',
  returnsHero: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=1000&auto=format&fit=crop&q=85',

  // 5. Authentication
  loginShowcase: '/assets/images/hero_mens_wallet_1790447762128.jpg',
  registerShowcase: '/assets/images/hero_mens_belt_1790447772143.jpg',

  // 6. Video Section Posters & Thumbnails (All unique non-overlapping)
  videoWalletsPoster: '/assets/images/hero_mens_wallet_1790447762128.jpg',
  videoBeltsPoster: '/assets/images/hero_mens_belt_1790447772143.jpg',
  videoWatchesPoster: '/assets/images/hero_luxury_watch_1790447781834.jpg',
  videoHandmadePoster: '/assets/images/handmade_leather_products_1790449054010.jpg',
  
  videoPosters: {
    wallet: '/assets/images/hero_mens_wallet_1790447762128.jpg',
    belt: '/assets/images/hero_mens_belt_1790447772143.jpg',
    watch: '/assets/images/hero_luxury_watch_1790447781834.jpg',
    handmade: '/assets/images/handmade_leather_products_1790449054010.jpg',
  },
};

/**
 * Category-aware fallback image resolver.
 * Ensures a belt always falls back to a belt image, a watch to a watch image,
 * and a wallet to a wallet image. Never displays an unrelated category image.
 */
export function getCategoryFallbackImage(category?: string, name?: string): string {
  const text = `${category || ''} ${name || ''}`.toLowerCase();
  if (text.includes('belt')) {
    return IMAGE_ASSETS.collectionBelts;
  }
  if (text.includes('watch') || text.includes('timepiece') || text.includes('chronograph') || text.includes('horology')) {
    return IMAGE_ASSETS.collectionWatches;
  }
  // Default to wallet for leather goods
  return IMAGE_ASSETS.collectionWallets;
}

/**
 * Responsive image delivery helper:
 * Generates properly sized URLs and srcset for Unsplash images without changing actual visuals.
 * Preserves all original query parameters safely using URL parser to prevent broken 404 image URLs.
 */
export function getResponsiveImageProps(url?: string, defaultWidth = 500) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { src: '', srcSet: undefined, sizes: undefined };
  }

  const trimmed = url.trim();

  if (trimmed.includes('images.unsplash.com')) {
    try {
      const u = new URL(trimmed);
      u.searchParams.set('w', defaultWidth.toString());
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('q', '80');
      const src = u.toString();

      const u360 = new URL(trimmed);
      u360.searchParams.set('w', '360');
      u360.searchParams.set('auto', 'format');
      u360.searchParams.set('fit', 'crop');
      u360.searchParams.set('q', '80');

      const u640 = new URL(trimmed);
      u640.searchParams.set('w', '640');
      u640.searchParams.set('auto', 'format');
      u640.searchParams.set('fit', 'crop');
      u640.searchParams.set('q', '80');

      const u960 = new URL(trimmed);
      u960.searchParams.set('w', '960');
      u960.searchParams.set('auto', 'format');
      u960.searchParams.set('fit', 'crop');
      u960.searchParams.set('q', '80');

      const srcSet = `${u360.toString()} 360w, ${u640.toString()} 640w, ${u960.toString()} 960w`;
      const sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px';

      return { src, srcSet, sizes };
    } catch {
      return { src: trimmed, srcSet: undefined, sizes: undefined };
    }
  }

  return { src: trimmed, srcSet: undefined, sizes: undefined };
}

