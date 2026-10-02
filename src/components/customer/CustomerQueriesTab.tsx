import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  Search,
  ExternalLink,
  User,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Tag,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { notificationSocket } from '../../services/notificationSocket.js';
import type { CustomerQuery, QueryStatus } from '../../types.js';

interface CustomerQueriesTabProps {
  initialQueryId?: string;
  onNavigate: (route: string, param?: any) => void;
}

const STATUS_CONFIG: Record<
  QueryStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  new: {
    label: 'Under Review',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  waiting_customer: {
    label: 'Action Required',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  replied: {
    label: 'Atelier Replied',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 dark:border-zinc-700',
  },
  closed: {
    label: 'Closed',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-500 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-700',
  },
};

export const CustomerQueriesTab: React.FC<CustomerQueriesTabProps> = ({ initialQueryId, onNavigate }) => {
  const { token, user } = useAuth();
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(initialQueryId || null);

  useEffect(() => {
    if (initialQueryId) {
      setSelectedQueryId(initialQueryId);
    }
  }, [initialQueryId]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchQueries = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch('/api/customer/queries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQueries(data || []);
      }
    } catch (err) {
      console.error('Failed to load customer queries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [token]);

  // Real-time WebSocket subscriber
  useEffect(() => {
    const unsubscribe = notificationSocket.subscribe((event) => {
      if (event.type && event.type.startsWith('query:')) {
        // Query updated/replied/created in real time
        fetchQueries(true);
      }
    });
    return unsubscribe;
  }, [token]);

  const selectedQuery = queries.find((q) => q.id === selectedQueryId);

  // Sync and mark query as read when customer opens the thread
  useEffect(() => {
    if (selectedQueryId && token) {
      fetch(`/api/customer/queries/${selectedQueryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((updatedQuery) => {
          if (updatedQuery) {
            setQueries((prev) =>
              prev.map((q) =>
                q.id === selectedQueryId ? { ...q, ...updatedQuery, isReadByCustomer: true } : q
              )
            );
          }
        })
        .catch(() => {});
    }
  }, [selectedQueryId, token]);

  useEffect(() => {
    if (selectedQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedQuery?.messages?.length]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedQueryId || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/customer/queries/${selectedQueryId}/reply`, {
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
        // Update local state immediately
        setQueries((prev) =>
          prev.map((q) => (q.id === selectedQueryId ? { ...q, ...data.query } : q))
        );
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const filteredQueries = queries.filter((q) => {
    if (filterStatus !== 'all' && q.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      return (
        q.queryNumber.toLowerCase().includes(term) ||
        q.subject.toLowerCase().includes(term) ||
        q.category.toLowerCase().includes(term) ||
        (q.orderNumber && q.orderNumber.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Customer Support & Inquiries</span>
          </h2>
          <p className="text-xs text-zinc-500">
            Track your open questions, atelier responses, and ongoing conversations in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchQueries(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <span>New Inquiry</span>
          </button>
        </div>
      </div>

      {/* DETAIL VIEW */}
      {selectedQuery ? (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setSelectedQueryId(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Inquiries</span>
          </button>

          {/* Ticket Header Card */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                    {selectedQuery.queryNumber}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      STATUS_CONFIG[selectedQuery.status]?.bg || 'bg-zinc-100'
                    } ${STATUS_CONFIG[selectedQuery.status]?.text || 'text-zinc-600'} ${
                      STATUS_CONFIG[selectedQuery.status]?.border || 'border-zinc-200'
                    }`}
                  >
                    {STATUS_CONFIG[selectedQuery.status]?.label || selectedQuery.status}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(selectedQuery.createdAt).toLocaleDateString('en-PK', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 pt-1">
                  {selectedQuery.subject}
                </h3>
              </div>

              {selectedQuery.orderNumber && (
                <div className="flex items-center gap-2 text-xs bg-stone-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700">
                  <Hash className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-500">Related Order:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedQuery.orderNumber}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                Category: <strong className="text-zinc-700 dark:text-zinc-300 ml-1">{selectedQuery.category}</strong>
              </span>
              <span>•</span>
              <span>Last updated: {new Date(selectedQuery.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Conversation History
            </h4>

            <div className="space-y-4">
              {selectedQuery.messages && selectedQuery.messages.length > 0 ? (
                selectedQuery.messages.map((msg) => {
                  const isStaff = msg.senderRole === 'admin' || msg.senderRole === 'staff';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-2xl ${isStaff ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isStaff
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                            : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
                        }`}
                      >
                        {isStaff ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div
                        className={`p-4 rounded-2xl text-xs space-y-1.5 shadow-2xs ${
                          isStaff
                            ? 'bg-stone-50 dark:bg-zinc-800/90 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                            : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[11px] opacity-80">
                          <span className="font-bold">
                            {isStaff ? 'FAWNIC Atelier Concierge' : 'You'}
                          </span>
                          <span className="font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No messages recorded in this query.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Box */}
            {selectedQuery.status !== 'closed' ? (
              <form onSubmit={handleSendReply} className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Send a follow-up reply
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message or response to our atelier team..."
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl text-center text-xs text-zinc-500">
                This inquiry is closed. If you have another question, please submit a new inquiry.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-6">
          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Query ID (FW-QRY-...), subject, or order #..."
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="replied">Atelier Replied</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              Loading your inquiries...
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="p-12 text-center space-y-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                  No Inquiries Found
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {searchQuery || filterStatus !== 'all'
                    ? 'No support inquiries match your search filters.'
                    : 'You haven’t submitted any questions or inquiries yet. Reach out to our team whenever you need assistance!'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Contact FAWNIC Atelier</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQueries.map((item) => {
                const statusStyle = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
                const hasUnreadReply = item.status === 'replied' && !item.isReadByCustomer;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedQueryId(item.id)}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer shadow-xs group"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.queryNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {statusStyle.label}
                        </span>
                        {hasUnreadReply && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                            New Reply!
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400">
                          {new Date(item.createdAt).toLocaleDateString('en-PK', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {item.subject}
                      </h4>

                      <p className="text-xs text-zinc-500 line-clamp-1">
                        {item.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                        <span>Category: {item.category}</span>
                        {item.orderNumber && (
                          <span>Order: #{item.orderNumber}</span>
                        )}
                        <span>{item.messages?.length || 1} messages</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition">
                        View Thread
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
