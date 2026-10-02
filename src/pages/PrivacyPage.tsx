import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  FileCheck,
  Server,
  HelpCircle,
  Clock,
  Printer,
  Mail,
} from 'lucide-react';

interface PrivacyPageProps {
  onNavigate: (route: string, param?: any) => void;
}

const PRIVACY_SECTIONS = [
  { id: 'intro', title: '1. Introduction' },
  { id: 'collect', title: '2. Information We Collect' },
  { id: 'use', title: '3. How We Use Your Data' },
  { id: 'security', title: '4. Data Security Standards' },
  { id: 'cookies', title: '5. Cookies & Local Storage' },
  { id: 'thirdparty', title: '6. Courier & Payment Partners' },
  { id: 'retention', title: '7. Data Retention' },
  { id: 'rights', title: '8. Your Rights & Controls' },
  { id: 'deletion', title: '9. Account Deletion' },
  { id: 'children', title: '10. Children’s Privacy' },
  { id: 'contact', title: '11. Privacy Contact' },
];

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('intro');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Bar */}
        <div className="relative rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Customer Trust & Data Protection
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 leading-tight">
                Privacy Policy
              </h1>
              <div className="flex items-center gap-4 text-xs text-stone-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Last Updated: September 2026
                </span>
                <span>•</span>
                <span>Version 2.3</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-stone-200 hover:text-white transition-all cursor-pointer backdrop-blur-xs flex items-center gap-2 self-start sm:self-center"
            >
              <Printer className="w-4 h-4" />
              <span>Print Policy</span>
            </button>
          </div>
        </div>

        {/* Content Layout: Sticky Sidebar + Main Text */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Table of Contents Sidebar */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 font-mono">
              Policy Sections
            </h3>
            <nav className="space-y-1">
              {PRIVACY_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer block truncate ${
                    activeSection === sec.id
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold border-l-2 border-amber-500'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  {sec.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-8 sm:p-12 space-y-12 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed shadow-xs">
            <section id="intro" className="space-y-3 pt-2">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                1. Introduction
              </h2>
              <p>
                At <strong>FAWNIC Leather Atelier</strong>, we treat your personal information with the same meticulous care and precision we apply to every hand-stitched wallet and belt. This Privacy Policy details how we collect, use, protect, and handle your data when you interact with our website, place orders, or connect with our customer concierge.
              </p>
            </section>

            <section id="collect" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                2. Information We Collect
              </h2>
              <p>We only collect information strictly required to fulfill your orders and enhance your atelier experience:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-600 dark:text-stone-400">
                <li><strong>Personal Identity:</strong> Your full name, email address, and mobile phone number.</li>
                <li><strong>Delivery Addresses:</strong> Street address, city, district, postal code, and specific delivery landmarks.</li>
                <li><strong>Order History & Receipts:</strong> Products purchased, variant choices, order amounts, and payment verification screenshots for bank transfers.</li>
                <li><strong>Profile Customization:</strong> Profile avatar photo uploaded to your customer account.</li>
              </ul>
            </section>

            <section id="use" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                3. How We Use Your Information
              </h2>
              <p>We use your information exclusively for:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-600 dark:text-stone-400">
                <li>Processing and packing your handcrafted leather orders.</li>
                <li>Transmitting parcel dispatch information and courier tracking numbers via SMS and email.</li>
                <li>Providing personalized customer support and managing return/exchange requests.</li>
                <li>Preventing fraudulent orders and maintaining platform security.</li>
              </ul>
              <p><strong>We never sell, rent, or trade your personal information to third-party advertisers.</strong></p>
            </section>

            <section id="security" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                4. Data Security Standards
              </h2>
              <p>
                We employ industry-standard 256-bit SSL encryption across our entire infrastructure. Sensitive authentication credentials, including customer passwords, are stored utilizing salted cryptographic hashing algorithms. Internal database access is restricted strictly to authorized atelier personnel through secure role-based access control.
              </p>
            </section>

            <section id="cookies" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                5. Cookies & Local Storage
              </h2>
              <p>
                FAWNIC utilizes local browser storage strictly for essential website functionality: preserving your authentication session, maintaining your shopping bag across page navigations, and retaining your chosen dark/light display preference. We do not deploy invasive cross-site tracking beacons.
              </p>
            </section>

            <section id="thirdparty" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                6. Courier & Payment Logistics Partners
              </h2>
              <p>
                To deliver your order to your doorstep, we share necessary delivery details (name, delivery address, contact number, and invoice amount) with certified nationwide logistics partners:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-600 dark:text-stone-400">
                <li><strong>Logistics Partners:</strong> TCS Express, Leopards Courier, Trax Logistics.</li>
                <li><strong>Banking & Settlement:</strong> Meezan Bank Limited (Pakistan) for direct 1Link IBFT reconciliations.</li>
              </ul>
            </section>

            <section id="retention" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                7. Data Retention Policy
              </h2>
              <p>
                We retain your account information and order history as long as your account remains active, ensuring you can review prior purchases, download invoices, and benefit from our 1-Year craftsmanship guarantee.
              </p>
            </section>

            <section id="rights" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                8. Your Rights & Privacy Controls
              </h2>
              <p>
                You retain complete sovereignty over your data. From your <strong>Customer Dashboard</strong>, you can view, update, or modify your full name, phone number, delivery addresses, and profile avatar at any time.
              </p>
            </section>

            <section id="deletion" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                9. Account Deletion & Data Requests
              </h2>
              <p>
                If you wish to permanently delete your account or request an export of your personal data, you may submit a formal request via email to <code>fawnic1@gmail.com</code> or create a support query from your dashboard. Requests are executed within 30 business days.
              </p>
            </section>

            <section id="children" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                10. Children’s Privacy Protection
              </h2>
              <p>
                Our store and bespoke services are directed toward adults. We do not knowingly solicit or collect personal identifiable information from children under the age of 13.
              </p>
            </section>

            <section id="contact" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                11. Privacy Officer Contact
              </h2>
              <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono text-xs space-y-1">
                <p><strong>FAWNIC Bespoke Leather Atelier — Privacy Office</strong></p>
                <p>Email: fawnic1@gmail.com</p>
                <p>Concierge Phone / WhatsApp: 03711661611</p>
                <p>Lahore, Punjab, Pakistan</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
