import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import type { QueryCategory } from '../types.js';

interface ContactPageProps {
  onNavigate?: (route: string, param?: any) => void;
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

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<QueryCategory>('General Question');
  const [orderNumber, setOrderNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState<{ queryNumber: string; queryId: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Pre-fill phone and name if user exists
  useEffect(() => {
    if (user) {
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      if (!guestName.trim() || !guestEmail.trim()) {
        setErrorMessage('Please enter your full name and a valid email address.');
        return;
      }
    }

    if (!message.trim()) {
      setErrorMessage('Please enter your message.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        name: user ? user.name : guestName.trim(),
        email: user ? user.email : guestEmail.trim().toLowerCase(),
        phone: phone ? phone.trim() : undefined,
        category,
        orderNumber: orderNumber ? orderNumber.trim() : undefined,
        subject: subject ? subject.trim() : undefined,
        message: message.trim(),
      };

      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmittedQuery({
          queryNumber: data.queryNumber || 'FW-QRY-0001',
          queryId: data.queryId || '',
        });
        setMessage('');
        setSubject('');
        setOrderNumber('');
      } else {
        setErrorMessage(data.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch {
      setErrorMessage('Network error. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const copyQueryId = () => {
    if (submittedQuery?.queryNumber) {
      navigator.clipboard?.writeText(submittedQuery.queryNumber);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleResetForm = () => {
    setSubmittedQuery(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden text-center space-y-4">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-800/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Atelier Concierge & Customer Care
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 leading-tight">
              Connect with the FAWNIC Atelier
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-lg mx-auto">
              Have a question regarding custom leather embossing, nationwide courier transit, 7-day returns, or corporate orders? We are here to assist.
            </p>
          </div>
        </div>

        {/* 3 Main Quick Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
              Phone & WhatsApp Concierge
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Direct assistance for order tracking and urgent changes.
            </p>
            <div className="space-y-1 pt-1 font-mono text-xs">
              <p className="font-bold text-stone-800 dark:text-stone-200">03711661611</p>
              <a
                href="https://wa.me/923711661611"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px] font-sans font-semibold"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
              Email Dispatch & Queries
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Inquiries, warranty support, and corporate gifting requests.
            </p>
            <div className="space-y-1 pt-1 font-mono text-xs">
              <p className="text-stone-800 dark:text-stone-200">fawnic01@gmail.com</p>
              <p className="text-stone-500 text-[11px]">Replies within 2 to 4 hours</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
              Atelier Support Hours
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Our workshop and customer dispatch schedule.
            </p>
            <div className="space-y-1 pt-1 text-xs">
              <p className="font-semibold text-stone-800 dark:text-stone-200">
                Monday – Saturday: 10:00 AM – 8:00 PM PKT
              </p>
              <p className="text-stone-500 text-[11px]">Sunday: Workshop closed for hide curing</p>
            </div>
          </div>
        </div>

        {/* Main Grid: Form + Atelier Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Workshop Location & FAQ Shortcut */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                    Atelier Location
                  </h3>
                  <span className="text-[11px] text-stone-500 font-mono">DHA Phase 5, Lahore, Pakistan</span>
                </div>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                FAWNIC Bespoke Leather Atelier
                <br />
                DHA Phase 5, Lahore, Punjab, Pakistan
              </p>

              <div className="aspect-16/9 rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-800 relative border border-stone-200 dark:border-stone-700">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80"
                  alt="Lahore Atelier Map Pin"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-stone-950/40 flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full bg-stone-900/90 text-stone-100 text-[10px] font-bold font-mono border border-stone-700">
                    Lahore Headquarters
                  </span>
                </div>
              </div>
            </div>

            {/* FAQ Shortcut Card */}
            <div className="p-6 rounded-3xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                <HelpCircle className="w-4 h-4" />
                <span>Looking for Instant Answers?</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Check our Help Center for immediate answers on Cash on Delivery, 7-day returns, delivery times, and leather care.
              </p>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('help')}
                  className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer pt-1"
                >
                  <span>Visit Help Center & FAQ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-2">
            <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
              
              {submittedQuery ? (
                <div className="py-10 text-center space-y-6 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                      Inquiry Received by the Atelier
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Thank you for reaching out. Our support team has logged your query and will reply via email or phone promptly.
                    </p>
                  </div>

                  {/* Reference ID Card */}
                  <div className="inline-flex flex-col items-center bg-stone-50 dark:bg-stone-800/80 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs">
                    <span className="text-[11px] uppercase tracking-wider font-mono text-stone-500 font-semibold mb-1">
                      Your Reference Query Number
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                        {submittedQuery.queryNumber}
                      </span>
                      <button
                        type="button"
                        onClick={copyQueryId}
                        className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 transition cursor-pointer"
                        title="Copy Query ID"
                      >
                        {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap justify-center items-center gap-3 text-xs">
                    {user && onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('profile', { tab: 'queries' })}
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Track in My Queries</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-6 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold rounded-xl transition cursor-pointer"
                    >
                      Submit Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                        Send an Inquiry to the Concierge
                      </h3>
                      <p className="text-xs text-stone-500">
                        We respond to all customer communications within 2 to 4 business hours.
                      </p>
                    </div>
                    {user && (
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 self-start sm:self-center">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{user.name}</span>
                      </span>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="p-4 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                      {errorMessage}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                    {/* Name and Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={user ? user.name : guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          disabled={!!user}
                          placeholder="e.g. Tariq Malik"
                          className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-amber-500 disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={user ? user.email : guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          disabled={!!user}
                          placeholder="e.g. tariq@gmail.com"
                          className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-amber-500 disabled:opacity-75 disabled:cursor-not-allowed font-mono"
                        />
                      </div>
                    </div>

                    {/* Phone and Order Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          Mobile / WhatsApp Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 0300 1234567"
                          className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          Related Order Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={orderNumber}
                          onChange={(e) => setOrderNumber(e.target.value)}
                          placeholder="e.g. FW-10023"
                          className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Category and Subject */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          Inquiry Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as QueryCategory)}
                          className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          Subject (Optional)
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. Delivery query for Karachi order"
                          className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Message Area */}
                    <div>
                      <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                        Your Message *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe how the atelier can assist you..."
                        className="w-full p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <p className="text-[11px] text-stone-400">
                        Your data is handled securely under our Privacy Policy.
                      </p>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2"
                      >
                        {loading ? (
                          <span>Sending to Atelier...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Message</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
