import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  HelpCircle,
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  ShieldCheck,
  User,
  Heart,
  Tag,
  MessageSquare,
  Sparkles,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react';

interface HelpCenterPageProps {
  onNavigate: (route: string, param?: any) => void;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  // Orders
  {
    id: 'ord-1',
    category: 'Orders',
    question: 'How do I place an order on FAWNIC?',
    answer:
      'Browse our curated collection of wallets, belts, and accessories. Select your desired color or variant, click "Add to Bag", and proceed to Checkout. You can complete your order quickly as a guest or create an account to track deliveries, save addresses, and earn member perks.',
  },
  {
    id: 'ord-2',
    category: 'Orders',
    question: 'Can I modify or cancel my order after placing it?',
    answer:
      'Yes, you can cancel an order directly from your Customer Dashboard while it is in "Pending" or "Processing" status. Once the parcel is dispatched with our courier partner, it cannot be canceled mid-transit, but you can initiate a return upon receipt.',
  },
  {
    id: 'ord-3',
    category: 'Orders',
    question: 'How do I track my order status?',
    answer:
      'Go to the "Track Order" link in our header or visit your Customer Dashboard > My Orders. Enter your Order Number (e.g. FW-10023) or courier tracking ID to see live step-by-step dispatch updates.',
  },

  // Payments
  {
    id: 'pay-1',
    category: 'Payments',
    question: 'What payment methods are supported across Pakistan?',
    answer:
      'We accept Cash on Delivery (COD) nationwide so you can pay physical cash upon arrival. We also support Direct Bank Transfer / 1Link IBFT into our Meezan Bank corporate account, and secure card payments via PayFast/Debit cards.',
  },
  {
    id: 'pay-2',
    category: 'Payments',
    question: 'Is Cash on Delivery (COD) safe?',
    answer:
      'Completely safe. You pay the exact rupee amount indicated on the physical parcel invoice directly to the certified courier rider (TCS, Leopards, or Trax). There are no hidden fees.',
  },
  {
    id: 'pay-3',
    category: 'Payments',
    question: 'How do I confirm payment for Direct Bank Transfer (IBFT)?',
    answer:
      'When you select Direct Bank Transfer at checkout, our Meezan Bank account title and IBAN are displayed. Once transferred, reply to your order confirmation email or WhatsApp our concierge with your screenshot or transaction ID for instant verification.',
  },

  // Shipping
  {
    id: 'shp-1',
    category: 'Shipping',
    question: 'What are the delivery charges?',
    answer:
      'All orders totaling Rs. 5,000 or higher receive FREE express nationwide shipping. For orders below Rs. 5,000, standard delivery is Rs. 250. Plus, online payments of Rs. 5,000 or more receive 7% cashback credited within 24 hours.',
  },
  {
    id: 'shp-2',
    category: 'Shipping',
    question: 'How long does delivery take?',
    answer:
      'Karachi orders are typically delivered within 12 to 24 hours. Deliveries to Lahore, Islamabad, and Rawalpindi take 24 to 48 hours. Other cities and districts across Pakistan arrive within 2 to 3 business days.',
  },
  {
    id: 'shp-3',
    category: 'Shipping',
    question: 'Which courier services do you use?',
    answer:
      'We partner with Pakistan’s premier logistics carriers: TCS Express, Leopards Courier, and Trax Logistics. Every parcel is packed in our signature rigid magnetic box with tamper-evident security tape.',
  },

  // Returns & Refunds
  {
    id: 'ret-1',
    category: 'Returns & Refunds',
    question: 'What is FAWNIC’s 7-Day Return & Exchange policy?',
    answer:
      'We offer a 100% satisfaction guarantee. If you are not completely delighted with your purchase, you may request a return or exchange within 7 days of receiving your parcel. Items must be unused, in original condition with all packaging and dust bags intact.',
  },
  {
    id: 'ret-2',
    category: 'Returns & Refunds',
    question: 'How do I submit a return request?',
    answer:
      'Sign in to your Customer Dashboard, navigate to "Orders", find your delivered order, and click "Request Return". Select your return reason and choose between a full refund or product exchange. Our concierge will coordinate doorstep reverse pickup.',
  },
  {
    id: 'ret-3',
    category: 'Returns & Refunds',
    question: 'How quickly are refunds processed?',
    answer:
      'Once the returned parcel arrives at our Karachi atelier and passes quality inspection (usually within 24 hours), your refund is transferred via IBFT, JazzCash, or EasyPaisa within 48 hours.',
  },

  // Products & Materials
  {
    id: 'prd-1',
    category: 'Products & Materials',
    question: 'Is FAWNIC leather genuine and authentic?',
    answer:
      'Yes, 100%. We use exclusively top-tier full-grain cowhides and vegetable-tanned steerhides. We never use bonded leather, PU, PVC, or reconstituted leather scraps. Every product is backed by our 1-Year craftsmanship guarantee against structural defects.',
  },
  {
    id: 'prd-2',
    category: 'Products & Materials',
    question: 'How do I care for my full-grain leather wallet or belt?',
    answer:
      'Keep leather away from direct water immersion and extreme heat. Wipe gently with a soft cotton cloth. Applying a light, neutral beeswax or leather balm every 4 to 6 months maintains moisture and enhances the natural pull-up patina.',
  },

  // Account & Wishlist
  {
    id: 'acc-1',
    category: 'Account & Security',
    question: 'Do I need an account to place an order?',
    answer:
      'No, guest checkout is fully supported. However, creating a free FAWNIC account allows you to save delivery addresses, view order histories, download PDF invoices, maintain a wishlist, and track customer support queries.',
  },
  {
    id: 'acc-2',
    category: 'Account & Security',
    question: 'How do I update my profile photo or account details?',
    answer:
      'Navigate to your Customer Dashboard. Click the camera icon over your avatar or go to "Account Settings". You can upload a new photo, change your phone number, or update your password anytime with immediate synchronization across the entire platform.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Topics', icon: HelpCircle },
  { id: 'Orders', label: 'Orders', icon: Package },
  { id: 'Payments', label: 'Payments', icon: CreditCard },
  { id: 'Shipping', label: 'Shipping', icon: Truck },
  { id: 'Returns & Refunds', label: 'Returns & Refunds', icon: RotateCcw },
  { id: 'Products & Materials', label: 'Products & Materials', icon: ShieldCheck },
  { id: 'Account & Security', label: 'Account & Security', icon: User },
];

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openAccordionId, setOpenAccordionId] = useState<string | null>('ord-1');

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleAccordion = (id: string) => {
    setOpenAccordionId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-800/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Customer Concierge & Help Center
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 leading-tight">
              How Can the Atelier Assist You Today?
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-lg mx-auto">
              Find instant answers regarding nationwide deliveries, 7-day returns, Cash on Delivery, genuine leather care, and order tracking.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto pt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help topics, returns, payments, leather care..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-stone-800/90 border border-stone-700 text-stone-100 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-inner transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-stone-900 text-white dark:bg-amber-600 dark:text-white shadow-md'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
              Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? 'Answer' : 'Answers'}
            </h2>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                View all categories
              </button>
            )}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
              <HelpCircle className="w-10 h-10 text-stone-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                No matching topics found for &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Need specialized assistance? Our concierge team is ready to answer questions directly via WhatsApp or email.
              </p>
              <button
                onClick={() => onNavigate('contact')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Contact Atelier Concierge</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((item) => {
                const isOpen = openAccordionId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs hover:border-amber-500/40 transition-all overflow-hidden"
                  >
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                          {item.category}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                          {item.question}
                        </h3>
                      </div>
                      <div
                        className={`w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 bg-amber-100 dark:bg-amber-950/60 text-amber-600' : ''
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-800/60">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Need More Assistance Banner */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white rounded-3xl p-8 sm:p-10 border border-stone-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-lg font-serif font-bold text-stone-100">
              Still Have Unanswered Questions?
            </h3>
            <p className="text-xs text-stone-400 max-w-md leading-relaxed">
              Our Karachi atelier support team is available Monday through Saturday from 10:00 AM to 8:00 PM PKT to assist with bespoke orders, corporate gifting, or delivery tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('contact')}
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </button>
            <button
              onClick={() => onNavigate('track')}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Consignment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
