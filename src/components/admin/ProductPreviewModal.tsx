import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Check,
  Layers,
  Smartphone,
  Monitor,
  Eye,
  Star,
} from 'lucide-react';
import type { Product } from '../../types.js';
import { sanitizeProductHtml } from '../../utils/sanitize.js';

interface ProductPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen || !product) return null;

  const gallery = Array.from(
    new Set([product.mainImage, ...(product.images || [])].filter(Boolean))
  );
  const activeImg = gallery[selectedImgIndex] || product.mainImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              Live Storefront Preview
            </span>
            <span className="text-stone-400 font-mono hidden sm:inline text-[11px]">
              SKU: {product.sku}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop / Mobile view toggle */}
            <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`p-1.5 rounded text-xs transition flex items-center gap-1 ${
                  viewMode === 'desktop'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px]">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`p-1.5 rounded text-xs transition flex items-center gap-1 ${
                  viewMode === 'mobile'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-stone-400 hover:text-white'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px]">Mobile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Viewport Container */}
        <div className="flex-1 overflow-y-auto bg-stone-950 p-4 sm:p-8 flex justify-center">
          <div
            className={`transition-all duration-300 w-full ${
              viewMode === 'mobile'
                ? 'max-w-sm bg-white dark:bg-zinc-950 text-stone-900 dark:text-stone-100 rounded-3xl border border-stone-800 p-4 shadow-2xl'
                : 'max-w-4xl bg-white dark:bg-zinc-950 text-stone-900 dark:text-stone-100 rounded-2xl border border-stone-200 dark:border-zinc-800 p-6 sm:p-10 shadow-xl'
            }`}
          >
            {/* Atelier Brand Watermark */}
            <div className="border-b border-stone-200 dark:border-zinc-800 pb-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg tracking-widest text-stone-950 dark:text-white uppercase">
                  FAWNIC
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-serif tracking-widest uppercase">
                  Atelier
                </span>
              </div>
              <span className="text-[10px] text-stone-400 uppercase font-mono">
                {product.status === 'published' ? '● Live' : `○ Status: ${product.status}`}
              </span>
            </div>

            <div
              className={`grid gap-8 ${
                viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
              }`}
            >
              {/* Product Gallery Showcase */}
              <div className="space-y-4">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 group shadow-md">
                  <img
                    src={activeImg}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {product.salePrice < product.regularPrice && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-amber-600 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-md shadow-md">
                      Special Atelier Price
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-stone-950/80 backdrop-blur-md text-amber-400 font-serif text-[10px] font-bold uppercase tracking-widest rounded-md border border-amber-500/30">
                      Featured Piece
                    </span>
                  )}
                </div>

                {/* Thumbnails */}
                {gallery.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {gallery.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImgIndex(i)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                          selectedImgIndex === i
                            ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
                            : 'border-stone-200 dark:border-zinc-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt="thumbnail"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details & Actions */}
              <div className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Category & Leather Grade */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-stone-300 font-semibold font-serif">
                      {product.categoryName}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-serif text-xs font-medium">
                      • {product.leatherType || 'Full-Grain Vegetable Tanned'}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 leading-tight">
                    {product.name}
                  </h1>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif font-bold text-2xl text-amber-600 dark:text-amber-400">
                      Rs. {product.salePrice.toLocaleString()}
                    </span>
                    {product.regularPrice > product.salePrice && (
                      <span className="text-stone-400 text-base line-through font-serif">
                        Rs. {product.regularPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-stone-500">Tax inclusive (PKR)</span>
                  </div>

                  {/* Short Description */}
                  {product.shortDescription && (
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                      {product.shortDescription}
                    </p>
                  )}

                  {/* Stock Notice */}
                  <div className="flex items-center gap-2 text-xs">
                    {product.stock > product.lowStockThreshold ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Check className="w-4 h-4" /> Ready in Lahore Atelier ({product.stock} units available)
                      </span>
                    ) : product.stock > 0 ? (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                        <Layers className="w-4 h-4" /> Limited Edition: Only {product.stock} pieces remaining
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                        Currently Made-to-Order (Out of Stock)
                      </span>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      disabled={product.stock === 0}
                      className="w-full py-3.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-serif font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-amber-600 dark:hover:bg-amber-500 transition shadow-lg disabled:opacity-50"
                    >
                      Acquire Atelier Piece
                    </button>
                    <p className="text-center text-[11px] text-stone-500">
                      Doorstep Delivery across Pakistan • Complimentary for orders over Rs. 5,000
                    </p>
                  </div>

                  {/* Extended Story / Description */}
                  {product.description && (
                    <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 space-y-2">
                      <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100">
                        Atelier Craftsmanship & Materials
                      </h4>
                      <div
                        className="product-html-description text-xs text-stone-600 dark:text-stone-300 leading-relaxed overflow-x-auto"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeProductHtml(product.description),
                        }}
                      />
                    </div>
                  )}

                  {/* Atelier Guarantees */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-stone-200 dark:border-zinc-800 text-center">
                    <div className="p-2 bg-stone-50 dark:bg-zinc-900 rounded-xl space-y-1">
                      <ShieldCheck className="w-4 h-4 text-amber-500 mx-auto" />
                      <span className="block text-[10px] font-semibold text-stone-700 dark:text-stone-300">
                        1-Year Warranty
                      </span>
                    </div>
                    <div className="p-2 bg-stone-50 dark:bg-zinc-900 rounded-xl space-y-1">
                      <Truck className="w-4 h-4 text-amber-500 mx-auto" />
                      <span className="block text-[10px] font-semibold text-stone-700 dark:text-stone-300">
                        TCS / Leopards
                      </span>
                    </div>
                    <div className="p-2 bg-stone-50 dark:bg-zinc-900 rounded-xl space-y-1">
                      <RotateCcw className="w-4 h-4 text-amber-500 mx-auto" />
                      <span className="block text-[10px] font-semibold text-stone-700 dark:text-stone-300">
                        7-Day Doorstep Inspect
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
