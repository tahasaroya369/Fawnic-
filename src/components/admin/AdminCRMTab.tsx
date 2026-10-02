import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  Mail,
  Phone,
  ShoppingBag,
  DollarSign,
  UserCheck,
  Star,
  Eye,
  RefreshCw,
} from 'lucide-react';
import type { CustomerCRM } from '../../types.js';

interface AdminCRMTabProps {
  token: string | null;
  onOpenCustomerProfile: (customerId: string) => void;
}

export const AdminCRMTab: React.FC<AdminCRMTabProps> = ({
  token,
  onOpenCustomerProfile,
}) => {
  const [customers, setCustomers] = useState<CustomerCRM[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterVip, setFilterVip] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [token]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open('/api/admin/reports/export?type=customers', '_blank');
  };

  const filtered = customers.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase());

    const isVip = c.totalSpent > 25000;
    if (filterVip && !isVip) return false;

    return matchesSearch;
  });

  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const vipCount = customers.filter((c) => c.totalSpent > 25000).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Customer Relationship Management (CRM)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Profiles, lifetime luxury leather spend, order histories, and concierge notes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-stone-200 dark:border-zinc-700"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Customers CSV</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            Total Registered Customers
          </span>
          <p className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1">
            {customers.length} Clients
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            VIP Atelier Customers (&gt;Rs. 25k)
          </span>
          <p className="font-serif font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
            {vipCount} Members
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
            Total Customer LTV
          </span>
          <p className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1">
            Rs. {totalSpent.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, email, or Pakistani mobile number..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterVip(!filterVip)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
              filterVip
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-stone-50 dark:bg-zinc-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-zinc-800'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>VIPs Only</span>
          </button>

          <button
            onClick={loadCustomers}
            className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Customer Profile</th>
                <th className="px-5 py-3">Contact Details</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Lifetime Spend</th>
                <th className="px-5 py-3">Last Order</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-500">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isVip = c.totalSpent > 25000;
                  return (
                    <tr key={c.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-900/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              c.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                            }
                            alt={c.name}
                            className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-zinc-800 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-serif font-semibold text-stone-900 dark:text-stone-100">
                                {c.name}
                              </p>
                              {isVip && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600">
                                  VIP
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-400">
                              Joined {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-PK') : '2024'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="text-stone-700 dark:text-stone-300 font-medium">{c.email}</p>
                        <p className="font-mono text-stone-500 text-[11px]">{c.phone}</p>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                          {c.ordersCount} orders
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                          Rs. {c.totalSpent.toLocaleString()}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-stone-500">
                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-PK') : 'No orders yet'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenCustomerProfile(c.id)}
                          className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold rounded-lg hover:bg-amber-600 transition flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
