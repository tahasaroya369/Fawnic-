import React, { useState, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Layers,
  Star,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Copy,
  Eye,
  CheckSquare,
  Square,
  ArrowUpDown,
  MoreVertical,
  Code,
  Bold,
  Italic,
  List,
  ListOrdered,
  Table,
  Link2,
  Palette,
  Ruler,
  Wand2,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import type { Product, Category, ProductVariation } from '../../types.js';
import { ProductImageUploader } from './ProductImageUploader.js';
import { ProductPreviewModal } from './ProductPreviewModal.js';
import { sanitizeProductHtml } from '../../utils/sanitize.js';

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  token: string | null;
  onRefreshProducts: () => void;
  onOpenAdjustStock: (product: Product) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({
  products,
  categories,
  token,
  onRefreshProducts,
  onOpenAdjustStock,
  isAddModalOpen,
  onCloseAddModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('newest');

  // Selection & Bulk actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('FAWNIC');
  const [leatherType, setLeatherType] = useState('Full-Grain Cowhide');
  const [sku, setSku] = useState('');
  const [regularPrice, setRegularPrice] = useState('4500');
  const [salePrice, setSalePrice] = useState('3800');
  const [costPrice, setCostPrice] = useState('2200');
  const [stock, setStock] = useState('20');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [mainImage, setMainImage] = useState('https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80');
  const [images, setImages] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [productStatus, setProductStatus] = useState<'published' | 'draft' | 'hidden'>('published');

  // Variations Tab & State
  const [formTab, setFormTab] = useState<'general' | 'variations'>('general');
  const [hasVariations, setHasVariations] = useState<boolean>(false);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [uploadingVariationIndex, setUploadingVariationIndex] = useState<number | null>(null);
  const [showGalleryPickerIndex, setShowGalleryPickerIndex] = useState<number | null>(null);

  // Quick Generator state
  const [showQuickGenerator, setShowQuickGenerator] = useState(false);
  const [genColors, setGenColors] = useState('Black, Brown, Tan');
  const [genSizes, setGenSizes] = useState('32, 34, 36');
  const [genMode, setGenMode] = useState<'combinations' | 'separate'>('combinations');

  const handleAddVariation = (type: 'color' | 'size' | 'combination' = 'color', defaultData?: Partial<ProductVariation>) => {
    const isColor = type === 'color' || type === 'combination';
    const isSize = type === 'size' || type === 'combination';
    const initialColor = defaultData?.color !== undefined ? defaultData.color : (isColor ? 'Black' : undefined);
    const initialSize = defaultData?.size !== undefined ? defaultData.size : (isSize ? '32' : undefined);
    let defName = defaultData?.name || '';
    if (!defName) {
      if (initialColor && initialSize) defName = `${initialColor} / ${initialSize}`;
      else if (initialColor) defName = initialColor;
      else if (initialSize) defName = initialSize;
      else defName = `Variation ${variations.length + 1}`;
    }

    const newVar: ProductVariation = {
      id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: defName,
      type,
      color: initialColor,
      size: initialSize,
      image: defaultData?.image !== undefined ? defaultData.image : (mainImage || ''),
      colorCode: defaultData?.colorCode !== undefined ? defaultData.colorCode : (isColor ? '#1c1917' : undefined),
      sku: defaultData?.sku !== undefined ? defaultData.sku : (sku ? `${sku}-${variations.length + 1}` : ''),
      order: variations.length + 1,
    };
    setVariations((prev) => [...prev, newVar]);
  };

  const handleGenerateMatrix = () => {
    const colorList = genColors
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const sizeList = genSizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const colorPillMap: Record<string, string> = {
      Black: '#1c1917',
      Brown: '#78350f',
      'Dark Brown': '#451a03',
      Tan: '#b45309',
      Cognac: '#92400e',
      Oxblood: '#581c87',
      Navy: '#1e3a8a',
      Silver: '#94a3b8',
      Gold: '#eab308',
    };

    const newVars: ProductVariation[] = [];

    if (genMode === 'combinations' && colorList.length > 0 && sizeList.length > 0) {
      colorList.forEach((c) => {
        sizeList.forEach((s) => {
          newVars.push({
            id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: `${c} / ${s}`,
            type: 'combination',
            color: c,
            size: s,
            colorCode: colorPillMap[c] || '#1c1917',
            image: mainImage || '',
            sku: sku ? `${sku}-${c.slice(0, 3).toUpperCase()}-${s}` : '',
            order: variations.length + newVars.length + 1,
          });
        });
      });
    } else {
      colorList.forEach((c) => {
        newVars.push({
          id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: c,
          type: 'color',
          color: c,
          colorCode: colorPillMap[c] || '#1c1917',
          image: mainImage || '',
          sku: sku ? `${sku}-${c.slice(0, 3).toUpperCase()}` : '',
          order: variations.length + newVars.length + 1,
        });
      });
      sizeList.forEach((s) => {
        newVars.push({
          id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: s,
          type: 'size',
          size: s,
          image: '',
          sku: sku ? `${sku}-${s}` : '',
          order: variations.length + newVars.length + 1,
        });
      });
    }

    if (newVars.length > 0) {
      setVariations((prev) => [...prev, ...newVars]);
      setShowQuickGenerator(false);
    }
  };

  const handleRemoveVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    setVariations((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        const updated = { ...v, [field]: value };
        if (field === 'color' || field === 'size' || field === 'type') {
          const col = field === 'color' ? value : updated.color;
          const sz = field === 'size' ? value : updated.size;
          const typ = field === 'type' ? value : updated.type;
          if (typ === 'combination' && col && sz) {
            updated.name = `${col} / ${sz}`;
          } else if (typ === 'color' && col) {
            updated.name = col;
          } else if (typ === 'size' && sz) {
            updated.name = sz;
          }
        }
        return updated;
      })
    );
  };

  const handleMoveVariation = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= variations.length) return;
    const updated = [...variations];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updated.forEach((v, i) => {
      v.order = i + 1;
    });
    setVariations(updated);
  };

  const handleVariationFileUpload = async (index: number, file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit.');
      return;
    }
    try {
      setUploadingVariationIndex(index);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dataUrl,
          filename: file.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          handleUpdateVariation(index, 'image', data.url);
        }
      } else {
        alert('Failed to upload variation image.');
      }
    } catch (err) {
      console.error('Variation image upload error:', err);
      alert('Network error while uploading variation image.');
    } finally {
      setUploadingVariationIndex(null);
    }
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Description HTML formatting mode
  const [descMode, setDescMode] = useState<'code' | 'preview'>('code');
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tagStart: string, tagEnd: string = '', defaultText: string = '') => {
    const textarea = descTextareaRef.current;
    if (!textarea) {
      setDescription((prev) => prev + tagStart + defaultText + tagEnd);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = description.substring(start, end) || defaultText;
    const replacement = `${tagStart}${selected}${tagEnd}`;
    const newText = description.substring(0, start) + replacement + description.substring(end);
    setDescription(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selected.length);
    }, 20);
  };

  // Sync external open trigger if provided
  React.useEffect(() => {
    if (isAddModalOpen) {
      handleOpenCreate();
    }
  }, [isAddModalOpen]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormTab('general');
    setName('');
    setShortDescription('');
    setDescription('');
    setCategoryId(categories[0]?.id || 'cat_wallets');
    setBrand('FAWNIC');
    setLeatherType('Full-Grain Cowhide');
    setSku(`FWN-${Math.floor(1000 + Math.random() * 9000)}`);
    setRegularPrice('4500');
    setSalePrice('3800');
    setCostPrice('2200');
    setStock('15');
    setLowStockThreshold('5');
    setMainImage('https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80');
    setImages(['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80']);
    setHasVariations(false);
    setVariations([]);
    setIsFeatured(false);
    setIsBestSeller(false);
    setIsNewArrival(true);
    setProductStatus('published');
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormTab('general');
    setName(p.name);
    setShortDescription(p.shortDescription || '');
    setDescription(p.description);
    setCategoryId(p.categoryId);
    setBrand(p.brand || 'FAWNIC');
    setLeatherType(p.leatherType || 'Full-Grain Cowhide');
    setSku(p.sku);
    setRegularPrice(p.regularPrice.toString());
    setSalePrice(p.salePrice.toString());
    setCostPrice(p.costPrice ? p.costPrice.toString() : '');
    setStock(p.stock.toString());
    setLowStockThreshold(p.lowStockThreshold.toString());
    setMainImage(p.mainImage);
    setImages(p.images && p.images.length ? p.images : [p.mainImage]);
    setHasVariations(Boolean(p.hasVariations || (p.variations && p.variations.length > 0)));
    setVariations(p.variations && p.variations.length > 0 ? JSON.parse(JSON.stringify(p.variations)) : []);
    setIsFeatured(Boolean(p.isFeatured));
    setIsBestSeller(Boolean(p.isBestSeller));
    setIsNewArrival(Boolean(p.isNewArrival));
    setProductStatus(p.status as any || 'published');
    setError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product title is required.');
      return;
    }
    if (!regularPrice || Number(regularPrice) <= 0) {
      setError('Please provide a valid regular price.');
      return;
    }
    if (!mainImage) {
      setError('Please upload at least one main product image.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        categoryId,
        brand: brand.trim(),
        leatherType: leatherType.trim(),
        sku: sku.trim(),
        regularPrice: Number(regularPrice),
        salePrice: salePrice ? Number(salePrice) : Number(regularPrice),
        costPrice: costPrice ? Number(costPrice) : undefined,
        stock: Number(stock) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        mainImage,
        images: images.length ? images : [mainImage],
        isFeatured,
        isBestSeller,
        isNewArrival,
        status: productStatus,
        hasVariations: Boolean(hasVariations),
        variations: hasVariations
          ? variations
              .filter((v) => {
                const hasCol = Boolean(v.color && v.color.trim());
                const hasSz = Boolean(v.size && v.size.trim());
                const hasNm = Boolean(v.name && v.name.trim());
                return hasCol || hasSz || hasNm;
              })
              .map((v, i) => {
                const color = v.color?.trim() || (v.type !== 'size' && !v.size ? v.name?.trim() : undefined);
                const size = v.size?.trim() || (v.type === 'size' ? v.name?.trim() : undefined);
                let name = v.name?.trim() || '';
                if (!name || name === 'Variation' || name.startsWith('Variation ')) {
                  if (color && size) name = `${color} / ${size}`;
                  else if (color) name = color;
                  else if (size) name = size;
                  else name = `Variant ${i + 1}`;
                }
                const varType = v.type || (color && size ? 'combination' : color ? 'color' : size ? 'size' : 'color');
                return {
                  ...v,
                  name,
                  type: varType,
                  color,
                  size,
                  order: i + 1,
                };
              })
          : [],
      };

      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save product');
      }

      handleCloseModal();
      onRefreshProducts();
    } catch (err: any) {
      console.error('Save product error:', err);
      setError(err.message || 'Server error occurred while saving product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      setDuplicatingId(product.id);
      const res = await fetch(`/api/admin/products/${product.id}/duplicate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to duplicate product');
        return;
      }

      onRefreshProducts();
    } catch (err) {
      console.error('Duplicate error:', err);
      alert('Network error while duplicating product');
    } finally {
      setDuplicatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProductToDelete(null);
        setSelectedProductIds((prev) => prev.filter((id) => id !== productToDelete.id));
        onRefreshProducts();
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Bulk action handler
  const handleBulkAction = async (action: 'publish' | 'draft' | 'hide' | 'delete') => {
    if (selectedProductIds.length === 0) return;

    if (action === 'delete') {
      if (
        !confirm(
          `Are you sure you want to permanently delete ${selectedProductIds.length} selected leather articles? This cannot be undone.`
        )
      ) {
        return;
      }
    }

    try {
      setBulkActionLoading(true);
      const res = await fetch('/api/admin/products/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          productIds: selectedProductIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to perform bulk action');
        return;
      }

      setSelectedProductIds([]);
      onRefreshProducts();
    } catch (err) {
      console.error('Bulk action error:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtered & Sorted list
  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.leatherType?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;

      let matchesStock = true;
      if (stockFilter === 'in_stock') matchesStock = p.stock > p.lowStockThreshold;
      else if (stockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= p.lowStockThreshold;
      else if (stockFilter === 'out_of_stock') matchesStock = p.stock === 0;

      let matchesStatus = true;
      if (statusFilter !== 'all') matchesStatus = p.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStock && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.salePrice - b.salePrice;
      if (sortBy === 'price_desc') return b.salePrice - a.salePrice;
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'stock_desc') return b.stock - a.stock;
      // Default newest
      return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Leather Catalog Management
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Manage full-grain leather articles, variants, live storefront previews, and inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-serif uppercase tracking-widest font-bold rounded-xl hover:bg-amber-600 dark:hover:bg-amber-500 transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Leather Article</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by article title, SKU, or leather grade..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock (&gt; Threshold)</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100 font-medium"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock_asc">Stock: Low to High</option>
            <option value="stock_desc">Stock: High to Low</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Floating Toolbar */}
      {selectedProductIds.length > 0 && (
        <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs pl-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold">{selectedProductIds.length} article(s) selected</span>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              type="button"
              disabled={bulkActionLoading}
              onClick={() => handleBulkAction('publish')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition"
            >
              Publish Selected
            </button>
            <button
              type="button"
              disabled={bulkActionLoading}
              onClick={() => handleBulkAction('draft')}
              className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded-lg font-semibold transition"
            >
              Draft Selected
            </button>
            <button
              type="button"
              disabled={bulkActionLoading}
              onClick={() => handleBulkAction('hide')}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition"
            >
              Hide Selected
            </button>
            <button
              type="button"
              disabled={bulkActionLoading}
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition"
            >
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedProductIds([])}
              className="px-2.5 py-1.5 text-stone-400 hover:text-white transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Catalog Table */}
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-stone-400 hover:text-amber-600 transition"
                    title="Select All"
                  >
                    {filteredProducts.length > 0 &&
                    selectedProductIds.length === filteredProducts.length ? (
                      <CheckSquare className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Category / Leather</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price (PKR)</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Badges</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-stone-500">
                    No leather articles found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;
                  const isOut = p.stock === 0;
                  const isSelected = selectedProductIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-stone-50/50 dark:hover:bg-zinc-900/50 transition ${
                        isSelected ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectProduct(p.id)}
                          className="text-stone-400 hover:text-amber-600 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Product Name & Thumbnail */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.mainImage}
                            alt={p.name}
                            className="w-11 h-11 object-cover rounded-lg border border-stone-200 dark:border-zinc-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-serif font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[180px] sm:max-w-[220px]">
                              {p.name}
                            </p>
                            <span
                              className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                                p.status === 'published'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : p.status === 'draft'
                                  ? 'bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-stone-400'
                                  : 'bg-zinc-500/10 text-zinc-500'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Leather Grade */}
                      <td className="px-4 py-3.5">
                        <p className="text-stone-800 dark:text-stone-200 font-medium">{p.categoryName}</p>
                        <p className="text-stone-500 text-[11px]">{p.leatherType}</p>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3.5 font-mono font-bold text-stone-600 dark:text-stone-400">
                        {p.sku}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          Rs. {p.salePrice.toLocaleString()}
                        </p>
                        {p.regularPrice > p.salePrice && (
                          <p className="font-mono text-[11px] text-stone-400 line-through">
                            Rs. {p.regularPrice.toLocaleString()}
                          </p>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                              isOut
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : isLow
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {p.stock} units
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenAdjustStock(p)}
                            title="Adjust Atelier Inventory"
                            className="p-1 rounded hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 hover:text-amber-600 transition"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Badges */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {p.isFeatured && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 font-semibold">
                              Featured
                            </span>
                          )}
                          {p.isBestSeller && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-stone-300 font-semibold">
                              Bestseller
                            </span>
                          )}
                          {p.isNewArrival && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold">
                              New
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Live Preview Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewProduct(p)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition"
                            title="Preview Storefront View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Duplicate Button */}
                          <button
                            type="button"
                            disabled={duplicatingId === p.id}
                            onClick={() => handleDuplicate(p)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-500 hover:text-amber-600 transition disabled:opacity-50"
                            title="Duplicate Product"
                          >
                            {duplicatingId === p.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-amber-600 transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Safe Delete Button */}
                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-500/10">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Delete this product?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              This product will be removed from your catalog. Once deleted, customers will no longer be able to discover or order this article.
            </p>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 flex items-center gap-3">
              <img
                src={productToDelete.mainImage}
                alt={productToDelete.name}
                className="w-10 h-10 object-cover rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="font-serif font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                  {productToDelete.name}
                </p>
                <p className="font-mono text-[11px] text-stone-500">
                  {productToDelete.sku} • Rs. {productToDelete.salePrice.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-xs font-semibold rounded-xl text-stone-700 dark:text-stone-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-serif uppercase tracking-wider font-bold rounded-xl transition shadow-sm"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      <ProductPreviewModal
        product={previewProduct}
        isOpen={Boolean(previewProduct)}
        onClose={() => setPreviewProduct(null)}
      />

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  {editingProduct ? 'Edit Leather Article' : 'New Handcrafted Article'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-stone-200 dark:border-zinc-800 bg-stone-100/70 dark:bg-zinc-900/60 px-6 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormTab('general')}
                className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                  formTab === 'general'
                    ? 'border-amber-600 text-stone-900 dark:text-stone-100 bg-white dark:bg-zinc-950 shadow-xs'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Package className="w-4 h-4 text-stone-400" />
                <span>General Information</span>
              </button>
              <button
                type="button"
                onClick={() => setFormTab('variations')}
                className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                  formTab === 'variations'
                    ? 'border-amber-600 text-stone-900 dark:text-stone-100 bg-white dark:bg-zinc-950 shadow-xs'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Palette className="w-4 h-4 text-amber-500" />
                <span>Variations</span>
                {hasVariations && variations.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    {variations.length}
                  </span>
                )}
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {formTab === 'general' ? (
                <>
                  {/* Image Uploader with Drag, Replace, Slot Indicators */}
                  <div className="p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl">
                    <ProductImageUploader
                      token={token}
                      mainImage={mainImage}
                      images={images}
                      onMainImageChange={setMainImage}
                      onImagesChange={setImages}
                    />
                  </div>

              {/* Title & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Article Title
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Royal Bi-Fold Leather Wallet"
                    className="w-full px-3 py-2 text-sm font-serif font-semibold bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="FWN-WLT-01"
                    className="w-full px-3 py-2 font-mono font-bold bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Category & Leather Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Leather Type / Tannage
                  </label>
                  <input
                    type="text"
                    value={leatherType}
                    onChange={(e) => setLeatherType(e.target.value)}
                    placeholder="e.g. Full-Grain Cowhide"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Status
                  </label>
                  <select
                    value={productStatus}
                    onChange={(e) => setProductStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="published">Published (Live in Store)</option>
                    <option value="draft">Draft (Private)</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              {/* Pricing (PKR) & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl">
                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Regular Price (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    className="w-full px-3 py-2 font-mono font-bold bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Sale Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full px-3 py-2 font-mono font-bold bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Cost Price (PKR - Staff Only)
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Stock Quantity & Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Available Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 font-mono font-bold bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="e.g. Crafted from hand-burnished Pakistani cowhide with 8 card slots."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300">
                    Product Description <span className="normal-case text-[10px] text-amber-600 dark:text-amber-400 font-mono font-normal">(HTML Supported)</span>
                  </label>
                  <div className="flex items-center bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setDescMode('code')}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition flex items-center gap-1 cursor-pointer ${
                        descMode === 'code'
                          ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-stone-100 shadow-xs'
                          : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>HTML Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescMode('preview')}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition flex items-center gap-1 cursor-pointer ${
                        descMode === 'preview'
                          ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-stone-100 shadow-xs'
                          : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visual Preview</span>
                    </button>
                  </div>
                </div>

                {descMode === 'code' ? (
                  <div className="border border-stone-300 dark:border-zinc-700 rounded-xl overflow-hidden bg-stone-50 dark:bg-zinc-950 focus-within:ring-1 focus-within:ring-amber-500 focus-within:border-amber-500 transition-all">
                    {/* Quick Formatting Toolbar */}
                    <div className="flex items-center gap-1 p-1.5 bg-stone-100 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 flex-wrap text-stone-700 dark:text-stone-300">
                      <button
                        type="button"
                        onClick={() => insertTag('<h3>', '</h3>', 'Heading 3')}
                        title="Heading 3"
                        className="px-2 py-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded text-xs font-bold font-serif cursor-pointer"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<h4>', '</h4>', 'Heading 4')}
                        title="Heading 4"
                        className="px-2 py-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded text-xs font-bold font-serif cursor-pointer"
                      >
                        H4
                      </button>
                      <div className="w-px h-4 bg-stone-300 dark:bg-zinc-700 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => insertTag('<strong>', '</strong>', 'Bold text')}
                        title="Bold"
                        className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<em>', '</em>', 'Italic text')}
                        title="Italic"
                        className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<p>', '</p>', 'Paragraph text')}
                        title="Paragraph"
                        className="px-2 py-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded text-xs font-semibold cursor-pointer"
                      >
                        P
                      </button>
                      <div className="w-px h-4 bg-stone-300 dark:bg-zinc-700 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => insertTag('<ul>\n  <li>', '</li>\n  <li>Second feature</li>\n</ul>', 'First feature')}
                        title="Bullet List"
                        className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<ol>\n  <li>', '</li>\n  <li>Second step</li>\n</ol>', 'First step')}
                        title="Numbered List"
                        className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<table>\n  <thead>\n    <tr>\n      <th>Feature</th>\n      <th>Specification</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Material</td>\n      <td>Full-Grain Pakistani Cowhide</td>\n    </tr>\n    <tr>\n      <td>Dimensions</td>\n      <td>11.5cm x 9.5cm</td>\n    </tr>\n  </tbody>\n</table>\n', '', '')}
                        title="Specifications Table"
                        className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                      >
                        <Table className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<a href="https://example.com" target="_blank" rel="noopener noreferrer">', '</a>', 'Link Text')}
                        title="Link"
                        className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<br/>\n', '', '')}
                        title="Line Break"
                        className="px-1.5 py-0.5 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded text-[10px] font-mono cursor-pointer"
                      >
                        BR
                      </button>
                    </div>

                    <textarea
                      ref={descTextareaRef}
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter HTML formatted product story, specifications, bullet points, care tips..."
                      className="w-full p-3 font-mono text-xs bg-transparent border-0 focus:outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
                    />
                  </div>
                ) : (
                  <div className="border border-stone-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900 min-h-[160px] max-h-[300px] overflow-y-auto">
                    {description.trim() ? (
                      <div
                        className="product-html-description text-xs text-stone-700 dark:text-stone-300 leading-relaxed overflow-x-auto"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeProductHtml(description),
                        }}
                      />
                    ) : (
                      <div className="text-center py-8 text-stone-400 text-xs italic">
                        No description content to preview. Switch to "HTML Editor" tab above to add text or HTML tags.
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-1 text-[11px] text-stone-500">
                  Tip: Supports WordPress-style HTML tags: &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;table&gt;, &lt;a&gt;, and &lt;br&gt;.
                </p>
              </div>

              {/* Badges Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-stone-800 dark:text-stone-200 font-medium">Featured on Home</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-stone-800 dark:text-stone-200 font-medium">Bestseller Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-stone-800 dark:text-stone-200 font-medium">New Arrival Badge</span>
                </label>
              </div>
                </>
              ) : (
                /* Variations Tab */
                <div className="space-y-6">
                  {/* Enable/Disable Variations Toggle */}
                  <div className="p-5 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                          Enable Product Variations (Color & Size Variants)
                        </h4>
                      </div>
                      <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                        Configure handcrafted leather colors (e.g. Black, Brown, Tan), size options (e.g. 32, 34, 36, Small, Medium, Large), or color + size combinations with dedicated variation imagery.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={hasVariations}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setHasVariations(enabled);
                          if (enabled && variations.length === 0) {
                            handleAddVariation('color');
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6.5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
                    </label>
                  </div>

                  {!hasVariations ? (
                    <div className="p-8 text-center border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                        Standard Single Article
                      </h4>
                      <p className="text-stone-500 text-xs max-w-md mx-auto">
                        This product currently uses standard single-article photos and pricing. Turn on the toggle switch above to add color or size variations.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setHasVariations(true);
                            handleAddVariation('color');
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition shadow-xs"
                        >
                          <Palette className="w-4 h-4" />
                          <span>+ Add Color Variation</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHasVariations(true);
                            handleAddVariation('size');
                          }}
                          className="px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition shadow-xs"
                        >
                          <Ruler className="w-4 h-4" />
                          <span>+ Add Size Variation</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Variations Header & Controls Toolbar */}
                      <div className="p-4 bg-stone-100/70 dark:bg-zinc-900/50 rounded-2xl border border-stone-200/80 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-stone-800 dark:text-stone-200">
                              Configured Variations ({variations.length})
                            </span>
                            {/* Summary Badge */}
                            {(() => {
                              const colSet = new Set(
                                variations
                                  .map((v) => v.color?.trim() || (v.type !== 'size' && !v.size ? v.name?.trim() : ''))
                                  .filter(Boolean)
                              );
                              const szSet = new Set(
                                variations
                                  .map((v) => v.size?.trim() || (v.type === 'size' ? v.name?.trim() : ''))
                                  .filter(Boolean)
                              );
                              return (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                                  {colSet.size} color{colSet.size === 1 ? '' : 's'} • {szSet.size} size{szSet.size === 1 ? '' : 's'}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Customers will see interactive Color and Size selectors. Dedicated images update dynamically.
                          </p>
                        </div>

                        {/* Add Buttons & Quick Matrix */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddVariation('color')}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                            title="Add a color variant (e.g. Black, Brown, Tan)"
                          >
                            <Palette className="w-3.5 h-3.5" />
                            <span>+ Color</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddVariation('size')}
                            className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                            title="Add a size variant (e.g. 32, 34, 36, Small, Large)"
                          >
                            <Ruler className="w-3.5 h-3.5" />
                            <span>+ Size</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddVariation('combination')}
                            className="px-2.5 py-1.5 border border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                            title="Add combined Color + Size variant (e.g. Black / 34)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Color & Size</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowQuickGenerator(!showQuickGenerator)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition border ${
                              showQuickGenerator
                                ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-200'
                                : 'border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-zinc-800'
                            }`}
                            title="Quick bulk generator for colors and sizes"
                          >
                            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                            <span>Quick Generator</span>
                          </button>
                        </div>
                      </div>

                      {/* Quick Generator Panel */}
                      {showQuickGenerator && (
                        <div className="p-4 bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-4 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                            <div className="flex items-center gap-2">
                              <Wand2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <h5 className="font-bold text-xs text-stone-900 dark:text-stone-100">
                                Quick Variations & Combinations Matrix Generator
                              </h5>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowQuickGenerator(false)}
                              className="text-stone-400 hover:text-stone-600 text-xs"
                            >
                              ✕ Close
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Colors Input */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300">
                                Colors (comma-separated)
                              </label>
                              <input
                                type="text"
                                value={genColors}
                                onChange={(e) => setGenColors(e.target.value)}
                                placeholder="e.g. Black, Brown, Dark Brown, Tan"
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg text-xs"
                              />
                              <div className="flex flex-wrap gap-1 text-[10px]">
                                <span className="text-stone-400 mr-1">Presets:</span>
                                <button
                                  type="button"
                                  onClick={() => setGenColors('Black, Brown, Tan')}
                                  className="px-1.5 py-0.5 bg-stone-200 dark:bg-zinc-800 rounded hover:bg-amber-100 text-stone-600 dark:text-stone-300 cursor-pointer"
                                >
                                  Classic (Black, Brown, Tan)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGenColors('Black, Dark Brown, Cognac')}
                                  className="px-1.5 py-0.5 bg-stone-200 dark:bg-zinc-800 rounded hover:bg-amber-100 text-stone-600 dark:text-stone-300 cursor-pointer"
                                >
                                  Executive (Dark Tones)
                                </button>
                              </div>
                            </div>

                            {/* Sizes Input */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300">
                                Sizes (comma-separated, any format)
                              </label>
                              <input
                                type="text"
                                value={genSizes}
                                onChange={(e) => setGenSizes(e.target.value)}
                                placeholder="e.g. 32, 34, 36, 38 or Small, Medium, Large"
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg text-xs"
                              />
                              <div className="flex flex-wrap gap-1 text-[10px]">
                                <span className="text-stone-400 mr-1">Presets:</span>
                                <button
                                  type="button"
                                  onClick={() => setGenSizes('32, 34, 36, 38, 40')}
                                  className="px-1.5 py-0.5 bg-stone-200 dark:bg-zinc-800 rounded hover:bg-amber-100 text-stone-600 dark:text-stone-300 cursor-pointer"
                                >
                                  Belts (32–40)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGenSizes('Small, Medium, Large, XL')}
                                  className="px-1.5 py-0.5 bg-stone-200 dark:bg-zinc-800 rounded hover:bg-amber-100 text-stone-600 dark:text-stone-300 cursor-pointer"
                                >
                                  Apparel (S–XL)
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                            {/* Generator Mode */}
                            <div className="flex items-center gap-4 text-xs">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="genMode"
                                  checked={genMode === 'combinations'}
                                  onChange={() => setGenMode('combinations')}
                                  className="text-amber-600"
                                />
                                <span className="text-stone-700 dark:text-stone-300 font-medium">
                                  Full Matrix Combinations (e.g. Black-32, Black-34...)
                                </span>
                              </label>
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="genMode"
                                  checked={genMode === 'separate'}
                                  onChange={() => setGenMode('separate')}
                                  className="text-amber-600"
                                />
                                <span className="text-stone-700 dark:text-stone-300 font-medium">
                                  Separate Colors & Sizes (reuses color images)
                                </span>
                              </label>
                            </div>

                            <button
                              type="button"
                              onClick={handleGenerateMatrix}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs"
                            >
                              Generate Variations
                            </button>
                          </div>
                        </div>
                      )}

                      {variations.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-stone-200 dark:border-zinc-800 rounded-xl space-y-3">
                          <p className="text-stone-500 text-xs">No variations added yet.</p>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddVariation('color')}
                              className="px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                            >
                              + Add Color Variation
                            </button>
                            <span className="text-stone-300">•</span>
                            <button
                              type="button"
                              onClick={() => handleAddVariation('size')}
                              className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 font-semibold hover:underline cursor-pointer"
                            >
                              + Add Size Variation
                            </button>
                            <span className="text-stone-300">•</span>
                            <button
                              type="button"
                              onClick={() => handleAddVariation('combination')}
                              className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 font-semibold hover:underline cursor-pointer"
                            >
                              + Add Color & Size
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {variations.map((v, idx) => {
                            const isColor = v.type === 'color' || v.type === 'combination' || (!v.type && !v.size);
                            const isSize = v.type === 'size' || v.type === 'combination' || (!v.type && Boolean(v.size));

                            return (
                              <div
                                key={v.id || idx}
                                className="p-4 sm:p-5 bg-stone-50/70 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl space-y-4 transition-all shadow-xs"
                              >
                                {/* Top Bar: Order, Type Selector, Move buttons, Delete */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 dark:border-zinc-800/60 pb-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center justify-center font-mono shrink-0">
                                      {idx + 1}
                                    </span>

                                    {/* Type Toggle Pills */}
                                    <div className="inline-flex rounded-lg border border-stone-300 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-950 text-[10px]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleUpdateVariation(idx, 'type', 'color');
                                          if (!v.color && v.size) handleUpdateVariation(idx, 'color', v.size);
                                          handleUpdateVariation(idx, 'size', undefined);
                                        }}
                                        className={`px-2 py-1 rounded font-semibold cursor-pointer transition ${
                                          v.type === 'color' || (!v.type && !v.size)
                                            ? 'bg-amber-600 text-white'
                                            : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                                        }`}
                                      >
                                        Color Only
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleUpdateVariation(idx, 'type', 'size');
                                          if (!v.size && v.color) handleUpdateVariation(idx, 'size', v.color);
                                          handleUpdateVariation(idx, 'color', undefined);
                                        }}
                                        className={`px-2 py-1 rounded font-semibold cursor-pointer transition ${
                                          v.type === 'size'
                                            ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                                            : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                                        }`}
                                      >
                                        Size Only
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleUpdateVariation(idx, 'type', 'combination');
                                          if (!v.color) handleUpdateVariation(idx, 'color', 'Black');
                                          if (!v.size) handleUpdateVariation(idx, 'size', '32');
                                        }}
                                        className={`px-2 py-1 rounded font-semibold cursor-pointer transition ${
                                          v.type === 'combination'
                                            ? 'bg-amber-700 text-white'
                                            : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                                        }`}
                                      >
                                        Color + Size
                                      </button>
                                    </div>

                                    {/* Color Swatch Preview Dot */}
                                    {isColor && (
                                      <div
                                        className="w-5 h-5 rounded-full border border-stone-300 dark:border-zinc-700 shadow-xs shrink-0"
                                        style={{ backgroundColor: v.colorCode || '#1c1917' }}
                                        title={v.colorCode || '#1c1917'}
                                      />
                                    )}

                                    {/* Label Preview */}
                                    <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                                      {v.name || `Variation #${idx + 1}`}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 self-end sm:self-auto">
                                    {/* Move Up */}
                                    <button
                                      type="button"
                                      onClick={() => handleMoveVariation(idx, 'up')}
                                      disabled={idx === 0}
                                      title="Move up"
                                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    {/* Move Down */}
                                    <button
                                      type="button"
                                      onClick={() => handleMoveVariation(idx, 'down')}
                                      disabled={idx === variations.length - 1}
                                      title="Move down"
                                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    {/* Delete */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariation(idx)}
                                      title="Remove this variation"
                                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition ml-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Form Fields Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Color Input & Swatch (if isColor) */}
                                  {isColor && (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300">
                                          Color Name <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-[10px] text-stone-400">e.g. Brown</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          required={isColor}
                                          value={v.color !== undefined ? v.color : (v.type !== 'size' && !v.size ? v.name : '')}
                                          onChange={(e) => {
                                            handleUpdateVariation(idx, 'color', e.target.value);
                                          }}
                                          placeholder="e.g. Black, Brown, Tan"
                                          className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-amber-500"
                                        />
                                        <input
                                          type="color"
                                          value={v.colorCode || '#1c1917'}
                                          onChange={(e) => handleUpdateVariation(idx, 'colorCode', e.target.value)}
                                          className="w-9 h-9 p-0.5 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 cursor-pointer shrink-0"
                                          title="Choose color swatch"
                                        />
                                      </div>
                                      {/* Quick color suggestion pills */}
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {[
                                          { name: 'Black', code: '#1c1917' },
                                          { name: 'Brown', code: '#78350f' },
                                          { name: 'Dark Brown', code: '#451a03' },
                                          { name: 'Tan', code: '#b45309' },
                                          { name: 'Cognac', code: '#92400e' },
                                          { name: 'Silver', code: '#94a3b8' },
                                          { name: 'Gold', code: '#eab308' },
                                        ].map((sug) => (
                                          <button
                                            key={sug.name}
                                            type="button"
                                            onClick={() => {
                                              handleUpdateVariation(idx, 'color', sug.name);
                                              handleUpdateVariation(idx, 'colorCode', sug.code);
                                            }}
                                            className="px-1.5 py-0.5 text-[10px] rounded bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-800 cursor-pointer"
                                          >
                                            {sug.name}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Size Input (if isSize) */}
                                  {isSize && (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300">
                                          Size Value <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-[10px] text-stone-400">Custom / Any Format</span>
                                      </div>
                                      <input
                                        type="text"
                                        required={isSize}
                                        value={v.size !== undefined ? v.size : (v.type === 'size' ? v.name : '')}
                                        onChange={(e) => {
                                          handleUpdateVariation(idx, 'size', e.target.value);
                                        }}
                                        placeholder="e.g. 32, 34, 36, Small, Medium, Large"
                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-amber-500"
                                      />
                                      {/* Quick size suggestion pills */}
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {['30', '32', '34', '36', '38', '40', 'Small', 'Medium', 'Large', 'XL'].map((sVal) => (
                                          <button
                                            key={sVal}
                                            type="button"
                                            onClick={() => handleUpdateVariation(idx, 'size', sVal)}
                                            className="px-1.5 py-0.5 text-[10px] rounded bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-zinc-700 cursor-pointer"
                                          >
                                            {sVal}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Variation SKU */}
                                  <div className="space-y-1.5">
                                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300">
                                      Variation SKU (Optional)
                                    </label>
                                    <input
                                      type="text"
                                      value={v.sku || ''}
                                      onChange={(e) => handleUpdateVariation(idx, 'sku', e.target.value.toUpperCase())}
                                      placeholder={
                                        sku
                                          ? `${sku}-${(v.color || v.name || 'VAR').slice(0, 3).toUpperCase()}${v.size ? `-${v.size}` : ''}`
                                          : 'SKU-VAR'
                                      }
                                      className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500"
                                    />
                                    <p className="text-[10px] text-stone-400">
                                      Will display in cart, checkout, and invoice.
                                    </p>
                                  </div>
                                </div>

                                {/* Variation Image Selector */}
                                <div className="pt-3 border-t border-stone-200/50 dark:border-zinc-800/50 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300">
                                      Variation-Specific Image
                                    </label>
                                    <span className="text-[10px] text-stone-400">
                                      {v.type === 'combination'
                                        ? 'Dedicated image for this combination (falls back to color image if empty)'
                                        : 'Dedicated image shown when this option is selected'}
                                    </span>
                                  </div>

                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    {/* Thumbnail Preview */}
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-200 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 shrink-0 shadow-xs">
                                      {v.image ? (
                                        <img
                                          src={v.image}
                                          alt={v.name || 'Variation'}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = mainImage || '/fawnic-logo.jpg';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                                          <ImageIcon className="w-6 h-6" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2 w-full">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {/* Upload Button */}
                                        <label className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs">
                                          <Upload className="w-3.5 h-3.5" />
                                          <span>{uploadingVariationIndex === idx ? 'Uploading...' : 'Upload Image'}</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingVariationIndex === idx}
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleVariationFileUpload(idx, file);
                                              e.target.value = '';
                                            }}
                                          />
                                        </label>

                                        {/* Gallery Picker Toggle */}
                                        {([mainImage, ...images].filter(Boolean).length > 0) && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setShowGalleryPickerIndex(
                                                showGalleryPickerIndex === idx ? null : idx
                                              )
                                            }
                                            className="px-3 py-1.5 border border-stone-300 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg text-xs text-stone-700 dark:text-stone-300 font-medium cursor-pointer transition flex items-center gap-1.5"
                                          >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            <span>Choose from Article Photos</span>
                                          </button>
                                        )}

                                        {/* Clear Image */}
                                        {v.image && (
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateVariation(idx, 'image', '')}
                                            className="px-2 py-1.5 text-xs text-stone-500 hover:text-rose-600 transition cursor-pointer"
                                          >
                                            Clear
                                          </button>
                                        )}
                                      </div>

                                      {/* Direct Image URL input */}
                                      <input
                                        type="text"
                                        value={v.image || ''}
                                        onChange={(e) => handleUpdateVariation(idx, 'image', e.target.value)}
                                        placeholder="Or paste image URL (e.g. https://... or /uploads/...)"
                                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500"
                                      />

                                      {/* Quick Image Picker Dropdown from existing photos */}
                                      {showGalleryPickerIndex === idx && (
                                        <div className="p-3 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-xl space-y-2 animate-in fade-in duration-150">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                                              Select from product's existing images:
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => setShowGalleryPickerIndex(null)}
                                              className="text-stone-400 hover:text-stone-600 text-[10px]"
                                            >
                                              Close
                                            </button>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {Array.from(new Set([mainImage, ...images].filter(Boolean))).map((imgUrl, i) => (
                                              <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                  handleUpdateVariation(idx, 'image', imgUrl);
                                                  setShowGalleryPickerIndex(null);
                                                }}
                                                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                                                  v.image === imgUrl
                                                    ? 'border-amber-600 ring-2 ring-amber-500/30'
                                                    : 'border-stone-200 dark:border-zinc-700 hover:border-stone-400'
                                                }`}
                                              >
                                                <img
                                                  src={imgUrl}
                                                  alt={`Slot ${i}`}
                                                  className="w-full h-full object-cover"
                                                />
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="px-4 py-2 uppercase tracking-wider font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 uppercase tracking-widest font-serif font-bold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl hover:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Saving Article...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingProduct ? 'Save Article Changes' : 'Publish Leather Article'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
