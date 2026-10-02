import React, { useState, useMemo } from 'react';
import { Star, Heart, ShoppingBag, Eye, Shield } from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useWishlist } from '../../context/WishlistContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { checkShoppingAuth } from '../../utils/authGuard.js';
import { getCategoryFallbackImage, getResponsiveImageProps } from '../../utils/imageAssets.js';
import { isImageLoaded, markImageLoaded } from '../../services/productCache.js';
import type { Product } from '../../types.js';

interface ProductCardProps {
  product: Product;
  onNavigate: (route: string, param?: any) => void;
  onQuickView?: (product: Product) => void;
  priority?: boolean;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  onQuickView,
  priority = false,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const discountPercent =
    product.regularPrice > product.salePrice
      ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
      : 0;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checkShoppingAuth(isAuthenticated, onNavigate, { action: 'wishlist', product })) {
      return;
    }
    toggleWishlist(product);
  };

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock === 0) return;
    if (!checkShoppingAuth(isAuthenticated, onNavigate, { action: 'add_to_cart', product, quantity: 1 })) {
      return;
    }
    addToCart(product, 1);
  };

  // Only enable desktop hover image swap on devices with fine pointer (mouse), never on mobile touch
  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setIsHovered(true);
    }
  };

  const secondImage =
    product.images && product.images.length > 1 && product.images[1] && product.images[1] !== product.mainImage
      ? product.images[1]
      : null;

  const mainImageProps = useMemo(
    () => getResponsiveImageProps(product.mainImage, 420),
    [product.mainImage]
  );

  const secondImageProps = useMemo(
    () => (secondImage ? getResponsiveImageProps(secondImage, 420) : null),
    [secondImage]
  );

  // If the image was already loaded in this session, load eagerly so scrolling back is instant with 0 delay
  const alreadyLoaded = isImageLoaded(product.mainImage);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden hover:shadow-xl transition-all duration-200 min-w-0"
    >
      {/* Product Image Stage */}
      <div
        onClick={() => onNavigate('product', product.slug)}
        className="relative aspect-square w-full overflow-hidden bg-stone-100 dark:bg-stone-800 cursor-pointer"
      >
        <img
          src={mainImageProps.src}
          srcSet={mainImageProps.srcSet}
          sizes={mainImageProps.sizes}
          alt={product.name}
          width={400}
          height={400}
          loading={priority || alreadyLoaded ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => markImageLoaded(product.mainImage)}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.srcset = '';
            target.src = getCategoryFallbackImage(
              product.categoryName || product.categoryId,
              product.name
            );
          }}
          className={`h-full w-full object-cover object-center transition-all duration-200 ease-out group-hover:scale-104 ${
            secondImage && isHovered ? 'group-hover:opacity-0' : ''
          }`}
        />

        {secondImage && isHovered && secondImageProps && (
          <img
            src={secondImageProps.src}
            srcSet={secondImageProps.srcSet}
            sizes={secondImageProps.sizes}
            alt={`${product.name} perspective`}
            width={400}
            height={400}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out group-hover:scale-104"
          />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
          {discountPercent > 0 && (
            <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-amber-800 text-amber-50 shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.isBestSeller && (
            <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-stone-900 text-amber-300 shadow-xs">
              ★ Signature
            </span>
          )}
          {product.isNewArrival && (
            <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs">
              New
            </span>
          )}
        </div>

        {/* Top-Right Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-transform duration-200 hover:scale-110 cursor-pointer shadow-xs z-10 ${
            isWishlisted
              ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-600 dark:text-stone-300 hover:text-rose-600'
          }`}
          title={isWishlisted ? 'Remove from saved' : 'Save to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Quick View Button (Desktop Hover overlay) */}
        {onQuickView && (
          <div className="hidden sm:flex absolute inset-x-3 bottom-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="flex-1 py-2 bg-stone-950/90 hover:bg-stone-950 text-white dark:bg-white/90 dark:hover:bg-white dark:text-stone-950 backdrop-blur-md rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Quick View
            </button>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        {/* Leather Grade & Category Header */}
        <div className="flex items-center justify-between gap-1 text-[9px] sm:text-[11px] text-stone-500 dark:text-stone-400 mb-1 sm:mb-1.5">
          <span className="flex items-center gap-1 font-medium text-amber-800 dark:text-amber-400 truncate">
            <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-700 dark:text-amber-500 shrink-0" />
            <span className="truncate">{product.vendorStoreName || product.leatherType || 'Full-Grain'}</span>
          </span>
          <span className="shrink-0 text-stone-400 truncate hidden min-[380px]:inline">• {product.categoryName}</span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onNavigate('product', product.slug)}
          className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 hover:text-amber-800 dark:hover:text-amber-400 cursor-pointer transition-colors leading-tight"
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 sm:gap-1.5 mt-1 sm:mt-2">
          <div className="flex items-center text-amber-500">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500" />
            <span className="ml-1 text-[11px] sm:text-xs font-bold text-stone-900 dark:text-stone-100">
              {product.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-stone-400">({product.reviewCount})</span>
        </div>

        {/* Price & Stock Row */}
        <div className="mt-auto pt-2.5 sm:pt-4 flex items-end sm:items-center justify-between gap-1">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-xs sm:text-base font-bold text-stone-950 dark:text-stone-50 font-serif truncate">
                Rs. {product.salePrice.toLocaleString()}
              </span>
              {product.regularPrice > product.salePrice && (
                <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                  Rs. {product.regularPrice.toLocaleString()}
                </span>
              )}
            </div>
            {product.stock <= product.lowStockThreshold && product.stock > 0 && (
              <span className="text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate">
                Only {product.stock} left
              </span>
            )}
          </div>

          {/* Quick Add Button */}
          <button
            onClick={handleQuickAddClick}
            disabled={product.stock === 0}
            className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              product.stock === 0
                ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                : 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 hover:scale-105 active:scale-95'
            }`}
            title={product.stock === 0 ? 'Out of Stock' : 'Add to Bag'}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductCard = React.memo(ProductCardComponent);

