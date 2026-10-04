import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { checkShoppingAuth } from '../../utils/authGuard.js';

interface CartDrawerProps {
  onNavigate: (route: string, param?: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate, isOpen, onClose }) => {
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    discountAmount,
    couponCode,
    total,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { isAuthenticated } = useAuth();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const visible = isOpen !== undefined ? (isOpen || isCartOpen) : isCartOpen;

  const handleClose = () => {
    setIsCartOpen(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setIsApplying(true);
    setCouponMsg(null);
    const res = await applyCoupon(inputCoupon);
    setIsApplying(false);
    setCouponMsg({ text: res.message, isError: !res.success });
    if (res.success) setInputCoupon('');
  };

  const freeShippingNeeded = Math.max(0, 5000 - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / 5000) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-stone-50 dark:bg-stone-900 border-l border-stone-200/80 dark:border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Shopping Bag</h2>
                <p className="text-[11px] text-stone-400 font-medium">
                  {itemCount} {itemCount === 1 ? 'handcrafted item' : 'handcrafted items'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
              aria-label="Close Shopping Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-stone-100/70 dark:bg-stone-950/60 px-5 py-3 border-b border-stone-200/70 dark:border-stone-800">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span>
                {freeShippingNeeded === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <span>✨</span> Free Delivery on orders of Rs. 5,000 or more.
                  </span>
                ) : (
                  <span className="text-stone-600 dark:text-stone-300">
                    Add <strong className="text-stone-900 dark:text-stone-100 font-bold">Rs. {freeShippingNeeded.toLocaleString()}</strong> more for FREE Delivery!
                  </span>
                )}
              </span>
              <span className="text-stone-400 text-[11px]">{Math.round(freeShippingProgress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-900 dark:bg-stone-100 rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Items Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-6">
                <div className="w-20 h-20 rounded-3xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 shadow-md flex items-center justify-center text-stone-400 mb-5">
                  <ShoppingBag className="w-9 h-9 stroke-1 text-stone-400 dark:text-stone-500" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Your shopping bag is empty</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mt-1.5 mb-6 leading-relaxed">
                  Discover full-grain leather wallets, bespoke belts, precision chronographs, and premium men's accessories.
                </p>
                <button
                  onClick={() => {
                    handleClose();
                    onNavigate('shop');
                  }}
                  className="px-6 py-3 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-xl text-xs font-bold tracking-wider uppercase shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white dark:bg-stone-900/90 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex gap-3.5 transition-all hover:border-stone-300 dark:hover:border-stone-700"
                >
                  <img
                    src={item.selectedVariation?.image || item.product.mainImage}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200/70 dark:border-stone-800 shadow-xs"
                  />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer p-1 -mr-1 -mt-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {(item.selectedColor || item.selectedVariation?.color || (item.selectedVariation && item.selectedVariation.type !== 'size' && !item.selectedVariation.size && item.selectedVariation.name)) && (
                      <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 mt-0.5">
                        Color: {item.selectedColor || item.selectedVariation?.color || item.selectedVariation?.name}
                      </p>
                    )}

                    {(item.selectedSize || item.selectedVariation?.size || item.selectedVariants?.['Size'] || (item.selectedVariation && item.selectedVariation.type === 'size' && item.selectedVariation.name)) && (
                      <p className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 mt-0.5">
                        Size: {item.selectedSize || item.selectedVariation?.size || item.selectedVariants?.['Size'] || item.selectedVariation?.name}
                      </p>
                    )}

                    <p className="text-[10px] text-stone-400 font-mono">
                      SKU: {item.selectedVariation?.sku || item.product.sku}
                    </p>

                    {item.selectedVariants && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(item.selectedVariants)
                          .filter(([key]) => key !== 'Color' && key !== 'Size' && key !== 'Waist Size')
                          .map(([key, val]) => (
                            <span
                              key={key}
                              className="inline-block px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] text-stone-600 dark:text-stone-300 font-medium"
                            >
                              {key}: {val}
                            </span>
                          ))}
                      </div>
                    )}

                    <div className="mt-auto pt-2 flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden bg-stone-50 dark:bg-stone-800 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-stone-900 dark:text-stone-100 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-stone-950 dark:text-stone-50 font-serif">
                          Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[10px] text-stone-400">
                            Rs. {item.unitPrice.toLocaleString()} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
              {/* Coupon Code Section */}
              {couponCode ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Promo Applied: {couponCode}</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-emerald-700 dark:text-emerald-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    placeholder="Coupon (e.g. FAWNICPK)"
                    className="flex-1 px-3 py-2 text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 uppercase tracking-wider font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold hover:opacity-90 cursor-pointer shrink-0 transition-opacity"
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponMsg && (
                <p className={`text-[11px] font-medium ${couponMsg.isError ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {couponMsg.text}
                </p>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-500 dark:text-stone-400">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    Rs. {subtotal.toLocaleString()}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Discount Code Savings</span>
                    <span>- Rs. {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-stone-500 dark:text-stone-400">
                  <span>Delivery</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
                    ) : (
                      <span className="font-semibold text-stone-900 dark:text-stone-100">Standard Delivery: Rs. 250</span>
                    )}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400">
                  {shippingFee === 0 ? 'Free Delivery on orders of Rs. 5,000 or more.' : 'Orders of Rs. 5,000+ get FREE delivery.'}
                </div>
                {subtotal >= 5000 && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                    ⚡ Get 7% cashback on online orders of Rs. 5,000 or more. Cashback is credited within 24 hours.
                  </div>
                )}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-between text-sm font-bold text-stone-950 dark:text-stone-50">
                  <span>Estimated Total</span>
                  <span className="font-serif text-base">Rs. {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleClose();
                    if (!checkShoppingAuth(isAuthenticated, onNavigate, { action: 'checkout', returnRoute: 'checkout' })) {
                      return;
                    }
                    onNavigate('checkout');
                  }}
                  className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleClose();
                      onNavigate('cart');
                    }}
                    className="py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer text-center"
                  >
                    View Cart Details
                  </button>
                  <button
                    onClick={() => {
                      handleClose();
                      onNavigate('shop');
                    }}
                    className="py-2.5 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer text-center"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Cash on Delivery & 7-Day Hassle-Free Returns</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
