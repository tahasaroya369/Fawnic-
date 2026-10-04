import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { CartItem, Product, ProductVariation } from '../types.js';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    quantity?: number,
    selectedVariants?: Record<string, string>,
    selectedVariation?: ProductVariation
  ) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('fawnic_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fawnic_coupon') || null;
    } catch {
      return null;
    }
  });

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('fawnic_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [items]);

  // Standard shipping in Pakistan is Rs. 250, free over Rs. 5,000
  const shippingFee = useMemo(() => {
    if (items.length === 0) return 0;
    return subtotal >= 5000 ? 0 : 250;
  }, [subtotal, items.length]);

  // Recalculate coupon discount whenever subtotal or couponCode changes
  useEffect(() => {
    if (!couponCode || subtotal === 0) {
      setDiscountAmount(0);
      return;
    }

    fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, cartSubtotal: subtotal }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setDiscountAmount(data.discountAmount);
        } else {
          setCouponCode(null);
          localStorage.removeItem('fawnic_coupon');
          setDiscountAmount(0);
        }
      })
      .catch(() => {
        setDiscountAmount(0);
      });
  }, [couponCode, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + shippingFee);
  }, [subtotal, discountAmount, shippingFee]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedVariants?: Record<string, string>,
    selectedVariation?: ProductVariation
  ) => {
    const colorName =
      selectedVariation?.color ||
      (selectedVariation?.type !== 'size' && !selectedVariation?.size ? selectedVariation?.name : undefined) ||
      selectedVariants?.['Color'];
    const sizeName =
      selectedVariation?.size ||
      (selectedVariation?.type === 'size' ? selectedVariation?.name : undefined) ||
      selectedVariants?.['Size'] ||
      selectedVariants?.['Waist Size'];

    const finalVariants: Record<string, string> = {
      ...(selectedVariants || {}),
      ...(colorName ? { Color: colorName } : {}),
      ...(sizeName ? { Size: sizeName } : {}),
    };

    const variantKey = [
      colorName ? `col_${colorName}` : '',
      sizeName ? `sz_${sizeName}` : '',
      selectedVariation?.id ? `id_${selectedVariation.id}` : '',
      ...Object.entries(finalVariants)
        .filter(([k]) => k !== 'Color' && k !== 'Size' && k !== 'Waist Size')
        .map(([k, v]) => `${k}_${v}`),
    ]
      .filter(Boolean)
      .join('__');

    const cartItemId = variantKey ? `${product.id}__${variantKey}` : product.id;
    const availableStock = selectedVariation?.stock !== undefined ? selectedVariation.stock : product.stock;

    setItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === cartItemId);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = Math.min(availableStock, updated[existingIdx].quantity + quantity);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          selectedVariation: selectedVariation || updated[existingIdx].selectedVariation,
          selectedColor: colorName,
          selectedSize: sizeName,
        };
        return updated;
      } else {
        const unitPrice = product.salePrice || product.regularPrice;
        return [
          ...prev,
          {
            id: cartItemId,
            productId: product.id,
            product,
            quantity: Math.min(availableStock, quantity),
            selectedVariants: Object.keys(finalVariants).length > 0 ? finalVariants : undefined,
            selectedVariation,
            selectedColor: colorName,
            selectedSize: sizeName,
            unitPrice,
          },
        ];
      }
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity: Math.min(item.product.stock, quantity) }
          : item
      )
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode(null);
    localStorage.removeItem('fawnic_coupon');
    setDiscountAmount(0);
  };

  const applyCoupon = async (code: string) => {
    if (!code || !code.trim()) {
      return { success: false, message: 'Please enter a coupon code.' };
    }

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), cartSubtotal: subtotal }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.error || 'Invalid coupon code' };
      }

      setCouponCode(data.code);
      localStorage.setItem('fawnic_coupon', data.code);
      setDiscountAmount(data.discountAmount);
      return { success: true, message: `Coupon applied: Rs. ${data.discountAmount.toLocaleString()} saved!` };
    } catch {
      return { success: false, message: 'Network error validating coupon' };
    }
  };

  const removeCoupon = () => {
    setCouponCode(null);
    localStorage.removeItem('fawnic_coupon');
    setDiscountAmount(0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shippingFee,
        discountAmount,
        couponCode,
        total,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
