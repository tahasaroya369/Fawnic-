import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, ShoppingBag, User, FileText, ShieldCheck, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onSelectResult: (type: 'product' | 'order' | 'customer' | 'invoice' | 'team', item: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  token,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    products: any[];
    orders: any[];
    customers: any[];
    invoices: any[];
    team: any[];
  }>({ products: [], orders: [], customers: [], invoices: [], team: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ products: [], orders: [], customers: [], invoices: [], team: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ products: [], orders: [], customers: [], invoices: [], team: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, token]);

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalResultsCount =
    results.products.length +
    results.orders.length +
    results.customers.length +
    results.invoices.length +
    results.team.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-stone-950/80 backdrop-blur-xs pt-16 sm:pt-24">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-900/50">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by SKU, orders by #, customer names, invoices... (Press ESC to exit)"
            className="flex-1 text-sm bg-transparent border-none outline-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          />
          {loading ? (
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : query ? (
            <button onClick={() => setQuery('')} className="p-1 text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-200 dark:bg-zinc-800 text-stone-500">
              ESC
            </span>
          )}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs">
          {query.trim().length >= 2 && totalResultsCount === 0 && !loading && (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <p className="font-serif">No atelier records found for "{query}"</p>
              <p className="text-[11px] text-stone-400">Try searching by SKU, customer name, phone number, or order ID.</p>
            </div>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <div>
              <p className="uppercase text-[10px] font-serif font-bold tracking-widest text-stone-400 mb-2 px-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-500" />
                <span>Leather Catalog ({results.products.length})</span>
              </p>
              <div className="space-y-1">
                {results.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onSelectResult('product', p);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-9 h-9 object-cover rounded-lg border border-stone-200 dark:border-zinc-800" />
                      <div>
                        <p className="font-serif font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition">{p.name}</p>
                        <p className="text-[11px] text-stone-500 font-mono">SKU: {p.sku} • Stock: {p.stock} units</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">Rs. {p.price.toLocaleString()}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {results.orders.length > 0 && (
            <div>
              <p className="uppercase text-[10px] font-serif font-bold tracking-widest text-stone-400 mb-2 px-2 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                <span>Orders ({results.orders.length})</span>
              </p>
              <div className="space-y-1">
                {results.orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      onClose();
                      onSelectResult('order', o);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition group"
                  >
                    <div>
                      <p className="font-mono font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition">#{o.orderNumber}</p>
                      <p className="text-[11px] text-stone-500">Customer: {o.customer}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-200 dark:bg-zinc-800">{o.status}</span>
                      <span className="font-mono font-bold text-stone-800 dark:text-stone-200">Rs. {o.total.toLocaleString()}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <p className="uppercase text-[10px] font-serif font-bold tracking-widest text-stone-400 mb-2 px-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Customers ({results.customers.length})</span>
              </p>
              <div className="space-y-1">
                {results.customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onClose();
                      onSelectResult('customer', c);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="font-serif font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition">{c.name}</p>
                        <p className="text-[11px] text-stone-500">{c.email} • {c.phone}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {results.invoices.length > 0 && (
            <div>
              <p className="uppercase text-[10px] font-serif font-bold tracking-widest text-stone-400 mb-2 px-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Invoices ({results.invoices.length})</span>
              </p>
              <div className="space-y-1">
                {results.invoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      onClose();
                      onSelectResult('invoice', inv);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition group"
                  >
                    <div>
                      <p className="font-mono font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition">{inv.invoiceNumber}</p>
                      <p className="text-[11px] text-stone-500">Order #{inv.orderNumber} • {inv.customerName}</p>
                    </div>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">Rs. {inv.total.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Team */}
          {results.team.length > 0 && (
            <div>
              <p className="uppercase text-[10px] font-serif font-bold tracking-widest text-stone-400 mb-2 px-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Atelier Staff ({results.team.length})</span>
              </p>
              <div className="space-y-1">
                {results.team.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onClose();
                      onSelectResult('team', m);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition group"
                  >
                    <div>
                      <p className="font-serif font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition">{m.name}</p>
                      <p className="text-[11px] text-stone-500">{m.email} • Role: {m.role}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-amber-500/10 text-amber-600">{m.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!query && (
            <div className="py-8 text-center text-stone-400 space-y-1">
              <p className="font-serif text-sm">Quick Jump</p>
              <p className="text-[11px]">Type at least 2 characters to search across catalog, orders, and clients.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
