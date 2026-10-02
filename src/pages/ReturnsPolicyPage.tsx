import React from 'react';
import {
  RotateCcw,
  ShieldCheck,
  Package,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Truck,
  ArrowRight,
  Sparkles,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';

interface ReturnsPolicyPageProps {
  onNavigate: (route: string, param?: any) => void;
}

export const ReturnsPolicyPage: React.FC<ReturnsPolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-800/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              100% Satisfaction Guarantee
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 leading-tight">
              7-Day Hassle-Free Returns & Exchanges
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-lg mx-auto">
              We stand behind our leather craftsmanship with complete confidence. If your piece does not exceed expectations, we make returns and exchanges straightforward and effortless.
            </p>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('profile', { tab: 'orders' })}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Initiate Return / Exchange</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Step-by-Step Return Flow */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-8 sm:p-10 shadow-xs space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Simple 4-Step Process
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              How to Return or Exchange
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Submit Request
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Go to your Dashboard &gt; Orders &gt; Click &ldquo;Request Return&rdquo;. Select refund or replacement item.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Doorstep Pickup
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                TCS or Leopards rider will collect the packed parcel from your address with a digital airway bill.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Inspection
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Upon arrival at our Lahore atelier, our team verifies condition within 24 hours.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Disbursement
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Your refund is credited to your Meezan / Pakistani Bank Account (IBFT) within 48 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Order Cancellation Policy (Strict & Clear) */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-8 sm:p-10 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Cancellation Window
              </span>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                Order Cancellation Policy
              </h3>
            </div>
          </div>
          <div className="space-y-3 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            <p>
              <strong>When can I cancel?</strong> You can cancel your order directly from your Customer Dashboard only while the order status is <strong>&quot;Pending&quot;</strong> (or within 2 hours of placement before our workshop begins leather allocation and packing).
            </p>
            <p>
              <strong>When can I NOT cancel?</strong> Once an order has moved to <strong>&quot;Processing&quot;</strong>, <strong>&quot;Packed&quot;</strong>, <strong>&quot;Dispatched&quot;</strong>, or has been handed over to our courier partners (TCS, Leopards Courier), the consignment <strong>CANNOT be cancelled in transit</strong> as tracking airway bills are generated and booked.
            </p>
            <p>
              If your order has already dispatched and you no longer wish to keep the article, you may receive the parcel and initiate an exchange or return under our 7-Day Doorstep Return Policy.
            </p>
          </div>
        </div>

        {/* Eligibility & Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                Return Eligibility Criteria
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Request must be submitted within 7 calendar days of delivery receipt.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Leather piece must be completely unused, unscratched, and unconditioned.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Must include original luxury packaging, warranty card, and protective cotton dust bag.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Valid order number (e.g. FW-10023) or receipt must be provided.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                Non-Returnable Items & Exceptions
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>Custom monogrammed or bespoke heat-embossed items cannot be returned.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>Products showing visible wear, card stretch, perfume scent, or water spots.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>Clearance or final archive sales explicitly marked non-refundable.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Damaged or Defective Items */}
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-200 dark:border-amber-900/40 p-8 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3 className="text-base font-bold font-serif text-amber-950 dark:text-amber-200">
              Damaged, Defective or Incorrect Items (100% Free Replacement)
            </h3>
          </div>
          <p className="text-xs text-amber-900 dark:text-amber-300/90 leading-relaxed">
            In the rare event that your package arrives damaged during courier transit, or if you received an incorrect item, FAWNIC covers all reverse and redelivery logistics costs. Notify us within 48 hours with a photograph via WhatsApp or email, and we will rush a replacement parcel immediately.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white rounded-3xl p-8 sm:p-10 border border-stone-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-lg font-serif font-bold text-stone-100">
              Need Help with a Return?
            </h3>
            <p className="text-xs text-stone-400 max-w-md leading-relaxed">
              Our concierge team is available to coordinate pickup schedules and answer any questions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('profile', { tab: 'orders' })}
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Go to My Orders</span>
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Atelier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
