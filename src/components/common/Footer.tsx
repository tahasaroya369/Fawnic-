import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Banknote,
  Award,
  Lock,
} from 'lucide-react';
import { Logo } from './Logo.js';

interface FooterProps {
  onNavigate: (route: string, param?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      }).catch(() => {});
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800">
      {/* Value Proposition Bar */}
      <div className="border-b border-stone-800/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-serif">100% Full-Grain Leather</h4>
              <p className="text-xs text-stone-400 mt-0.5">Vegetable-tanned steerhide & Italian hides</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 text-amber-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-serif">Nationwide Express Delivery</h4>
              <p className="text-xs text-stone-400 mt-0.5">Free delivery over Rs. 5,000 via TCS & Leopards</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 text-amber-400 flex items-center justify-center shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-serif">Cash on Delivery (COD)</h4>
              <p className="text-xs text-stone-400 mt-0.5">Inspect parcel & pay cash at your doorstep</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-serif">7-Day Doorstep Returns</h4>
              <p className="text-xs text-stone-400 mt-0.5">Hassle-free exchange & 1-Year craftsmanship guarantee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: FAWNIC Brand */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-3">
              <Logo size="md" showText={true} />
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Handcrafting timeless leather goods and horology for the distinguished gentleman. Every piece is cut and assembled from premium full-grain hides.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-amber-500 font-semibold block">FAWNIC Atelier Pakistan</span>
              <span className="text-[11px] text-stone-500">Heirloom Quality & Durability</span>
            </div>
          </div>

          {/* Column 2: SHOP */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white font-serif">SHOP</h5>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button onClick={() => onNavigate('shop', 'wallets')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Men&apos;s Wallets
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop', 'belts')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Men&apos;s Belts
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop', 'watches')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Premium Watches
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop', 'accessories')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Leather Accessories
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-amber-400 transition-colors cursor-pointer font-semibold text-stone-300">
                  Shop All →
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: CUSTOMER CARE */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white font-serif">CUSTOMER CARE</h5>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button onClick={() => onNavigate('help')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Help Center
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  FAQ
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('track')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Order Tracking
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('returns-policy')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Returns & Refunds
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shipping')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Shipping & Delivery
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: COMPANY */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white font-serif">COMPANY</h5>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Our Story
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: CONTACT & PAYMENT */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white font-serif">CONTACT</h5>
              <div className="space-y-2 text-xs text-stone-400">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>DHA Phase 5, Lahore, Pakistan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>03711661611</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>fawnic01@gmail.com</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-800">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-white font-serif">PAYMENT</h5>
              <div className="flex flex-col gap-1.5 text-xs text-stone-400">
                <span className="flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  Cash on Delivery (COD)
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Bank Transfer (Meezan Bank)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Logistics Badges */}
        <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-stone-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-stone-400 font-medium">Payment Protocol:</span>
            <span className="px-2.5 py-1 bg-stone-900 rounded border border-stone-800 text-stone-300 text-[11px]">
              Cash on Delivery (COD Nationwide)
            </span>
            <span className="px-2.5 py-1 bg-stone-900 rounded border border-stone-800 text-stone-300 text-[11px]">
              Meezan Bank Transfer (IBFT)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-400 font-medium">Courier Partners:</span>
            <span className="px-2 py-0.5 bg-stone-900 border border-stone-800 text-stone-300 rounded text-[11px]">TCS Express</span>
            <span className="px-2 py-0.5 bg-stone-900 border border-stone-800 text-stone-300 rounded text-[11px]">Leopards Courier</span>
            <span className="px-2 py-0.5 bg-stone-900 border border-stone-800 text-stone-300 rounded text-[11px]">Trax Logistics</span>
          </div>
        </div>

        {/* Bottom Legal Disclaimer */}
        <div className="mt-8 pt-6 border-t border-stone-800/60 text-center text-[11px] text-stone-500 space-y-1">
          <p>© {new Date().getFullYear()} FAWNIC Leather Atelier (Pvt) Ltd. All rights reserved.</p>
          <p className="text-stone-600">
            Handcrafted with pride in Pakistan. All full-grain leather products are genuine animal hide and naturally age with unique patina.
          </p>
          <p className="text-[11px] text-stone-400 font-medium pt-1">Developed By Fawnic Team</p>
        </div>
      </div>
    </footer>
  );
};
