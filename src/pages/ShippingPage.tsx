import React from 'react';
import {
  Truck,
  Clock,
  ShieldCheck,
  Package,
  CheckCircle2,
  MapPin,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Phone,
} from 'lucide-react';

interface ShippingPageProps {
  onNavigate: (route: string, param?: any) => void;
}

export const ShippingPage: React.FC<ShippingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-800/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              Nationwide Logistics & Delivery
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 leading-tight">
              Fast, Reliable & Insured Shipping Across Pakistan
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-lg mx-auto">
              Every handcrafted piece is packed in our signature rigid magnetic atelier box with tamper-evident security tape, dispatched through Pakistan’s top logistics carriers.
            </p>
          </div>
        </div>

        {/* Delivery Timeline Visualizer */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-8 sm:p-10 shadow-xs space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              The Journey of Your Leather Piece
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Delivery Timeline Workflow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Order Placed
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Instant confirmation email and SMS with your unique order tracking number (e.g. FW-10023).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Verification & Packing
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                12-point quality check, conditioning balm application, and enclosed in magnetic luxury box within 12–24 hours.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Atelier Dispatch
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Handed to TCS, Leopards, or Trax. Tracking code activated with live transit updates.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Doorstep Delivery
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Courteous doorstep handover with Cash on Delivery (COD) payment or pre-paid release.
              </p>
            </div>
          </div>
        </div>

        {/* Regional Delivery Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                  Karachi (Same City)
                </h3>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  12 to 24 Hours
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Same-day or next-morning courier delivery from our Karachi atelier. Express dispatch riders service all residential and commercial zones.
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                  Major Metros
                </h3>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  24 to 48 Hours
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Air-courier priority shipping to Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, and Peshawar via TCS and Leopards.
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                  Rest of Pakistan
                </h3>
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  2 to 3 Business Days
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Complete nationwide coverage spanning all districts, tehsils, and regional hubs in Punjab, Sindh, KPK, Balochistan, and AJK.
            </p>
          </div>
        </div>

        {/* Shipping Rates & Courier Partners */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-8 sm:p-10 shadow-xs space-y-6">
          <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
            Shipping Charges & Logistics Partners
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 font-mono">
                  Orders Rs. 5,000 & Above
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                  FREE SHIPPING
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Enjoy complimentary express delivery on any order totaling Rs. 5,000 or higher. No coupon code required; applied automatically at checkout. Plus, get 7% cashback on online payments of Rs. 5,000 or more (credited within 24 hours).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 font-mono">
                  Orders Below Rs. 5,000
                </span>
                <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100">
                  Standard Delivery: Rs. 250
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                A flat standard courier fee of Rs. 250 covers nationwide air shipping, insurance, and door-to-door delivery.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              Trusted Logistics Partners:
            </span>
            <div className="flex items-center gap-6 font-mono font-bold text-stone-800 dark:text-stone-200">
              <span>TCS EXPRESS</span>
              <span>•</span>
              <span>LEOPARDS COURIER</span>
              <span>•</span>
              <span>TRAX LOGISTICS</span>
            </div>
          </div>
        </div>

        {/* CTA Track Order */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white rounded-3xl p-8 sm:p-10 border border-stone-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-lg font-serif font-bold text-stone-100">
              Ready to Track Your Delivery?
            </h3>
            <p className="text-xs text-stone-400 max-w-md leading-relaxed">
              Enter your Order Number (e.g. FW-10023) to view live location updates and rider contact details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('track')}
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Order Now</span>
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact Concierge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
