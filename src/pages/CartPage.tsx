import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Tag,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { checkShoppingAuth } from '../utils/authGuard.js';

interface CartPageProps {
  onNavigate: (route: string, param?: any) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    discountAmount,
    couponCode,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async (e: React.FormEvent) => {
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

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-zinc-950 dark:text-zinc-50">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Explore authentic festive clothing, handcrafted Peshawari chappals, and smart gadgets from verified Pakistani sellers.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 transition-all cursor-pointer"
        >
          Explore Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-zinc-950 dark:text-zinc-50">
            Shopping Bag
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review your {itemCount} selected item(s) before secure checkout
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
        >
          Clear Bag
        </button>
      </div>

      {/* Free Delivery Bar */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
          <span>
            {freeShippingNeeded === 0
              ? '🎉 Free Delivery on orders of Rs. 5,000 or more.'
              : `Add Rs. ${freeShippingNeeded.toLocaleString()} more to unlock FREE Delivery across Pakistan.`}
          </span>
          <span>{Math.round(freeShippingProgress)}%</span>
        </div>
        <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((item) => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <img
                  src={item.selectedVariation?.image || item.product.mainImage}
                  alt={item.product.name}
                  className="w-24 h-24 rounded-2xl object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-800"
                />

                <div className="flex-1 min-w-0">
                  <h3
                    onClick={() => onNavigate('product', item.product.slug)}
                    className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 cursor-pointer line-clamp-1"
                  >
                    {item.product.name}
                  </h3>

                  {item.selectedVariation && (
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mt-0.5">
                      Color: {item.selectedVariation.name}
                    </p>
                  )}

                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    SKU: {item.selectedVariation?.sku || item.product.sku}
                  </p>

                  <p className="text-xs text-zinc-500 mt-0.5">Sold by: {item.product.vendorStoreName}</p>

                  {item.selectedVariants && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(item.selectedVariants)
                        .filter(([k]) => k !== 'Color')
                        .map(([k, v]) => (
                          <span
                            key={k}
                            className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[11px] text-zinc-600 dark:text-zinc-300"
                          >
                            {k}: {v}
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="mt-2 text-xs font-bold text-zinc-950 dark:text-zinc-50 font-serif">
                    Rs. {item.unitPrice.toLocaleString()} each
                  </div>
                </div>

                {/* Quantity & Controls */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                  <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-l-xl cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-r-xl cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-zinc-950 dark:text-zinc-50 font-serif">
                      Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-zinc-400 hover:text-rose-600 transition-colors flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-2">
            <button
              onClick={() => onNavigate('shop')}
              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              ← Continue Shopping in Pakistan
            </button>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
            <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">Order Summary</h2>

            {/* Promo Code Box */}
            <div>
              {couponCode ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                    <Tag className="w-4 h-4" />
                    <span>Applied: {couponCode}</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      placeholder="Discount Voucher"
                      className="flex-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs uppercase font-semibold focus:outline-none focus:border-zinc-900"
                    />
                    <button
                      type="submit"
                      disabled={isApplying}
                      className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                    >
                      {isApplying ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponMsg && (
                    <p className={`text-[11px] ${couponMsg.isError ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {couponMsg.text}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Calculations */}
            <div className="space-y-2.5 text-xs border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Coupon Discount</span>
                  <span>- Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                <span>Delivery</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">FREE</span>
                  ) : (
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">Standard Delivery: Rs. 250</span>
                  )}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                {shippingFee === 0 ? 'Free Delivery on orders of Rs. 5,000 or more.' : 'Orders of Rs. 5,000+ get FREE delivery.'}
              </div>
              {subtotal >= 5000 && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  ⚡ Get 7% cashback on online orders of Rs. 5,000 or more. Cashback is credited within 24 hours.
                </div>
              )}

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-base font-bold text-zinc-950 dark:text-zinc-50">
                <span>Total (PKR)</span>
                <span className="font-serif">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                if (!checkShoppingAuth(isAuthenticated, onNavigate, { action: 'checkout', returnRoute: 'checkout' })) {
                  return;
                }
                onNavigate('checkout');
              }}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust Assurances */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-[11px] text-zinc-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Express Courier (TCS / Leopards) across Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cash on Delivery (COD) payment verified at delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>7-Day Return and Exchange Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
