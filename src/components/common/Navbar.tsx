import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck,
  LogOut,
  Package,
  MapPin,
  Compass,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useCart } from '../../context/CartContext.js';
import { useWishlist } from '../../context/WishlistContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Logo } from './Logo.js';
import { NotificationBell } from './NotificationBell.js';
import type { Product } from '../../types.js';

interface NavbarProps {
  onNavigate: (route: string, param?: any) => void;
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenCart }) => {
  const { user, token, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      onNavigate('shop', { search: searchQuery.trim() });
    }
  };

  const handleOpenCart = () => {
    setIsCartOpen(true);
    if (onOpenCart) {
      onOpenCart();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors duration-200">
      {/* Top Announcement Bar */}
      <div className="bg-stone-900 text-stone-200 px-3 sm:px-4 py-1.5 text-xs font-medium border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="tracking-wide text-[11px] sm:text-xs truncate">
              Free Express Delivery on Orders Over Rs. 5,000 • Cash on Delivery (COD)
            </span>
          </div>
          <div className="hidden md:flex items-center gap-5 text-stone-300 text-xs shrink-0">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Pakistan (PKR)
            </span>
            <button
              onClick={() => onNavigate('track')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Track Order
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Our Craftsmanship
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Customer Care
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-2 min-[360px]:px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 min-[360px]:h-16 sm:h-20 gap-1 min-[360px]:gap-2 sm:gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              id="fawnic-brand-logo-btn"
              onClick={() => onNavigate('home')}
              className="text-left cursor-pointer focus:outline-none"
            >
              <Logo size="md" showText={true} />
            </button>
          </div>

          {/* Search Bar with Live Dropdown (Desktop) */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-lg relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                id="main-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                placeholder="Search bifold wallets, solid brass belts, card sleeves..."
                className="w-full pl-11 pr-24 py-2.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800 dark:focus:ring-amber-500 focus:bg-white dark:focus:bg-stone-950 transition-all"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-full text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Live Search Suggestions Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center text-xs text-stone-500">
                  <span>Atelier Catalog Matches</span>
                  {isSearching && <span className="animate-pulse text-amber-700 dark:text-amber-400">Searching...</span>}
                </div>
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-80 overflow-y-auto">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                          onNavigate('product', item.slug);
                        }}
                        className="p-3 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer transition-colors"
                      >
                        <img
                          src={item.mainImage}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-stone-100 dark:bg-stone-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-stone-500 truncate">
                            {item.categoryName} • {item.leatherType || 'Full-Grain'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-stone-950 dark:text-stone-50">
                            Rs. {item.salePrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setShowSearchDropdown(false);
                        onNavigate('shop', { search: searchQuery });
                      }}
                      className="w-full py-2.5 bg-stone-50 dark:bg-stone-800/40 text-center text-xs font-semibold text-stone-900 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-400 cursor-pointer"
                    >
                      View all results for &ldquo;{searchQuery}&rdquo; →
                    </button>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-stone-400">
                    No leather goods matching &ldquo;{searchQuery}&rdquo; found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons & User Controls */}
          <div className="flex items-center gap-0.5 min-[360px]:gap-1 sm:gap-2 shrink-0">
            {/* Mobile Search Icon Toggle */}
            <button
              id="mobile-search-toggle-btn"
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                if (mobileMenuOpen) setMobileMenuOpen(false);
              }}
              className="md:hidden p-1 min-[360px]:p-1.5 sm:p-2 rounded-full text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Toggle search"
            >
              <Search className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-1 min-[360px]:p-1.5 sm:p-2.5 rounded-full text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Notification Bell */}
            <NotificationBell token={token} onNavigate={onNavigate} />

            {/* Wishlist Button */}
            <button
              id="nav-wishlist-btn"
              onClick={() => onNavigate('profile', { tab: 'wishlist' })}
              className="relative p-1 min-[360px]:p-1.5 sm:p-2.5 rounded-full text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title="Saved Items"
              aria-label="Wishlist"
            >
              <Heart className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-5 sm:h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:top-1.5 sm:right-1.5 min-w-[14px] h-[14px] min-[360px]:min-w-[16px] min-[360px]:h-[16px] sm:min-w-[16px] sm:h-[16px] px-0.5 rounded-full bg-amber-700 text-white text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-bold flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              id="nav-cart-btn"
              onClick={handleOpenCart}
              className="relative flex items-center justify-center gap-1 sm:gap-1.5 p-1 min-[360px]:p-1.5 sm:px-3.5 sm:py-2 rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-950 transition-colors cursor-pointer shadow-xs shrink-0"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 text-white dark:text-stone-900" />
              <span className="text-xs font-bold hidden sm:inline">Bag</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-5 sm:h-5 rounded-full bg-amber-600 text-white text-[8px] min-[360px]:text-[9px] sm:text-xs font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account / Login Dropdown - Fully responsive and visible on mobile & desktop */}
            <div ref={userMenuRef} className="relative block shrink-0">
              {user ? (
                <button
                  id="nav-user-profile-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-0.5 sm:px-2.5 sm:py-1.5 rounded-full border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900 transition-colors cursor-pointer shrink-0"
                  title={user.name}
                  aria-label="User Account"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-5 h-5 min-[360px]:w-6 min-[360px]:h-6 sm:w-7 sm:h-7 rounded-full object-cover bg-stone-200"
                  />
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 hidden md:inline max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:inline" />
                </button>
              ) : (
                <button
                  id="nav-login-btn"
                  onClick={() => onNavigate('login')}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 p-1 min-[360px]:p-1.5 sm:px-4 sm:py-2 rounded-full border border-stone-300 dark:border-stone-700 hover:border-stone-400 text-stone-800 dark:text-stone-200 text-xs font-semibold tracking-wide transition-all cursor-pointer shrink-0"
                  title="Sign In"
                  aria-label="Sign In"
                >
                  <User className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Account Dropdown Menu */}
              {user && userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-stone-100 dark:border-stone-800">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{user.name}</p>
                    <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                    <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {user.role === 'admin' ? 'Atelier Admin' : 'Verified Member'}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('profile', { tab: 'overview' });
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-stone-400" /> Account Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('profile', { tab: 'orders' });
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-stone-400" /> My Orders & Tracking
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('profile', { tab: 'notifications' });
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-stone-400" /> Notifications & Alerts
                    </button>
                  </div>

                  <div className="border-t border-stone-100 dark:border-stone-800 pt-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        onNavigate('home');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (mobileSearchOpen) setMobileSearchOpen(false);
              }}
              className="p-1 min-[360px]:p-1.5 sm:p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 md:hidden transition-colors cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {mobileSearchOpen && (
          <div className="md:hidden py-2.5 border-t border-stone-200 dark:border-stone-800 animate-in fade-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wallets, brass belts, duffels..."
                className="w-full pl-10 pr-20 py-2.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-700"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[11px] font-bold rounded-lg uppercase"
              >
                Go
              </button>
            </form>

            {/* Mobile search quick suggestions */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-lg divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
                {searchResults.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setMobileSearchOpen(false);
                      setSearchQuery('');
                      onNavigate('product', item.slug);
                    }}
                    className="p-2.5 flex items-center gap-2.5 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    <img src={item.mainImage} alt={item.name} className="w-9 h-9 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">{item.name}</p>
                      <p className="text-[10px] text-stone-500">Rs. {item.salePrice.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Website Navigation Bar (Desktop) */}
        <nav className="hidden md:flex items-center justify-between py-3 border-t border-stone-100 dark:border-stone-800/80 text-xs font-semibold tracking-wide text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('shop')}
              className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors cursor-pointer"
            >
              Shop
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors cursor-pointer"
            >
              Our Story
            </button>
            <button
              onClick={() => onNavigate('reviews')}
              className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors cursor-pointer"
            >
              Reviews
            </button>
            <button
              onClick={() => onNavigate('contact', { subject: 'Custom Bespoke Leather Order' })}
              className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors cursor-pointer"
            >
              Custom Order
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => onNavigate('track')}
              className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors cursor-pointer flex items-center gap-1.5 text-stone-500 hover:text-amber-800 dark:hover:text-amber-400"
            >
              <Package className="w-3.5 h-3.5" /> Order Tracking
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-4 pt-3 pb-6 space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Profile Card / Sign In in Mobile Drawer */}
          {user ? (
            <div className="p-3.5 bg-stone-100 dark:bg-stone-900 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover bg-stone-200 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{user.name}</p>
                  <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('profile');
                }}
                className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('login');
                }}
                className="py-2.5 text-center bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('register');
                }}
                className="py-2.5 text-center border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Create Account
              </button>
            </div>
          )}

          {/* Search Bar in Mobile Menu */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leather wallets, belts..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-700"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          {/* Navigation Links */}
          <div className="space-y-1 text-xs font-semibold">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 pt-2">
              Menu
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('shop');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              Shop
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('about');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              Our Story
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('reviews');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              Reviews
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('contact', { subject: 'Custom Bespoke Leather Order' });
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              Custom Order
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('contact');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              Contact
            </button>

            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 pt-3">
              Customer Services
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('track');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer flex items-center gap-2"
            >
              <Package className="w-3.5 h-3.5 text-amber-700" /> Track Your Courier Order
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('help');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              Help Center & FAQs
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('shipping');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              Shipping & Nationwide Delivery
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('returns-policy');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              7-Day Returns & Exchanges
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('about');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              Our Craftsmanship & Story
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('contact');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              Contact Concierge
            </button>

            {user && (
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    onNavigate('home');
                  }}
                  className="w-full text-left py-2.5 px-3 text-rose-600 font-bold flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-100 dark:border-stone-800">
            <span>🇵🇰 Pakistan (PKR)</span>
            <span>Cash on Delivery Verified</span>
          </div>
        </div>
      )}
    </header>
  );
};
