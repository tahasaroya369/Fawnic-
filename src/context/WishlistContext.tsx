import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.js';
import { useCart } from './CartContext.js';
import type { Product } from '../types.js';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  moveToCart: (product: Product) => void;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fawnic_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync with server if logged in
  const fetchServerWishlist = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/customer/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(data.productIds);
        setWishlistProducts(data.products);
        try {
          localStorage.setItem('fawnic_wishlist', JSON.stringify(data.productIds));
        } catch {}
      }
    } catch (err) {
      console.error('Error fetching server wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchServerWishlist();
    }
  }, [user, fetchServerWishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('fawnic_wishlist', JSON.stringify(wishlistIds));
    } catch {}
  }, [wishlistIds]);

  const isInWishlist = (productId: string) => {
    return wishlistIds.includes(productId);
  };

  const toggleWishlist = async (product: Product) => {
    const exists = wishlistIds.includes(product.id);
    let updatedIds: string[];

    if (exists) {
      updatedIds = wishlistIds.filter((id) => id !== product.id);
      setWishlistProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      updatedIds = [...wishlistIds, product.id];
      setWishlistProducts((prev) => [product, ...prev]);
    }
    setWishlistIds(updatedIds);

    if (token) {
      try {
        await fetch('/api/customer/wishlist/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product.id }),
        });
      } catch (err) {
        console.error('Failed to sync wishlist with server:', err);
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
    setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));

    if (token) {
      try {
        await fetch('/api/customer/wishlist/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });
      } catch (err) {
        console.error('Failed to sync wishlist removal with server:', err);
      }
    }
  };

  const moveToCart = (product: Product) => {
    addToCart(product, 1);
    toggleWishlist(product);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        moveToCart,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
