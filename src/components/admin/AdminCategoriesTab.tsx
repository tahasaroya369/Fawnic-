import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Edit2,
  Trash2,
  Package,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Power,
  ArrowUpDown,
  Image as ImageIcon,
} from 'lucide-react';
import type { Category } from '../../types.js';

interface AdminCategoriesTabProps {
  token: string | null;
  onRefreshCategories?: () => void;
}

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({
  token,
  onRefreshCategories,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [banner, setBanner] = useState('');
  const [icon, setIcon] = useState('briefcase');
  const [subcategories, setSubcategories] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<any | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Sort by order
        data.sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setBanner('https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=80');
    setIcon('briefcase');
    setSubcategories('');
    setOrder(categories.length + 1);
    setIsActive(true);
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setBanner(cat.banner || cat.image || '');
    setIcon(cat.icon || 'briefcase');
    setSubcategories(Array.isArray(cat.subcategories) ? cat.subcategories.join(', ') : '');
    setOrder(cat.order ?? 1);
    setIsActive(cat.isActive !== false);
    setError('');
    setModalOpen(true);
  };

  const handleToggleStatus = async (cat: any) => {
    try {
      const nextStatus = cat.isActive === false ? true : false;
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res.ok) {
        fetchCategories();
        if (onRefreshCategories) onRefreshCategories();
      }
    } catch (err) {
      console.error('Failed to toggle category status:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        banner: banner.trim(),
        image: banner.trim(),
        icon: icon.trim(),
        order: Number(order) || 1,
        isActive: Boolean(isActive),
        subcategories: subcategories
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save category');
      }

      setModalOpen(false);
      fetchCategories();
      if (onRefreshCategories) onRefreshCategories();
    } catch (err: any) {
      setError(err.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCat) return;

    try {
      const res = await fetch(`/api/admin/categories/${deleteConfirmCat.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete category');
        return;
      }

      setDeleteConfirmCat(null);
      fetchCategories();
      if (onRefreshCategories) onRefreshCategories();
    } catch (err) {
      console.error('Delete category error:', err);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Leather Categories & Collections
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Create, edit, arrange display priority, and toggle customer visibility for all catalog categories.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-serif uppercase tracking-wider font-bold rounded-xl hover:bg-amber-600 transition flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter categories by name, slug or description..."
          className="w-full text-xs bg-transparent border-none focus:outline-hidden text-stone-900 dark:text-stone-100"
        />
      </div>

      {/* Categories Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-stone-500">
            Loading atelier categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-stone-500">
            No categories found matching your query.
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className={`group bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                cat.isActive === false
                  ? 'border-stone-200 dark:border-zinc-800 opacity-60'
                  : 'border-stone-200 dark:border-zinc-800'
              }`}
            >
              <div>
                {/* Banner Thumbnail */}
                <div className="h-36 w-full relative overflow-hidden bg-stone-100 dark:bg-zinc-950">
                  <img
                    src={cat.banner || cat.image || 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=80'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-stone-900/90 text-white text-[10px] font-mono font-bold backdrop-blur-xs flex items-center gap-1 border border-stone-700/60">
                      <ArrowUpDown className="w-2.5 h-2.5 text-amber-400" />
                      Priority #{cat.order ?? 999}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs ${
                        cat.isActive !== false
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {cat.isActive !== false ? 'Active in Shop' : 'Hidden / Inactive'}
                    </span>
                  </div>

                  {/* Bottom Header Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-white">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] font-mono text-amber-400">/{cat.slug}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-stone-900/90 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/30">
                      {cat.productCount || 0} products
                    </span>
                  </div>
                </div>

                {/* Description and Subcategories */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                    {cat.description || 'Artisan leather collection handcrafted with premium hides.'}
                  </p>

                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cat.subcategories.map((sub: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-400 text-[10px] font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 pt-2 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                {/* Quick Toggle Status */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(cat)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                    cat.isActive !== false
                      ? 'bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-stone-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  }`}
                  title={cat.isActive !== false ? 'Click to disable category' : 'Click to enable category'}
                >
                  <Power className="w-3 h-3" />
                  <span>{cat.isActive !== false ? 'Disable' : 'Enable'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-amber-600 transition cursor-pointer"
                    title="Edit category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmCat(cat)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-stone-50 dark:bg-zinc-900">
              <h3 className="font-serif font-bold text-base">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Leather Wallets"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Slug / URL Path
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. wallets (auto-generated if empty)"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Artisan notes on this product family..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Category Image / Banner URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                {banner && (
                  <div className="mt-2 h-20 w-36 rounded-lg overflow-hidden border border-stone-300 dark:border-zinc-700 relative">
                    <img
                      src={banner}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Display Order / Priority
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                    placeholder="1, 2, 3..."
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">Lower numbers display first in Shop filter tabs.</p>
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Active Status
                  </label>
                  <div className="pt-1.5 flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                    <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                      {isActive ? 'Active (Visible in Shop)' : 'Inactive (Hidden)'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Subcategories (comma separated)
                </label>
                <input
                  type="text"
                  value={subcategories}
                  onChange={(e) => setSubcategories(e.target.value)}
                  placeholder="Bifold, Cardholder, Passport Cover"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-xl font-semibold text-stone-700 dark:text-stone-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-serif font-bold uppercase tracking-wider hover:bg-amber-600 transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-500/10">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Delete Category: &ldquo;{deleteConfirmCat.name}&rdquo;?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              This category will be permanently removed from your catalog. Note that if any products are currently assigned to this category, deletion will be blocked to protect catalog integrity.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-xs font-semibold rounded-xl text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-serif uppercase tracking-wider font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
