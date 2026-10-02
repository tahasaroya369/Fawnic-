import React, { useState, useRef, useMemo, useEffect } from 'react';
import { X, Star, ShoppingBag, ShieldCheck, Truck, RotateCcw, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useWishlist } from '../../context/WishlistContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { checkShoppingAuth } from '../../utils/authGuard.js';
import { getResponsiveImageProps, getCategoryFallbackImage } from '../../utils/imageAssets.js';
import { isImageLoaded, markImageLoaded } from '../../services/productCache.js';
import type { Product } from '../../types.js';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onNavigate: (route: string, param?: any) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose, onNavigate }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

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
  }, [product?.id]);

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

  if (!product) return null;

  const currentImage = selectedImage || product.mainImage;
  const isWishlisted = isInWishlist(product.id);

  const handleVariantChange = (variantName: string, optionLabel: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: optionLabel,
    }));
  };

  const handleAddToCart = () => {
    if (!checkShoppingAuth(isAuthenticated, onNavigate, {
      action: 'add_to_cart',
      product,
      quantity,
      selectedVariants,
    })) {
      onClose();
      return;
    }
    addToCart(product, quantity, selectedVariants);
    onClose();
  };

  const handleBuyNow = () => {
    if (!checkShoppingAuth(isAuthenticated, onNavigate, {
      action: 'buy_now',
      product,
      quantity,
      selectedVariants,
    })) {
      onClose();
      return;
    }
    addToCart(product, quantity, selectedVariants);
    onClose();
    onNavigate('checkout');
  };

  const handleWishlistClick = () => {
    if (!checkShoppingAuth(isAuthenticated, onNavigate, {
      action: 'wishlist',
      product,
    })) {
      onClose();
      return;
    }
    toggleWishlist(product);
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" />

      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Media Section */}
          <div className="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 group">
              {/* Scrollable Gallery Track */}
              <div
                ref={galleryScrollRef}
                onScroll={handleGalleryScroll}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-x"
                style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
              >
                {galleryImages.map((img, idx) => {
                  const imgProps = getResponsiveImageProps(img, 600);
                  const loaded = isImageLoaded(img);
                  return (
                    <div
                      key={`${product.id}-${img}-${idx}`}
                      className="w-full h-full shrink-0 snap-center snap-always relative flex items-center justify-center bg-zinc-100 dark:bg-zinc-900"
                    >
                      <img
                        src={imgProps.src}
                        srcSet={imgProps.srcSet}
                        sizes="(max-width: 640px) 100vw, 550px"
                        alt={`${product.name} - View ${idx + 1}`}
                        width={500}
                        height={500}
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

              {/* Next / Prev buttons if multiple images */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => scrollToImage(activeImageIndex - 1)}
                    disabled={activeImageIndex === 0}
                    aria-label="Previous"
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow border border-white/30 dark:border-zinc-700/50 flex items-center justify-center text-zinc-800 dark:text-zinc-200 transition-all ${
                      activeImageIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToImage(activeImageIndex + 1)}
                    disabled={activeImageIndex === galleryImages.length - 1}
                    aria-label="Next"
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow border border-white/30 dark:border-zinc-700/50 flex items-center justify-center text-zinc-800 dark:text-zinc-200 transition-all ${
                      activeImageIndex === galleryImages.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Photo Counter Badge */}
              {galleryImages.length > 1 && (
                <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-black/60 dark:bg-black/75 backdrop-blur-md text-[10px] font-medium text-white shadow-xs tracking-wider font-mono pointer-events-none">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              )}

              {/* Pagination Dots */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-black/30 dark:bg-black/50 backdrop-blur-md">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => scrollToImage(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 mt-3 sm:mt-4 overflow-x-auto pb-1 scroll-smooth no-scrollbar">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    ref={(el) => { thumbnailRefs.current[idx] = el; }}
                    onClick={() => scrollToImage(idx)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all duration-200 ${
                      activeImageIndex === idx
                        ? 'border-zinc-900 dark:border-white scale-105 shadow-sm'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-4 sm:p-6 flex flex-col justify-between max-h-[75vh] md:max-h-[80vh] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span className="font-medium text-amber-800 dark:text-amber-400">
                  {product.leatherType || 'Full-Grain Italian Cowhide'}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                  {product.stockStatus === 'in_stock' ? 'In Stock (Karachi Atelier)' : 'Crafting in Atelier'}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {product.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="ml-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-zinc-400">({product.reviewCount} reviews)</span>
              </div>

              {/* Pricing */}
              <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-zinc-50 font-serif">
                  Rs. {product.salePrice.toLocaleString()}
                </span>
                {product.regularPrice > product.salePrice && (
                  <span className="text-xs sm:text-sm text-zinc-400 line-through">
                    Rs. {product.regularPrice.toLocaleString()}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 sm:mt-3 line-clamp-3 leading-relaxed">
                {product.shortDescription}
              </p>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-4 sm:mt-5 space-y-3">
                  {product.variants.map((v) => (
                    <div key={v.id}>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                        {v.name}: {selectedVariants[v.name] || 'Select'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5">
                        {v.options.map((opt) => {
                          const isSelected = selectedVariants[v.name] === opt.label;
                          return (
                            <button
                              key={opt.label}
                              onClick={() => handleVariantChange(v.name, opt.label)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950 shadow-xs'
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
            </div>

            {/* Actions */}
            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5 sm:space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  {/* Quantity */}
                  <div className="flex-1 sm:flex-initial flex items-center justify-between sm:justify-center border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 bg-zinc-50 dark:bg-zinc-950 h-11">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Wishlist on Mobile */}
                  <button
                    onClick={handleWishlistClick}
                    className={`sm:hidden h-11 w-11 flex items-center justify-center rounded-xl border transition-colors cursor-pointer shrink-0 ${
                      isWishlisted
                        ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-11 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Bag
                </button>

                {/* Wishlist on Desktop */}
                <button
                  onClick={handleWishlistClick}
                  className={`hidden sm:flex h-11 w-11 items-center justify-center rounded-xl border transition-colors cursor-pointer shrink-0 ${
                    isWishlisted
                      ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                </button>
              </div>

              {/* Buy Now button */}
              <button
                onClick={handleBuyNow}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                ⚡ Buy Now (Instant Checkout)
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigate('product', product.slug);
                }}
                className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-semibold pt-1 cursor-pointer"
              >
                View Full Product Specs & Customer Reviews →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
