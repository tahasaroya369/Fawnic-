import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  Trash2,
  Send,
  User,
  ShieldCheck,
  Calendar,
  Tag,
  Hash,
  Copy,
  Check,
  X,
  ChevronRight,
  ExternalLink,
  Plus,
  ShoppingBag,
  Sparkles,
  Lock,
  FileText,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { notificationSocket } from '../../services/notificationSocket.js';
import type {
  CustomerQuery,
  CustomerQueryStats,
  QueryCategory,
  QueryStatus,
  QueryPriority,
  QueryMessage,
  QueryInternalNote,
} from '../../types.js';

interface AdminQueriesTabProps {
  token: string | null;
  onOpenCustomerProfile?: (customerId: string) => void;
  onOpenOrder?: (orderNumber: string) => void;
}

const CATEGORIES: QueryCategory[] = [
  'General Question',
  'Order',
  'Product',
  'Shipping',
  'Payment',
  'Return / Exchange',
  'Complaint',
  'Wholesale',
  'Other',
];

const STATUS_CONFIG: Record<
  QueryStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  new: {
    label: 'New Inquiry',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  waiting_customer: {
    label: 'Waiting on Customer',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  replied: {
    label: 'Replied',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-stone-100 dark:bg-zinc-800',
    text: 'text-stone-700 dark:text-zinc-300',
    border: 'border-stone-200 dark:border-zinc-700',
  },
  closed: {
    label: 'Closed',
    bg: 'bg-stone-100 dark:bg-zinc-800',
    text: 'text-stone-500 dark:text-zinc-400',
    border: 'border-stone-200 dark:border-zinc-700',
  },
};

const PRIORITY_CONFIG: Record<
  QueryPriority,
  { label: string; dot: string; badge: string }
> = {
  low: {
    label: 'Low',
    dot: 'bg-stone-400',
    badge: 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-200 dark:border-zinc-700',
  },
  normal: {
    label: 'Normal',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  high: {
    label: 'High',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  urgent: {
    label: 'Urgent',
    dot: 'bg-rose-500 animate-pulse',
    badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  },
};

const CANNED_RESPONSES = [
  {
    title: 'Order Tracking & Logistics',
    text: 'Thank you for reaching out to FAWNIC Atelier. Your handcrafted leather creation is dispatched via our courier partners (TCS / Leopards / Call Courier). Nationwide deliveries typically arrive within 2-4 working days. You can track your dispatch status anytime using your Tracking ID on our tracking page.',
  },
  {
    title: 'Warranty & Atelier Craftsmanship',
    text: 'FAWNIC provides an official 1-year atelier warranty on all full-grain leather articles, covering structural stitch integrity and hardware mechanisms. Should you encounter any issue, our master artisans in Karachi will inspect and restore your article.',
  },
  {
    title: '7-Day Return / Exchange Instructions',
    text: 'We are pleased to offer a hassle-free 7-day exchange and return policy across Pakistan. Please ensure the article remains in original packaging with protective seals intact. Our concierge team can arrange reverse pickup or provide courier return details.',
  },
  {
    title: 'Custom Leather Embossing',
    text: 'Atelier FAWNIC offers bespoke hot-foil and blind debossing on select wallets, belts, and heirloom bags. Please confirm your desired initials (up to 3 characters) and preferred placement.',
  },
  {
    title: 'Corporate & Bulk Inquiries',
    text: 'Thank you for your interest in FAWNIC corporate gifting. We provide bespoke executive gift hampers with custom brass monogramming. A member of our corporate concierge will connect with you with our catalog and tiered pricing.',
  },
];

export const AdminQueriesTab: React.FC<AdminQueriesTabProps> = ({
  token,
  onOpenCustomerProfile,
  onOpenOrder,
}) => {
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [stats, setStats] = useState<CustomerQueryStats>({
    total: 0,
    new: 0,
    inProgress: 0,
    waitingCustomer: 0,
    replied: 0,
    resolved: 0,
    closed: 0,
    unread: 0,
    archived: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Detail Modal State
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [selectedQueryData, setSelectedQueryData] = useState<{
    query: CustomerQuery;
    customerInfo: any;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Detail Form State
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [internalNoteText, setInternalNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Copy indicator
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchQueries = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterDateRange !== 'all') params.append('dateRange', filterDateRange);
      if (showArchived) params.append('archived', 'true');

      const res = await fetch(`/api/admin/queries?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setQueries(data.queries || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load queries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [token, filterStatus, filterPriority, filterCategory, filterDateRange, showArchived]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQueries(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Real-time WebSocket updates
  useEffect(() => {
    const unsubscribe = notificationSocket.subscribe((event) => {
      if (event.type && event.type.startsWith('query:')) {
        // Query created, updated, message, or deleted
        fetchQueries(true);

        // If currently viewing the query, refresh detail view
        if (selectedQueryId && (event.queryId === selectedQueryId || event.query?.id === selectedQueryId)) {
          fetchQueryDetail(selectedQueryId, true);
        }
      }
    });

    return unsubscribe;
  }, [token, selectedQueryId]);

  // Fetch full details of a single query
  const fetchQueryDetail = async (id: string, silent = false) => {
    if (!token) return;
    if (!silent) setDetailLoading(true);

    try {
      const res = await fetch(`/api/admin/queries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedQueryData(data);
        // Mark local query as read
        setQueries((prev) =>
          prev.map((q) => (q.id === id ? { ...q, isReadByAdmin: true } : q))
        );
      }
    } catch (err) {
      console.error('Failed to fetch query detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenDetail = (id: string) => {
    setSelectedQueryId(id);
    setReplyText('');
    setInternalNoteText('');
    fetchQueryDetail(id);
  };

  const handleCloseDetail = () => {
    setSelectedQueryId(null);
    setSelectedQueryData(null);
  };

  // Scroll messages to bottom when thread updates
  useEffect(() => {
    if (selectedQueryData?.query?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedQueryData?.query?.messages?.length]);

  // Update Status
  const handleUpdateStatus = async (queryId: string, newStatus: QueryStatus) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/queries/${queryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setQueries((prev) =>
          prev.map((q) => (q.id === queryId ? { ...q, status: newStatus, updatedAt: data.query.updatedAt } : q))
        );
        if (selectedQueryData?.query?.id === queryId) {
          setSelectedQueryData((prev) =>
            prev ? { ...prev, query: { ...prev.query, ...data.query } } : prev
          );
        }
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Update Priority
  const handleUpdatePriority = async (queryId: string, newPriority: QueryPriority) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/queries/${queryId}/priority`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        const data = await res.json();
        setQueries((prev) =>
          prev.map((q) => (q.id === queryId ? { ...q, priority: newPriority } : q))
        );
        if (selectedQueryData?.query?.id === queryId) {
          setSelectedQueryData((prev) =>
            prev ? { ...prev, query: { ...prev.query, priority: newPriority } } : prev
          );
        }
      }
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  // Toggle Read / Unread
  const handleToggleRead = async (queryId: string, currentRead: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/queries/${queryId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isRead: !currentRead }),
      });
      if (res.ok) {
        const data = await res.json();
        setQueries((prev) =>
          prev.map((q) => (q.id === queryId ? { ...q, isReadByAdmin: !currentRead } : q))
        );
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to toggle read state:', err);
    }
  };

  // Archive / Unarchive
  const handleToggleArchive = async (queryId: string, currentArchived: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/queries/${queryId}/archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isArchived: !currentArchived }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchQueries(true);
        if (selectedQueryData?.query?.id === queryId) {
          setSelectedQueryData((prev) =>
            prev ? { ...prev, query: { ...prev.query, isArchived: !currentArchived } } : prev
          );
        }
      }
    } catch (err) {
      console.error('Failed to archive query:', err);
    }
  };

  // Delete query
  const handleDeleteQuery = async (queryId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/queries/${queryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        if (selectedQueryId === queryId) {
          handleCloseDetail();
        }
        fetchQueries(true);
      }
    } catch (err) {
      console.error('Failed to delete query:', err);
    }
  };

  // Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedQueryId || !replyText.trim() || replying) return;

    setReplying(true);
    try {
      const res = await fetch(`/api/admin/queries/${selectedQueryId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplyText('');
        if (selectedQueryData) {
          setSelectedQueryData({
            ...selectedQueryData,
            query: {
              ...selectedQueryData.query,
              ...data.query,
            },
          });
        }
        fetchQueries(true);
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setReplying(false);
    }
  };

  // Add Internal Note
  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedQueryId || !internalNoteText.trim() || addingNote) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/queries/${selectedQueryId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: internalNoteText.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setInternalNoteText('');
        if (selectedQueryData) {
          const notes = selectedQueryData.query.internalNotes || [];
          setSelectedQueryData({
            ...selectedQueryData,
            query: {
              ...selectedQueryData.query,
              internalNotes: [data.note, ...notes],
            },
          });
        }
      }
    } catch (err) {
      console.error('Failed to add internal note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  // Copy Query ID
  const copyQueryNumber = (number: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(number);
    setCopiedNumber(number);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (queries.length === 0) return;
    const headers = [
      'Query Number',
      'Customer Name',
      'Email',
      'Phone',
      'Category',
      'Subject',
      'Order Number',
      'Status',
      'Priority',
      'Created At',
      'Updated At',
    ];

    const rows = queries.map((q) => [
      `"${q.queryNumber}"`,
      `"${q.customerName.replace(/"/g, '""')}"`,
      `"${q.customerEmail}"`,
      `"${q.customerPhone || ''}"`,
      `"${q.category}"`,
      `"${q.subject.replace(/"/g, '""')}"`,
      `"${q.orderNumber || ''}"`,
      `"${q.status}"`,
      `"${q.priority}"`,
      `"${q.createdAt}"`,
      `"${q.updatedAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FAWNIC_Customer_Queries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Counter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Customer Queries & Messages</span>
            </h1>
            {stats.unread > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white animate-pulse">
                {stats.unread} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
            Real-time inquiries received from website Contact Us forms, order questions, and customer accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchQueries(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div
          onClick={() => {
            setFilterStatus('all');
            setShowArchived(false);
          }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'all' && !showArchived
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-transparent shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-stone-300 hover:border-stone-400'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Total Active</div>
          <div className="text-xl font-bold font-serif mt-1">{stats.total}</div>
        </div>

        <div
          onClick={() => {
            setFilterStatus('new');
            setShowArchived(false);
          }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'new' && !showArchived
              ? 'bg-blue-600 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-blue-600 dark:text-blue-400 hover:border-blue-400'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">New Inquiries</div>
          <div className="text-xl font-bold font-serif mt-1">{stats.new}</div>
        </div>

        <div
          onClick={() => {
            setFilterStatus('in_progress');
            setShowArchived(false);
          }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'in_progress' && !showArchived
              ? 'bg-amber-600 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 hover:border-amber-400'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">In Progress</div>
          <div className="text-xl font-bold font-serif mt-1">{stats.inProgress}</div>
        </div>

        <div
          onClick={() => {
            setFilterStatus('waiting_customer');
            setShowArchived(false);
          }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'waiting_customer' && !showArchived
              ? 'bg-purple-600 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-purple-600 dark:text-purple-400 hover:border-purple-400'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Waiting Cust.</div>
          <div className="text-xl font-bold font-serif mt-1">{stats.waitingCustomer}</div>
        </div>

        <div
          onClick={() => {
            setFilterStatus('replied');
            setShowArchived(false);
          }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'replied' && !showArchived
              ? 'bg-emerald-600 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Replied</div>
          <div className="text-xl font-bold font-serif mt-1">{stats.replied}</div>
        </div>

        <div
          onClick={() => {
            setFilterStatus('resolved');
            setShowArchived(false);
          }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'resolved' && !showArchived
              ? 'bg-teal-600 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:border-stone-400'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Resolved</div>
          <div className="text-xl font-bold font-serif mt-1">{stats.resolved}</div>
        </div>

        <div
          onClick={() => {
            setFilterStatus('closed');
            setShowArchived(false);
          }}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'closed' && !showArchived
              ? 'bg-zinc-700 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 hover:border-stone-400'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Closed</div>
          <div className="text-xl font-bold font-serif mt-1">{stats.closed}</div>
        </div>

        <div
          onClick={() => setShowArchived(!showArchived)}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            showArchived
              ? 'bg-amber-600 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 hover:border-stone-400'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Archived</div>
          <div className="text-xl font-bold font-serif mt-1">{stats.archived}</div>
        </div>
      </div>

      {/* 3. Search & Comprehensive Filter Controls */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Query ID, Name, Email, Phone, Order #..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">New Inquiry</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting on Customer</option>
              <option value="replied">Replied</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full p-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-semibold text-[11px] uppercase tracking-wider">
              Timeframe:
            </span>
            {(['all', 'today', 'yesterday', '7days', '30days'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFilterDateRange(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterDateRange === r
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {r === 'all'
                  ? 'All Time'
                  : r === 'today'
                  ? 'Today'
                  : r === 'yesterday'
                  ? 'Yesterday'
                  : r === '7days'
                  ? 'Past 7 Days'
                  : 'Past 30 Days'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded text-amber-600 focus:ring-0"
              />
              <span>Show Archived Queries</span>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Queries Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600" />
            Loading customer inquiries...
          </div>
        ) : queries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
              No queries match current criteria
            </p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {search || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your search terms or clearing status filters.'
                : 'All incoming customer messages and Contact Us submissions will appear here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-zinc-800/60 text-[11px] font-serif font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 border-b border-stone-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Query ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Subject & Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                {queries.map((q) => {
                  const statusInfo = STATUS_CONFIG[q.status] || STATUS_CONFIG.new;
                  const priorityInfo = PRIORITY_CONFIG[q.priority] || PRIORITY_CONFIG.normal;
                  const isUnread = !q.isReadByAdmin;

                  return (
                    <tr
                      key={q.id}
                      onClick={() => handleOpenDetail(q.id)}
                      className={`hover:bg-stone-50/80 dark:hover:bg-zinc-800/50 transition cursor-pointer ${
                        isUnread ? 'bg-amber-500/5 dark:bg-amber-500/5 font-semibold' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                              title="Unread Query"
                            />
                          )}
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {q.queryNumber}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyQueryNumber(q.queryNumber, e)}
                            className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded transition text-stone-400 hover:text-stone-600"
                            title="Copy Query Number"
                          >
                            {copiedNumber === q.queryNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 dark:text-stone-100">
                              {q.customerName}
                            </span>
                            {q.customerId ? (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                                Registered
                              </span>
                            ) : (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-stone-100 dark:bg-zinc-800 text-stone-500 font-bold">
                                Guest
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500">{q.customerEmail}</div>
                          {q.customerPhone && (
                            <div className="text-[11px] text-stone-400 font-mono">
                              {q.customerPhone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Subject & Category */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-stone-900 dark:text-stone-100 truncate">
                            {q.subject}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-400">
                            <span className="bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-stone-600 dark:text-stone-300">
                              {q.category}
                            </span>
                            {q.orderNumber && (
                              <span className="font-mono text-amber-600">
                                #{q.orderNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={q.status}
                          onChange={(e) => handleUpdateStatus(q.id, e.target.value as QueryStatus)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <option value="new">New Inquiry</option>
                          <option value="in_progress">In Progress</option>
                          <option value="waiting_customer">Waiting on Customer</option>
                          <option value="replied">Replied</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={q.priority}
                          onChange={(e) => handleUpdatePriority(q.id, e.target.value as QueryPriority)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${priorityInfo.badge}`}
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-500">
                        <div>
                          {new Date(q.createdAt).toLocaleDateString('en-PK', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {new Date(q.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(q.id)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-600 dark:text-stone-300 transition cursor-pointer"
                            title="Open Query Thread"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleToggleRead(q.id, q.isReadByAdmin, e)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                            title={q.isReadByAdmin ? 'Mark as Unread' : 'Mark as Read'}
                          >
                            <CheckCircle2 className={`w-4 h-4 ${q.isReadByAdmin ? 'text-stone-300' : 'text-amber-600'}`} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleToggleArchive(q.id, q.isArchived, e)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                            title={q.isArchived ? 'Unarchive' : 'Archive'}
                          >
                            <Archive className={`w-4 h-4 ${q.isArchived ? 'text-amber-600' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(q.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Query"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. QUERY DETAIL DRAWER / MODAL */}
      {selectedQueryId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col justify-between border-l border-stone-200 dark:border-zinc-800 animate-slideLeft overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-stone-50/50 dark:bg-zinc-950/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {selectedQueryData?.query?.queryNumber || 'Loading...'}
                  </span>
                  {selectedQueryData?.query && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        STATUS_CONFIG[selectedQueryData.query.status]?.bg || ''
                      } ${STATUS_CONFIG[selectedQueryData.query.status]?.text || ''} ${
                        STATUS_CONFIG[selectedQueryData.query.status]?.border || ''
                      }`}
                    >
                      {STATUS_CONFIG[selectedQueryData.query.status]?.label || selectedQueryData.query.status}
                    </span>
                  )}
                  {selectedQueryData?.query?.isArchived && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600">
                      Archived
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                  {selectedQueryData?.query?.subject}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {selectedQueryData?.query && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(selectedQueryData.query.id, selectedQueryData.query.isArchived)}
                      className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-500 transition cursor-pointer"
                      title={selectedQueryData.query.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(selectedQueryData.query.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-500 hover:text-rose-600 transition cursor-pointer"
                      title="Delete Query"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {detailLoading || !selectedQueryData ? (
                <div className="p-12 text-center text-xs text-stone-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600" />
                  Loading query details...
                </div>
              ) : (
                <>
                  {/* Status & Priority Controls */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-stone-50 dark:bg-zinc-800/60 rounded-2xl border border-stone-200 dark:border-zinc-800 text-xs">
                    <div>
                      <label className="font-bold text-stone-500 block mb-1">Status</label>
                      <select
                        value={selectedQueryData.query.status}
                        onChange={(e) => handleUpdateStatus(selectedQueryData.query.id, e.target.value as QueryStatus)}
                        className="w-full p-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl font-bold text-stone-900 dark:text-stone-100"
                      >
                        <option value="new">New Inquiry</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_customer">Waiting on Customer</option>
                        <option value="replied">Replied</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-stone-500 block mb-1">Priority</label>
                      <select
                        value={selectedQueryData.query.priority}
                        onChange={(e) => handleUpdatePriority(selectedQueryData.query.id, e.target.value as QueryPriority)}
                        className="w-full p-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl font-semibold text-stone-900 dark:text-stone-100"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="font-bold text-stone-500 block mb-1">Category</label>
                      <div className="p-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl text-stone-700 dark:text-stone-300 font-semibold truncate">
                        {selectedQueryData.query.category}
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Customer Overview
                      </h4>
                      {selectedQueryData.customerInfo && onOpenCustomerProfile && (
                        <button
                          type="button"
                          onClick={() => {
                            handleCloseDetail();
                            onOpenCustomerProfile(selectedQueryData.customerInfo.id);
                          }}
                          className="text-xs font-semibold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open CRM Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="text-stone-400 text-[11px]">Full Name</div>
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {selectedQueryData.query.customerName}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-stone-400 text-[11px]">Email</div>
                        <div className="text-stone-700 dark:text-stone-300">
                          {selectedQueryData.query.customerEmail}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-stone-400 text-[11px]">Phone</div>
                        <div className="font-mono text-stone-700 dark:text-stone-300">
                          {selectedQueryData.query.customerPhone || 'Not provided'}
                        </div>
                      </div>

                      {selectedQueryData.query.orderNumber && (
                        <div className="space-y-1">
                          <div className="text-stone-400 text-[11px]">Related Order</div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-600">
                              {selectedQueryData.query.orderNumber}
                            </span>
                            {onOpenOrder && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleCloseDetail();
                                  onOpenOrder(selectedQueryData.query.orderNumber!);
                                }}
                                className="text-[11px] font-semibold text-stone-500 hover:text-amber-600 underline cursor-pointer"
                              >
                                View Order
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Customer Account Metrics */}
                    {selectedQueryData.customerInfo && (
                      <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-stone-50 dark:bg-zinc-800/50 rounded-xl">
                          <div className="text-[10px] text-stone-400">Total Orders</div>
                          <div className="font-bold text-stone-900 dark:text-stone-100">
                            {selectedQueryData.customerInfo.ordersCount}
                          </div>
                        </div>
                        <div className="p-2 bg-stone-50 dark:bg-zinc-800/50 rounded-xl">
                          <div className="text-[10px] text-stone-400">Lifetime Spend</div>
                          <div className="font-bold text-emerald-600">
                            Rs. {selectedQueryData.customerInfo.totalSpent?.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-2 bg-stone-50 dark:bg-zinc-800/50 rounded-xl">
                          <div className="text-[10px] text-stone-400">Account Type</div>
                          <div className="font-bold text-amber-600">Registered</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conversation History */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Conversation Thread ({selectedQueryData.query.messages?.length || 0} messages)
                    </h4>

                    <div className="space-y-3">
                      {selectedQueryData.query.messages?.map((msg) => {
                        const isStaff = msg.senderRole === 'admin' || msg.senderRole === 'staff';
                        return (
                          <div
                            key={msg.id}
                            className={`p-4 rounded-2xl text-xs space-y-2 border ${
                              isStaff
                                ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 text-stone-900 dark:text-stone-100'
                                : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-stone-100'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 font-bold">
                                {isStaff ? (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                    <span className="text-amber-700 dark:text-amber-400">
                                      {msg.senderName} (FAWNIC Atelier)
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <User className="w-3.5 h-3.5 text-stone-500" />
                                    <span>{msg.senderName} (Customer)</span>
                                  </>
                                )}
                              </div>

                              <span className="font-mono text-stone-400">
                                {new Date(msg.createdAt).toLocaleString([], {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </div>

                            <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Quick Response Templates */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Quick Response Templates:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {CANNED_RESPONSES.map((tmpl) => (
                        <button
                          key={tmpl.title}
                          type="button"
                          onClick={() => setReplyText(tmpl.text)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 hover:bg-amber-500/15 hover:text-amber-600 text-stone-600 dark:text-stone-300 text-[11px] font-semibold transition cursor-pointer"
                        >
                          {tmpl.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                      Send Reply to Customer
                    </label>
                    <textarea
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Draft official response to the customer. This message will be sent and visible in their customer portal in real-time..."
                      className="w-full p-3 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:border-amber-600 text-stone-900 dark:text-stone-100"
                      required
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-stone-400">
                        Status will transition to <strong className="text-emerald-600">Replied</strong>
                      </span>
                      <button
                        type="submit"
                        disabled={replying || !replyText.trim()}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{replying ? 'Sending Reply...' : 'Send Atelier Reply'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Internal Staff Notes */}
                  <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-bold text-xs">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>Private Internal Staff Notes</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        (Never visible to customers)
                      </span>
                    </div>

                    <form onSubmit={handleAddInternalNote} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={internalNoteText}
                          onChange={(e) => setInternalNoteText(e.target.value)}
                          placeholder="Add private note for staff / team..."
                          className="w-full p-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                        />
                        <button
                          type="submit"
                          disabled={addingNote || !internalNoteText.trim()}
                          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 text-xs font-bold rounded-xl shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          Add Note
                        </button>
                      </div>
                    </form>

                    {selectedQueryData.query.internalNotes && selectedQueryData.query.internalNotes.length > 0 ? (
                      <div className="space-y-2">
                        {selectedQueryData.query.internalNotes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 bg-stone-100 dark:bg-zinc-800/80 rounded-xl text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[10px] text-stone-400">
                              <span className="font-bold text-stone-700 dark:text-stone-300">
                                {note.adminName}
                              </span>
                              <span>
                                {new Date(note.createdAt).toLocaleString([], {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </div>
                            <p className="text-stone-800 dark:text-stone-200">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic">No internal notes added yet.</p>
                    )}
                  </div>

                  {/* Audit Timeline */}
                  {selectedQueryData.query.auditTimeline && (
                    <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Activity Timeline
                      </h4>
                      <div className="space-y-2 border-l-2 border-stone-200 dark:border-zinc-700 ml-2 pl-3 text-xs">
                        {selectedQueryData.query.auditTimeline.map((item) => (
                          <div key={item.id} className="space-y-0.5">
                            <div className="font-semibold text-stone-800 dark:text-stone-200">
                              {item.action}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              {item.actorName} •{' '}
                              {new Date(item.timestamp).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Delete Customer Query?
              </h3>
              <p className="text-xs text-stone-500">
                Are you sure you want to remove this query? This action will remove it from active lists while preserving audit logs.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteQuery(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
