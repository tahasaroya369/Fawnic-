import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  X,
  Star,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  Search,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard.js';
import {
  getCachedProducts,
  setCachedProducts,
  getCachedCategories,
  setCachedCategories,
  prefetchProductImages,
} from '../services/productCache.js';
import { getResponsiveImageProps, getCategoryFallbackImage } from '../utils/imageAssets.js';
import type { Product, Category } from '../types.js';

interface ShopProps {
  onNavigate: (route: string, param?: any) => void;
  onQuickView: (product: Product) => void;
  initialCategory?: string;
  initialFilters?: {
    search?: string;
    category?: string;
    subcategory?: string;
    leatherType?: string;
    flashDeal?: string;
  };
}

export const Shop: React.FC<ShopProps> = ({ onNavigate, onQuickView, initialCategory, initialFilters }) => {
  const [products, setProducts] = useState<Product[]>(() => getCachedProducts() || []);
  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories() || []);
  const [loading, setLoading] = useState(() => !getCachedProducts());

  // Filters
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || initialFilters?.category || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialFilters?.subcategory || 'all');
  const [selectedLeatherType, setSelectedLeatherType] = useState<string>(initialFilters?.leatherType || 'all');
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [flashDealsOnly, setFlashDealsOnly] = useState<boolean>(initialFilters?.flashDeal === 'true');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular'>('newest');

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    let isMounted = true;

    async function loadData(isInitial = false) {
      try {
        const hasCached = Boolean(getCachedProducts());
        if (isInitial && !hasCached) setLoading(true);

        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products?limit=100'),
          fetch('/api/products/categories'),
        ]);

        if (prodRes.ok && isMounted) {
          const data = await prodRes.json();
          const items = data.products || [];
          setProducts(items);
          setCachedProducts(items);
          prefetchProductImages(items);
        }
        if (catRes.ok && isMounted) {
          const catData = await catRes.json();
          setCategories(catData || []);
          setCachedCategories(catData || []);
        }
      } catch (err) {
        console.error('Error fetching shop data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData(true);

    const handleProductChange = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.action === 'updated' && detail.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === detail.product.id ? { ...p, ...detail.product } : p))
        );
      } else if (detail.action === 'inventory' && detail.productId && detail.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === detail.productId ? { ...p, ...detail.product } : p))
        );
      } else if (detail.action === 'deleted') {
        const pid = detail.productId || detail.product?.id;
        if (pid) {
          setProducts((prev) => prev.filter((p) => p.id !== pid));
          const current = getCachedProducts();
          if (current) setCachedProducts(current.filter((p) => p.id !== pid));
        } else {
          loadData(false);
        }
      } else {
        loadData(false);
      }
    };

    const handleCategoryChange = () => {
      loadData(false);
    };

    window.addEventListener('fawnic:product_change', handleProductChange);
    window.addEventListener('fawnic:category_change', handleCategoryChange);

    return () => {
      isMounted = false;
      window.removeEventListener('fawnic:product_change', handleProductChange);
      window.removeEventListener('fawnic:category_change', handleCategoryChange);
    };
  }, []);

  // Sync initial category or filters if changed from external navigation
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialFilters?.search !== undefined) setSearch(initialFilters.search);
    if (initialFilters?.category !== undefined) setSelectedCategory(initialFilters.category);
    if (initialFilters?.subcategory !== undefined) setSelectedSubcategory(initialFilters.subcategory);
    if (initialFilters?.leatherType !== undefined) setSelectedLeatherType(initialFilters.leatherType);
    if (initialFilters?.flashDeal !== undefined) setFlashDealsOnly(initialFilters.flashDeal === 'true');
  }, [initialCategory, initialFilters]);

  // Extract unique leather types
  const leatherTypes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.leatherType) set.add(p.leatherType);
    });
    return Array.from(set);
  }, [products]);

  // Active categories only, ordered by display priority from database
  const activeCategories = useMemo(() => {
    return categories
      .filter((c) => c.isActive !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [categories]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = (p.name || '').toLowerCase().includes(q);
          const matchDesc = (p.description || '').toLowerCase().includes(q);
          const matchCat = (p.categoryName || '').toLowerCase().includes(q);
          const matchLeather = (p.leatherType || '').toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat && !matchLeather) return false;
        }

        // Category
        if (selectedCategory !== 'all') {
          const catObj = categories.find((c) => c.slug === selectedCategory);
          if (catObj && p.categoryId !== catObj.id) return false;
        }

        // Subcategory
        if (selectedSubcategory !== 'all' && p.subcategory !== selectedSubcategory) {
          return false;
        }

        // Leather Type
        if (selectedLeatherType !== 'all' && p.leatherType !== selectedLeatherType) {
          return false;
        }

        // Price
        if (p.salePrice > maxPrice) return false;

        // Rating
        if (minRating > 0 && p.rating < minRating) return false;

        // In Stock
        if (inStockOnly && p.stock <= 0) return false;

        // Flash Deal
        if (flashDealsOnly && !p.isFlashDeal) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.salePrice - b.salePrice;
        if (sortBy === 'price_desc') return b.salePrice - a.salePrice;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'popular') return b.reviewCount - a.reviewCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [
    products,
    search,
    selectedCategory,
    selectedSubcategory,
    selectedLeatherType,
    maxPrice,
    minRating,
    inStockOnly,
    flashDealsOnly,
    sortBy,
    categories,
  ]);

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedLeatherType('all');
    setMaxPrice(30000);
    setMinRating(0);
    setInStockOnly(false);
    setFlashDealsOnly(false);
  };

  const activeFilterCount =
    (search ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedSubcategory !== 'all' ? 1 : 0) +
    (selectedLeatherType !== 'all' ? 1 : 0) +
    (maxPrice < 30000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (flashDealsOnly ? 1 : 0);

  const selectedCategoryObj = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Shop Hero Banner */}
      <div className="space-y-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400">
              FAWNIC Atelier Catalog
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-950 dark:text-stone-50 mt-1">
              Explore the FAWNIC Collection
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
              Handcrafted full-grain leather goods, precision-cut from vegetable-tanned hides and bench-assembled with solid brass hardware in our Karachi atelier.
            </p>
          </div>

          {/* Top Controls (Sort & View Toggle) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mobile Filter Trigger */}
            <button
              id="shop-mobile-filter-btn"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                id="shop-sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium py-2 pl-3 pr-8 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="popular">Sort: Most Popular</option>
                <option value="rating">Sort: Highest Rated</option>
                <option value="price_asc">Sort: Price (Low to High)</option>
                <option value="price_desc">Sort: Price (High to Low)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Grid/List View Toggle (Desktop) */}
            <div className="hidden sm:flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Horizontal Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSubcategory('all');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            All Leather Goods ({products.length})
          </button>
          {activeCategories.map((c) => {
            const count = products.filter((p) => p.categoryId === c.id).length;
            const isSelected = selectedCategory === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.slug);
                  setSelectedSubcategory('all');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Filter Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white dark:bg-stone-900 shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                  <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base">
                    Filter Products
                  </h3>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-800 text-amber-50">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                {/* Search */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                    Keyword Search
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="e.g. bifold, brass, vintage..."
                      className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-700"
                    />
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                    Category
                  </label>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedSubcategory('all');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                          : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      All Categories ({products.length})
                    </button>
                    {activeCategories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCategory(c.slug);
                          setSelectedSubcategory('all');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                          selectedCategory === c.slug
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategories */}
                {selectedCategoryObj && selectedCategoryObj.subcategories.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                      Style / Subcategory
                    </label>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <button
                        onClick={() => setSelectedSubcategory('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                          selectedSubcategory === 'all'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        All
                      </button>
                      {selectedCategoryObj.subcategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setSelectedSubcategory(sub)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                            selectedSubcategory === sub
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leather Specification */}
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" /> Leather Type
                  </label>
                  <select
                    value={selectedLeatherType}
                    onChange={(e) => setSelectedLeatherType(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Leather Tannages</option>
                    {leatherTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Price Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                    <span>Max Budget (PKR)</span>
                    <span className="font-serif font-bold text-stone-950 dark:text-stone-50">
                      Rs. {maxPrice.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="30000"
                    step="500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-amber-800 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>Rs. 1,000</span>
                    <span>Rs. 30,000</span>
                  </div>
                </div>

                {/* Checkbox Toggles */}
                <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                  <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded accent-amber-800"
                    />
                    <span>In-Stock Items Only</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flashDealsOnly}
                      onChange={(e) => setFlashDealsOnly(e.target.checked)}
                      className="rounded accent-amber-800"
                    />
                    <span>Signature Flash Deals Only</span>
                  </label>
                </div>
              </div>

              {/* Drawer Footer Buttons */}
              <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex gap-3">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="flex-1 py-3 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    Reset ({activeFilterCount})
                  </button>
                )}
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Apply Filters ({filteredProducts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-serif">
              Refine Collection
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-amber-800 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="space-y-6 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            {/* Search within results */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                Search Keyword
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. bifold, brass, vintage..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                Category
              </label>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedSubcategory('all');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  All Categories ({products.length})
                </button>
                {activeCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.slug);
                      setSelectedSubcategory('all');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      selectedCategory === c.slug
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategories (if category selected) */}
            {selectedCategoryObj && selectedCategoryObj.subcategories.length > 0 && (
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                  Style / Subcategory
                </label>
                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => setSelectedSubcategory('all')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      selectedSubcategory === 'all'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    All in {selectedCategoryObj.name}
                  </button>
                  {selectedCategoryObj.subcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubcategory(sub)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        selectedSubcategory === sub
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold'
                          : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Leather Specification */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" /> Leather Type
              </label>
              <select
                value={selectedLeatherType}
                onChange={(e) => setSelectedLeatherType(e.target.value)}
                className="w-full text-xs p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">All Leather Tannages</option>
                {leatherTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Price Slider (PKR) */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                <span>Max Budget (PKR)</span>
                <span className="font-serif font-bold text-stone-950 dark:text-stone-50">
                  Rs. {maxPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={30000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-stone-900 dark:accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>Rs. 1,000</span>
                <span>Rs. 30,000+</span>
              </div>
            </div>

            {/* Ratings Filter */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                Customer Rating
              </label>
              <div className="space-y-1.5 text-xs">
                {[4, 3].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(minRating === r ? 0 : r)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      minRating === r
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 font-bold'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: r }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                      ))}
                      <span className="text-stone-800 dark:text-stone-200 ml-1">& Up</span>
                    </div>
                    {minRating === r && <Check className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Toggles */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <span className="text-stone-700 dark:text-stone-300">In Atelier Stock Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flashDealsOnly}
                  onChange={(e) => setFlashDealsOnly(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-stone-700 dark:text-stone-300">Limited Edition / Sale</span>
              </label>
            </div>
          </div>
        </div>

        {/* Product Grid / List Display */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-stone-400">Active filters:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200 dark:bg-stone-800 rounded-full text-xs font-semibold">
                  Category: {selectedCategoryObj?.name}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('all')} />
                </span>
              )}
              {selectedSubcategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200 dark:bg-stone-800 rounded-full text-xs font-semibold">
                  Subcategory: {selectedSubcategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSubcategory('all')} />
                </span>
              )}
              {selectedLeatherType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200 dark:bg-stone-800 rounded-full text-xs font-semibold">
                  Leather: {selectedLeatherType}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedLeatherType('all')} />
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200 dark:bg-stone-800 rounded-full text-xs font-semibold">
                  &ldquo;{search}&rdquo;
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-amber-800 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                No products found
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No artisanal items matched your search query or selected criteria. Try adjusting your search term or exploring all collections.
              </p>
              <button
                id="shop-reset-filters-btn"
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
              >
                Explore All Products
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigate={onNavigate}
                  onQuickView={onQuickView}
                  priority={idx < 6}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product, idx) => {
                const imgProps = getResponsiveImageProps(product.mainImage, 360);
                return (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 hover:shadow-md transition-shadow"
                  >
                    <img
                      src={imgProps.src}
                      srcSet={imgProps.srcSet}
                      sizes="(max-width: 640px) 100vw, 150px"
                      alt={product.name}
                      width={144}
                      height={144}
                      loading={idx < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.srcset = '';
                        target.src = getCategoryFallbackImage(product.categoryName || product.categoryId, product.name);
                      }}
                      className="w-full sm:w-36 h-36 object-cover rounded-xl bg-stone-100 dark:bg-stone-800 cursor-pointer shrink-0"
                      onClick={() => onNavigate('product', product.slug)}
                    />
                  <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-amber-800 dark:text-amber-400">
                        {product.leatherType || 'Full-Grain'}
                      </span>
                      <span>• {product.categoryName}</span>
                    </div>
                    <h3
                      onClick={() => onNavigate('product', product.slug)}
                      className="text-base font-bold text-stone-900 dark:text-stone-100 hover:text-amber-800 dark:hover:text-amber-400 cursor-pointer truncate"
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {product.shortDescription}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-500 text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span className="font-bold text-stone-900 dark:text-stone-100">{product.rating.toFixed(1)}</span>
                      <span className="text-stone-400">({product.reviewCount})</span>
                    </div>
                  </div>
                  <div className="text-center sm:text-right shrink-0 space-y-2">
                    <div className="text-lg font-bold font-serif text-stone-950 dark:text-stone-50">
                      Rs. {product.salePrice.toLocaleString()}
                    </div>
                    <button
                      onClick={() => onNavigate('product', product.slug)}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
