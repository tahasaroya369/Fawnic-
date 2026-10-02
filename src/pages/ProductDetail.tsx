import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Store,
  Share2,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowRight,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useWishlist } from '../context/WishlistContext.js';
import { useAuth } from '../context/AuthContext.js';
import { checkShoppingAuth } from '../utils/authGuard.js';
import { sanitizeProductHtml } from '../utils/sanitize.js';
import { getResponsiveImageProps, getCategoryFallbackImage } from '../utils/imageAssets.js';
import {
  getCachedProductDetail,
  setCachedProductDetail,
  isImageLoaded,
  markImageLoaded,
} from '../services/productCache.js';
import { ProductCard } from '../components/common/ProductCard.js';
import type { Product, Review } from '../types.js';

interface ProductDetailProps {
  slug: string;
  onNavigate: (route: string, param?: any) => void;
  onQuickView: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ slug, onNavigate, onQuickView }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user, token, isAuthenticated } = useAuth();

  const cachedDetail = getCachedProductDetail(slug);
  const [product, setProduct] = useState<Product | null>(() => cachedDetail?.product || null);
  const [reviews, setReviews] = useState<Review[]>(() => cachedDetail?.reviews || []);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(() => cachedDetail?.relatedProducts || []);
  const [loading, setLoading] = useState(() => !cachedDetail);

  const [selectedImage, setSelectedImage] = useState<string>(() => cachedDetail?.product?.mainImage || '');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  // Delivery calculator city
  const [selectedCity, setSelectedCity] = useState('Karachi');

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  // Mobile & Desktop Image Gallery Scrolling Animation
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const list = product.images && product.images.length > 0 ? [...product.images] : [product.mainImage];
    if (product.mainImage && !list.includes(product.mainImage)) {
      list.unshift(product.mainImage);
    }
    return list;
  }, [product]);

  useEffect(() => {
    setActiveImageIndex(0);
    if (galleryScrollRef.current) {
      galleryScrollRef.current.scrollLeft = 0;
    }
  }, [slug]);

  const scrollToImage = (index: number) => {
    if (index < 0 || index >= galleryImages.length) return;
    setActiveImageIndex(index);
    setSelectedImage(galleryImages[index]);
    if (galleryScrollRef.current) {
      const targetLeft = index * galleryScrollRef.current.clientWidth;
      galleryScrollRef.current.scrollTo({
        left: targetLeft,
        behavior: 'smooth',
      });
    }
    if (thumbnailRefs.current[index]) {
      thumbnailRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest',
        block: 'nearest',
      });
    }
  };

  const handleGalleryScroll = () => {
    if (!galleryScrollRef.current) return;
    const { scrollLeft, clientWidth } = galleryScrollRef.current;
    if (clientWidth > 0) {
      const newIndex = Math.round(scrollLeft / clientWidth);
      if (newIndex >= 0 && newIndex < galleryImages.length && newIndex !== activeImageIndex) {
        setActiveImageIndex(newIndex);
        setSelectedImage(galleryImages[newIndex]);
        if (thumbnailRefs.current[newIndex]) {
          thumbnailRefs.current[newIndex]?.scrollIntoView({
            behavior: 'smooth',
            inline: 'nearest',
            block: 'nearest',
          });
        }
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        const hasCached = Boolean(getCachedProductDetail(slug));
        if (!hasCached) {
          setLoading(true);
        }
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) {
          if (isMounted) setProduct(null);
          return;
        }
        const data = await res.json();
        if (!isMounted) return;
        setProduct(data.product);
        setReviews(data.reviews || []);
        setSelectedImage((prev) => prev || data.product.mainImage);

        // Fetch related products
        let relProducts: Product[] = [];
        const relRes = await fetch(`/api/products?category=${data.product.categoryId}&limit=4`);
        if (relRes.ok && isMounted) {
          const relData = await relRes.json();
          relProducts = (relData.products || []).filter((p: Product) => p.id !== data.product.id);
          setRelatedProducts(relProducts);
        }

        setCachedProductDetail(slug, {
          product: data.product,
          reviews: data.reviews || [],
          relatedProducts: relProducts,
        });
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProduct();

    const handleProductChange = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.action === 'deleted' && (detail.productId === product?.id || detail.product?.slug === slug)) {
        setProduct(null);
      } else if (
        detail.product &&
        (detail.product.slug === slug || detail.product.id === product?.id)
      ) {
        setProduct((prev) => (prev ? { ...prev, ...detail.product } : detail.product));
      }
    };

    window.addEventListener('fawnic:product_change', handleProductChange);
    return () => {
      isMounted = false;
      window.removeEventListener('fawnic:product_change', handleProductChange);
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-8">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
            <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-100">
          Product Not Found
        </h2>
        <p className="text-xs text-zinc-500">The product you are seeking is no longer available.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Atelier Catalog
        </button>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const discountPercent =
    product.regularPrice > product.salePrice
      ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
      : 0;

  const handleAddToCart = () => {
    if (!checkShoppingAuth(isAuthenticated, onNavigate, {
      action: 'add_to_cart',
      product,
      quantity,
      selectedVariants,
      returnRoute: 'product',
      returnParam: slug,
    })) {
      return;
    }
    addToCart(product, quantity, selectedVariants);
  };

  const handleBuyNow = () => {
    if (!checkShoppingAuth(isAuthenticated, onNavigate, {
      action: 'buy_now',
      product,
      quantity,
      selectedVariants,
      returnRoute: 'product',
      returnParam: slug,
    })) {
      return;
    }
    addToCart(product, quantity, selectedVariants);
    onNavigate('checkout');
  };

  const handleWishlistClick = () => {
    if (!checkShoppingAuth(isAuthenticated, onNavigate, {
      action: 'wishlist',
      product,
      returnRoute: 'product',
      returnParam: slug,
    })) {
      return;
    }
    toggleWishlist(product);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setReviewMessage('Please sign in to post a verified review.');
      return;
    }
    if (!reviewComment.trim()) return;

    try {
      setReviewSubmitting(true);
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewMessage(data.error || 'Failed to submit review');
      } else {
        setReviewMessage('Review submitted successfully! Thank you for rating.');
        setReviewComment('');
        setReviews([data.review, ...reviews]);
      }
    } catch {
      setReviewMessage('Connection error submitting review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getCityDeliveryEstimate = (city: string) => {
    if (city === 'Karachi') return '5–7 Days';
    if (city === 'Lahore' || city === 'Islamabad' || city === 'Rawalpindi')
      return 'Express 24–48 Hours';
    if (city === 'Peshawar' || city === 'Faisalabad' || city === 'Multan')
      return '2–3 Working Days';
    return '3–4 Working Days (TCS / Leopards)';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb */}
      <nav className="text-xs text-zinc-500 flex items-center gap-2">
        <button onClick={() => onNavigate('home')} className="hover:text-zinc-900 dark:hover:text-white cursor-pointer">
          Home
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigate('shop', { category: product.categorySlug })}
          className="hover:text-zinc-900 dark:hover:text-white cursor-pointer"
        >
          {product.categoryName}
        </button>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 shadow-md group">
            {/* Scrollable Gallery Track with Smooth Touch & Snap Animation */}
            <div
              ref={galleryScrollRef}
              onScroll={handleGalleryScroll}
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-x"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              {galleryImages.map((img, idx) => {
                const imgProps = getResponsiveImageProps(img, 720);
                const loaded = isImageLoaded(img);
                return (
                  <div
                    key={`${product.id}-${img}-${idx}`}
                    className="w-full h-full shrink-0 snap-center snap-always relative flex items-center justify-center bg-zinc-100 dark:bg-zinc-900"
                  >
                    <img
                      src={imgProps.src}
                      srcSet={imgProps.srcSet}
                      sizes="(max-width: 640px) 100vw, 600px"
                      alt={`${product.name} - View ${idx + 1}`}
                      width={600}
                      height={600}
                      className="w-full h-full object-cover object-center select-none"
                      loading={idx === 0 || loaded ? 'eager' : 'lazy'}
                      decoding={idx === 0 ? 'sync' : 'async'}
                      onLoad={() => markImageLoaded(img)}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.srcset = '';
                        target.src = getCategoryFallbackImage(product.categoryName || product.categoryId, product.name);
                      }}
                      draggable={false}
                    />
                  </div>
                );
              })}
            </div>

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-bold shadow-xs">
                {discountPercent}% OFF
              </span>
            )}

            {/* Next / Previous Arrow Buttons (when > 1 image) */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollToImage(activeImageIndex - 1)}
                  disabled={activeImageIndex === 0}
                  aria-label="Previous image"
                  className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md shadow-lg border border-white/40 dark:border-zinc-700/50 flex items-center justify-center text-zinc-800 dark:text-zinc-200 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
                    activeImageIndex === 0
                      ? 'opacity-0 pointer-events-none'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5 -ml-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToImage(activeImageIndex + 1)}
                  disabled={activeImageIndex === galleryImages.length - 1}
                  aria-label="Next image"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md shadow-lg border border-white/40 dark:border-zinc-700/50 flex items-center justify-center text-zinc-800 dark:text-zinc-200 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
                    activeImageIndex === galleryImages.length - 1
                      ? 'opacity-0 pointer-events-none'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <ChevronRight className="w-5 h-5 -mr-0.5" />
                </button>
              </>
            )}

            {/* Photo Counter Badge (Mobile & Desktop) */}
            {galleryImages.length > 1 && (
              <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full bg-black/60 dark:bg-black/75 backdrop-blur-md text-[11px] font-medium text-white shadow-xs tracking-wider font-mono pointer-events-none">
                {activeImageIndex + 1} / {galleryImages.length}
              </div>
            )}

            {/* Animated Pagination Indicators (Mobile / Quick Tap) */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 dark:bg-black/50 backdrop-blur-md">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToImage(idx)}
                    aria-label={`Jump to image ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeImageIndex
                        ? 'w-6 bg-white shadow-xs'
                        : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth no-scrollbar">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  ref={(el) => { thumbnailRefs.current[idx] = el; }}
                  onClick={() => scrollToImage(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all duration-200 ${
                    activeImageIndex === idx
                      ? 'border-zinc-950 dark:border-white shadow-md ring-2 ring-amber-700/20 dark:ring-amber-400/20 scale-102'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Form */}
        <div className="space-y-6">
          {/* Atelier Craftsmanship Badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Handcrafted in Karachi Atelier • {product.leatherType || 'Full-Grain Leather'}</span>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-zinc-950 dark:text-zinc-50 leading-tight">
            {product.name}
          </h1>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-3">
            <div className="flex items-center text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(product.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-300 dark:text-zinc-700'
                  }`}
                />
              ))}
              <span className="ml-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-zinc-400">•</span>
            <button
              onClick={() => setActiveTab('reviews')}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              {reviews.length} Verified Customer Reviews
            </button>
            <span className="text-xs text-zinc-400">• SKU: {product.sku}</span>
          </div>

          {/* Price Box */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-baseline gap-3">
            <span className="text-3xl font-bold font-serif text-zinc-950 dark:text-zinc-50">
              Rs. {product.salePrice.toLocaleString()}
            </span>
            {product.regularPrice > product.salePrice && (
              <>
                <span className="text-sm text-zinc-400 line-through">
                  Rs. {product.regularPrice.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Save Rs. {(product.regularPrice - product.salePrice).toLocaleString()}
                </span>
              </>
            )}
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Variants Selectors */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4 pt-2">
              {product.variants.map((variant) => (
                <div key={variant.id} className="space-y-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {variant.name}:{' '}
                    <span className="font-normal text-zinc-500">
                      {selectedVariants[variant.name] || 'Please select'}
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((opt) => {
                      const isSelected = selectedVariants[variant.name] === opt.label;
                      return (
                        <button
                          key={opt.label}
                          onClick={() =>
                            setSelectedVariants((prev) => ({
                              ...prev,
                              [variant.name]: opt.label,
                            }))
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950 shadow-sm'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                {/* Quantity Controls */}
                <div className="flex-1 sm:flex-initial flex items-center justify-between sm:justify-center border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 bg-zinc-50 dark:bg-zinc-900 h-12">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Wishlist Button on Mobile */}
                <button
                  onClick={handleWishlistClick}
                  className={`sm:hidden h-12 w-12 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-center shrink-0 ${
                    isWishlisted
                      ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-600 hover:border-zinc-400'
                  }`}
                  title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                </button>
              </div>

              {/* Add to Bag */}
              <button
                id="product-add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 h-12 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Bag'}</span>
              </button>

              {/* Wishlist Button on Desktop */}
              <button
                onClick={handleWishlistClick}
                className={`hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border transition-all cursor-pointer shadow-xs shrink-0 ${
                  isWishlisted
                    ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-600 hover:border-zinc-400'
                }`}
                title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
              </button>
            </div>

            {/* Instant Buy Now Button */}
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡ Buy Now with 1-Click Checkout</span>
            </button>
          </div>

          {/* Delivery & Assurance Box for Pakistan */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" /> Nationwide Shipping Estimator
              </span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Faisalabad">Faisalabad</option>
                <option value="Multan">Multan</option>
                <option value="Quetta">Quetta</option>
                <option value="Other">Other Pakistani Cities</option>
              </select>
            </div>

            <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                Estimated Delivery to <strong>{selectedCity}</strong>: {getCityDeliveryEstimate(selectedCity)}
              </span>
            </p>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" /> Free Delivery on orders of Rs. 5,000 or more
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cash on Delivery Available
              </span>
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" /> 7-Day Exchange & Refund
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Verified Authentic
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Specs, Verified Reviews */}
      <div className="space-y-6">
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4 sm:gap-8 text-xs sm:text-sm font-bold overflow-x-auto whitespace-nowrap pb-px">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 sm:pb-4 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'desc'
                ? 'text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            Product Story & Overview
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 sm:pb-4 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'specs'
                ? 'text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            Detailed Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 sm:pb-4 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'reviews'
                ? 'text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'desc' && (
          <div className="product-html-description max-w-none text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed overflow-x-auto">
            <div
              dangerouslySetInnerHTML={{
                __html: sanitizeProductHtml(product.description || ''),
              }}
            />
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr className="bg-zinc-50 dark:bg-zinc-950">
                  <td className="p-3.5 font-bold text-zinc-500 w-1/3">Origin</td>
                  <td className="p-3.5 text-zinc-900 dark:text-zinc-100">Handcrafted in Pakistan</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-zinc-500">Atelier Brand</td>
                  <td className="p-3.5 text-zinc-900 dark:text-zinc-100">FAWNIC Leather Atelier</td>
                </tr>
                <tr className="bg-zinc-50 dark:bg-zinc-950">
                  <td className="p-3.5 font-bold text-zinc-500">Category</td>
                  <td className="p-3.5 text-zinc-900 dark:text-zinc-100">{product.categoryName}</td>
                </tr>
                {product.specifications &&
                  Object.entries(product.specifications).map(([k, v]) => (
                    <tr key={k}>
                      <td className="p-3.5 font-bold text-zinc-500">{k}</td>
                      <td className="p-3.5 text-zinc-900 dark:text-zinc-100">{v}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            {/* Write a Review Section */}
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-2xl">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" /> Share Your Experience
              </h4>

              {reviewMessage && (
                <p className="text-xs mb-3 text-emerald-600 dark:text-emerald-400 font-medium">
                  {reviewMessage}
                </p>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Your Rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setReviewRating(s)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Review Details
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell other shoppers in Pakistan about fabric quality, fit, delivery speed..."
                    required
                    className="w-full text-xs p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {reviewSubmitting ? 'Posting...' : 'Submit Verified Review'}
                </button>
              </form>
            </div>

            {/* Existing Reviews List */}
            <div className="space-y-4 max-w-2xl">
              {reviews.length === 0 ? (
                <p className="text-xs text-zinc-400">Be the first to write a review for this product!</p>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {rev.userName}
                        </span>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-amber-400' : 'text-zinc-200 dark:text-zinc-700'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-serif text-zinc-950 dark:text-zinc-50">
              Customers Also Viewed
            </h3>
            <button
              onClick={() => onNavigate('shop', { category: product.categorySlug })}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              More in {product.categoryName} →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((p, idx) => (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
                onQuickView={onQuickView}
                priority={idx < 2}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
