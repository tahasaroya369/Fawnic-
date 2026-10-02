import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';
import type { TeamMember, AdminRole, StaffPermissions } from '../../types.js';

interface TeamMemberModalProps {
  member?: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
}

const ROLES: { key: AdminRole; label: string; desc: string }[] = [
  { key: 'manager', label: 'Atelier Manager', desc: 'Catalog, customer relations, coupons, and orders management' },
  { key: 'order_manager', label: 'Logistics & Dispatch Manager', desc: 'TCS/courier booking, packing inspection, order statuses' },
  { key: 'catalog_manager', label: 'Catalog & Leather Specialist', desc: 'Product photography, specs, pricing, and stock additions' },
  { key: 'accountant', label: 'Finance & Tax Accountant', desc: 'Invoices, bank transfer reconciliations, and revenue reports' },
  { key: 'support', label: 'Customer Concierge', desc: 'Customer tracking queries, view order timelines, inspect notes' },
  { key: 'super_admin', label: 'Super Admin', desc: 'Complete unrestricted access to all atelier operations' },
];

const AVAILABLE_PAGES: { key: string; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard Overview' },
  { key: 'products', label: 'Products Catalog' },
  { key: 'categories', label: 'Categories' },
  { key: 'orders', label: 'Orders & Fulfillment' },
  { key: 'inventory', label: 'Inventory Management' },
  { key: 'crm', label: 'Customers (CRM)' },
  { key: 'invoices', label: 'Tax Invoices' },
  { key: 'coupons', label: 'Marketing & Coupons' },
  { key: 'analytics', label: 'Analytics & Reports' },
  { key: 'settings', label: 'Store Settings' },
];

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onSuccess,
  token,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AdminRole>('manager');
  const [status, setStatus] = useState<'active' | 'disabled'>('active');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Granular Permissions
  const [selectedPages, setSelectedPages] = useState<string[]>([
    'dashboard',
    'orders',
    'products',
    'inventory',
  ]);

  const [actions, setActions] = useState({
    products: { view: true, add: false, edit: false, publish: false, unpublish: false, delete: false },
    orders: { view: true, edit: false, cancel: false, delete: false },
    invoices: { view: false, create: false, edit: false, download: false, delete: false },
    staff: { view: false, create: false, edit: false, delete: false, manage_permissions: false },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setName(member.name);
        setEmail(member.email);
        setPhone(member.phone);
        setRole((member.role as AdminRole) || 'manager');
        setStatus(member.status === 'disabled' ? 'disabled' : 'active');
        setAvatar(member.avatar || '');
        setPassword('');
        setConfirmPassword('');

        if (member.permissions) {
          setSelectedPages(member.permissions.pages || []);
          if (member.permissions.actions) {
            setActions({
              products: { ...actions.products, ...member.permissions.actions.products },
              orders: { ...actions.orders, ...member.permissions.actions.orders },
              invoices: { ...actions.invoices, ...member.permissions.actions.invoices },
              staff: { ...actions.staff, ...member.permissions.actions.staff },
            });
          }
        }
      } else {
        setName('');
        setEmail('');
        setPhone('+92 300 ');
        setRole('manager');
        setStatus('active');
        setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
        setPassword('');
        setConfirmPassword('');
        setSelectedPages(['dashboard', 'orders', 'products', 'inventory']);
        setActions({
          products: { view: true, add: true, edit: true, publish: true, unpublish: false, delete: false },
          orders: { view: true, edit: true, cancel: false, delete: false },
          invoices: { view: true, create: false, edit: false, download: true, delete: false },
          staff: { view: false, create: false, edit: false, delete: false, manage_permissions: false },
        });
      }
      setError('');
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const togglePage = (pageKey: string) => {
    setSelectedPages((prev) =>
      prev.includes(pageKey) ? prev.filter((p) => p !== pageKey) : [...prev, pageKey]
    );
  };

  const selectAllPages = () => {
    setSelectedPages(AVAILABLE_PAGES.map((p) => p.key));
  };

  const clearAllPages = () => {
    setSelectedPages(['dashboard']);
  };

  const handleActionToggle = (category: 'products' | 'orders' | 'invoices' | 'staff', actionKey: string) => {
    setActions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [actionKey]: !(prev[category] as any)[actionKey],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Staff member full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid staff email address is required.');
      return;
    }

    if (!member) {
      if (!password || password.length < 6) {
        setError('Password is required and must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password and Confirm Password do not match.');
        return;
      }
    } else if (password) {
      if (password.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('New Password and Confirm Password do not match.');
        return;
      }
    }

    try {
      setLoading(true);
      const permissions: StaffPermissions = {
        pages: selectedPages,
        actions,
      };

      const payload: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        status,
        avatar,
        permissions,
      };

      if (password) {
        payload.password = password;
        payload.confirmPassword = confirmPassword;
      }

      const url = member ? `/api/admin/team/${member.id}` : '/api/admin/team';
      const method = member ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save staff account.');
      }

      // If updating an existing member and password was specified, call password endpoint as well
      if (member && password) {
        await fetch(`/api/admin/team/${member.id}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword: password, confirmPassword }),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Staff submit error:', err);
      setError(err.message || 'Server error saving staff account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                {member ? 'Edit Atelier Staff Account' : 'Create Lifetime Staff Account'}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Permanent access credentials with customizable granular permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-800 dark:text-stone-200">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 border-b border-stone-200 dark:border-zinc-800 pb-1">
              1. Personal & Contact Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Farhan Ali"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    disabled={Boolean(member)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farhan@fawnic.pk"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Account Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="active">Active (Can Sign In)</option>
                  <option value="disabled">Disabled (Cannot Sign In)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Role Assignment */}
          <div className="space-y-3">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 border-b border-stone-200 dark:border-zinc-800 pb-1">
              2. Primary Atelier Role
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLES.map((r) => (
                <label
                  key={r.key}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                    role === r.key
                      ? 'bg-amber-500/10 border-amber-500 dark:border-amber-500/50'
                      : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="staff_role"
                    checked={role === r.key}
                    onChange={() => setRole(r.key)}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 block">
                      {r.label}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight block mt-0.5">
                      {r.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Granular Page Permissions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-1">
              <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                3. Allowed Admin Console Pages
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllPages}
                  className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                >
                  Select All
                </button>
                <span className="text-stone-400">|</span>
                <button
                  type="button"
                  onClick={clearAllPages}
                  className="text-[10px] text-stone-500 hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_PAGES.map((page) => (
                <label
                  key={page.key}
                  className="flex items-center gap-2 p-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40 cursor-pointer hover:bg-stone-100 dark:hover:bg-zinc-800 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedPages.includes(page.key)}
                    onChange={() => togglePage(page.key)}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-stone-800 dark:text-stone-200 truncate">{page.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 4: Granular Action Permissions */}
          <div className="space-y-3">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 border-b border-stone-200 dark:border-zinc-800 pb-1">
              4. Action Privileges (Create, Edit, Delete)
            </h4>

            <div className="space-y-3 text-xs">
              {/* Products */}
              <div className="p-3 bg-stone-50 dark:bg-zinc-800/40 rounded-xl border border-stone-200 dark:border-zinc-800">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-2">
                  Products Operations:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.products.view}
                      onChange={() => handleActionToggle('products', 'view')}
                    />
                    <span>View Products</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.products.add}
                      onChange={() => handleActionToggle('products', 'add')}
                    />
                    <span>Add New</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.products.edit}
                      onChange={() => handleActionToggle('products', 'edit')}
                    />
                    <span>Edit Specs/Price</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.products.delete}
                      onChange={() => handleActionToggle('products', 'delete')}
                    />
                    <span className="text-rose-600 dark:text-rose-400">Delete Product</span>
                  </label>
                </div>
              </div>

              {/* Orders */}
              <div className="p-3 bg-stone-50 dark:bg-zinc-800/40 rounded-xl border border-stone-200 dark:border-zinc-800">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-2">
                  Orders & Logistics Operations:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.orders.view}
                      onChange={() => handleActionToggle('orders', 'view')}
                    />
                    <span>View Orders</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.orders.edit}
                      onChange={() => handleActionToggle('orders', 'edit')}
                    />
                    <span>Change Status / Courier</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.orders.cancel}
                      onChange={() => handleActionToggle('orders', 'cancel')}
                    />
                    <span>Cancel Orders</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.orders.delete}
                      onChange={() => handleActionToggle('orders', 'delete')}
                    />
                    <span className="text-rose-600 dark:text-rose-400">Delete Record</span>
                  </label>
                </div>
              </div>

              {/* Invoices */}
              <div className="p-3 bg-stone-50 dark:bg-zinc-800/40 rounded-xl border border-stone-200 dark:border-zinc-800">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-2">
                  Invoices & Financials:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.invoices.view}
                      onChange={() => handleActionToggle('invoices', 'view')}
                    />
                    <span>View Invoices</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.invoices.create}
                      onChange={() => handleActionToggle('invoices', 'create')}
                    />
                    <span>Create Manual Invoice</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.invoices.download}
                      onChange={() => handleActionToggle('invoices', 'download')}
                    />
                    <span>Download PDF / Print</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actions.invoices.delete}
                      onChange={() => handleActionToggle('invoices', 'delete')}
                    />
                    <span className="text-rose-600 dark:text-rose-400">Delete Invoice</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Security Credentials */}
          <div className="space-y-3">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 border-b border-stone-200 dark:border-zinc-800 pb-1">
              5. Staff Sign-in Credentials {member ? '(Leave blank to retain current)' : '*'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  {member ? 'New Password' : 'Password *'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!member}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-9 pr-9 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Confirm Password {member ? '(if changing)' : '*'}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!member || Boolean(password)}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-serif uppercase tracking-wider text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{member ? 'Save Staff Changes' : 'Create Staff Account'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
