import express from 'express';
import { getDb, saveDatabase } from '../db.js';
import type { AuthenticatedRequest } from '../middleware.js';
import type { Review } from '../../src/types.js';

const router = express.Router();

// Get All Products with Rich Filtering & Sorting
router.get('/', (req, res) => {
  const db = getDb();
  let list = db.products.filter((p) => p.status === 'published');

  const {
    category,
    search,
    sort,
    minPrice,
    maxPrice,
    inStock,
    featured,
    bestSeller,
    leatherType,
    page = '1',
    limit = '50',
  } = req.query;

  // Category filter (slug or ID)
  if (category && typeof category === 'string' && category !== 'all') {
    const cat = db.categories.find((c) => c.slug === category || c.id === category);
    if (cat) {
      list = list.filter((p) => p.categoryId === cat.id);
    } else {
      list = list.filter((p) => p.categoryId === category || p.subcategoryId === category);
    }
  }

  // Search filter
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Leather Type filter
  if (leatherType && typeof leatherType === 'string' && leatherType !== 'all') {
    list = list.filter((p) => p.leatherType?.toLowerCase().includes(leatherType.toLowerCase()));
  }

  // Price Range
  if (minPrice && !isNaN(Number(minPrice))) {
    list = list.filter((p) => p.salePrice >= Number(minPrice));
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    list = list.filter((p) => p.salePrice <= Number(maxPrice));
  }

  // Stock availability
  if (inStock === 'true') {
    list = list.filter((p) => p.stock > 0);
  }

  // Featured / Best Seller
  if (featured === 'true') {
    list = list.filter((p) => p.isFeatured);
  }
  if (bestSeller === 'true') {
    list = list.filter((p) => p.isBestSeller);
  }

  // Sorting
  if (sort === 'price_asc') {
    list.sort((a, b) => a.salePrice - b.salePrice);
  } else if (sort === 'price_desc') {
    list.sort((a, b) => b.salePrice - a.salePrice);
  } else if (sort === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // Default popularity / best seller
    list.sort((a, b) => {
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      return b.reviewCount - a.reviewCount;
    });
  }

  const pNum = Math.max(1, parseInt(page as string, 10));
  const lNum = Math.max(1, parseInt(limit as string, 10));
  const total = list.length;
  const paginated = list.slice((pNum - 1) * lNum, pNum * lNum);

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.json({
    products: paginated,
    total,
    page: pNum,
    totalPages: Math.ceil(total / lNum),
  });
});

// Featured / Best Sellers for Homepage
router.get('/featured', (req, res) => {
  const db = getDb();
  const published = db.products.filter((p) => p.status === 'published');
  const bestSellers = published.filter((p) => p.isBestSeller).slice(0, 8);
  const newArrivals = published.filter((p) => p.isNewArrival).slice(0, 8);
  const featured = published.filter((p) => p.isFeatured).slice(0, 8);

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.json({ bestSellers, newArrivals, featured });
});

// Get Categories
router.get('/categories', (req, res) => {
  const db = getDb();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.json(db.categories);
});

// Get Single Category by Slug with Products
router.get('/categories/:slug', (req, res) => {
  const db = getDb();
  const category = db.categories.find((c) => c.slug === req.params.slug);
  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  const products = db.products.filter(
    (p) => p.categoryId === category.id && p.status === 'published'
  );
  res.json({ category, products });
});

// Get Multi-Vendor Stores
router.get('/vendors', (req, res) => {
  const db = getDb();
  const published = db.products.filter((p) => p.status === 'published');

  const vendorProfiles = [
    {
      id: 'vdr_fawnic',
      name: 'FAWNIC Atelier',
      tagline: 'Master Leathercraft & Heritage Binders',
      description: 'Our in-house flagship atelier dedicated to vegetable-tanned full-grain cowhides, hand-burnished edges, and lifetime durability.',
      category: 'Leather Goods & Heritage Sets',
      logo: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&auto=format&fit=crop&q=80',
      rating: 4.9,
      reviewCount: 142,
      badge: 'Flagship Atelier',
      verified: true,
      origin: 'Karachi, Pakistan',
      productsCount: published.filter((p) => p.vendorId === 'vdr_fawnic' || p.vendorStoreName?.includes('FAWNIC')).length || 11,
    },
    {
      id: 'vdr_vanguard',
      name: 'Vanguard Horlogerie',
      tagline: 'Independent Mechanical Watchmakers',
      description: 'Specializing in hand-assembled automatic chronographs, anti-reflective sapphire crystals, and surgical 316L steel.',
      category: 'Luxury Horology & Timepieces',
      logo: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1200&auto=format&fit=crop&q=80',
      rating: 5.0,
      reviewCount: 34,
      badge: 'Independent Watchmaker',
      verified: true,
      origin: 'Geneva & Lahore',
      productsCount: published.filter((p) => p.vendorId === 'vdr_vanguard' || p.vendorStoreName?.includes('Vanguard')).length || 2,
    },
    {
      id: 'vdr_sainthonore',
      name: 'Atelier Saint-Honoré',
      tagline: 'Master Leather & Belt Guild',
      description: 'Hand-burnished belts and leather goods cut from continuous oiled steerhide.',
      category: 'Leather Belts',
      logo: '/assets/images/card_mens_belt_1790447805889.jpg',
      banner: '/assets/images/hero_mens_belt_1790447772143.jpg',
      rating: 4.95,
      reviewCount: 46,
      badge: 'Master Leathercraft',
      verified: true,
      origin: 'Florence & Lahore',
      productsCount: published.filter((p) => p.vendorId === 'vdr_sainthonore' || p.vendorStoreName?.includes('Saint-Honoré')).length || 2,
    },
    {
      id: 'vdr_aethelgard',
      name: 'Aethelgard Watchmakers',
      tagline: 'Artisanal Dual-Time & Dress Calibers',
      description: 'Heritage mid-century timepieces featuring guilloché textured dials, heat-blued hands, and full-grain calfskin straps.',
      category: 'Dress Watches & Mechanical',
      logo: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop&q=80',
      rating: 4.9,
      reviewCount: 21,
      badge: 'Artisan Horologist',
      verified: true,
      origin: 'Zurich & Islamabad',
      productsCount: published.filter((p) => p.vendorId === 'vdr_aethelgard' || p.vendorStoreName?.includes('Aethelgard')).length || 1,
    },
  ];

  res.json(vendorProfiles);
});

// Get Public Customer Reviews
router.get('/reviews', (req, res) => {
  const db = getDb();
  const approved = (db.reviews || []).filter((r) => r.isApproved);
  res.json(approved);
});

// Get Single Product by Slug or ID
router.get('/:slug', (req, res) => {
  const db = getDb();
  const product = db.products.find(
    (p) => p.slug === req.params.slug || p.id === req.params.slug
  );
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  // Related products from same category
  const related = db.products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.status === 'published')
    .slice(0, 4);

  // Reviews for this product
  const reviews = db.reviews.filter(
    (r) => r.productId === product.id && r.isApproved
  );

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.json({ product, related, reviews });
});

// Submit Product Review
router.post('/:id/reviews', (req: AuthenticatedRequest, res) => {
  const { rating, comment, title, customerName, customerCity } = req.body;
  if (!rating || !comment) {
    res.status(400).json({ error: 'Rating and review comment are required' });
    return;
  }

  const db = getDb();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const newReview: Review = {
    id: `rev_${Date.now()}`,
    productId: product.id,
    productName: product.name,
    customerId: req.user?.id,
    customerName: customerName?.trim() || req.user?.name || 'Verified Buyer',
    customerCity: customerCity?.trim() || 'Pakistan',
    rating: Number(rating),
    title: title?.trim() || 'Customer Review',
    comment: comment.trim(),
    verifiedPurchase: true,
    isApproved: true, // Auto-approve demo reviews
    createdAt: new Date().toISOString(),
  };

  db.reviews.unshift(newReview);

  // Recalculate product rating
  const approvedReviews = db.reviews.filter((r) => r.productId === product.id && r.isApproved);
  const avg = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
  product.rating = Number(avg.toFixed(1));
  product.reviewCount = approvedReviews.length;

  saveDatabase();

  res.status(201).json({ review: newReview, message: 'Review submitted successfully' });
});

export default router;
