import React, { useState } from 'react';
import { Truck, RotateCcw, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface PolicyPageProps {
  initialSection?: 'shipping' | 'returns' | 'faqs' | 'privacy';
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ initialSection = 'shipping' }) => {
  const [activeSection, setActiveSection] = useState<'shipping' | 'returns' | 'faqs' | 'privacy'>(
    initialSection
  );
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does Cash on Delivery (COD) work across Pakistan?',
      a: 'When you place an order with Cash on Delivery, your package is dispatched via our courier partners (TCS, Leopards, or Trax). You inspect the outer packaging and pay the exact invoice amount in Pakistani Rupees directly to the courier rider upon delivery at your door.',
    },
    {
      q: 'What are the delivery charges and delivery times for different cities?',
      a: 'Orders of Rs. 5,000 or more qualify for FREE nationwide delivery! For orders under Rs. 5,000, standard delivery is Rs. 250. Deliveries within Lahore are completed within 24 hours. Deliveries to Karachi, Islamabad, and Rawalpindi take 24–48 hours. Other cities across Pakistan take 2–3 working days via TCS and Leopards Courier. Plus, get 7% cashback on online orders of Rs. 5,000 or more (credited within 24 hours).',
    },
    {
      q: 'Can I cancel my order after placing it?',
      a: 'Yes, you can cancel your order directly from your Customer Dashboard while the order status is "Pending" (or within 2 hours of placement before workshop dispatch). Once an order has been packed, dispatched, or handed to the courier rider, it cannot be cancelled while in transit. You may inspect and request a return within 7 days upon delivery.',
    },
    {
      q: 'How do I return or exchange an item within 7 days?',
      a: 'Simply go to your Customer Dashboard > My Orders, locate the delivered order, and click "Request 7-Day Return". Our team will coordinate with TCS for doorstep parcel pickup from your address. Once inspected at our quality center, your refund or exchange is processed within 48 hours.',
    },
    {
      q: 'What type of leather does FAWNIC Atelier use for its goods?',
      a: 'We use exclusively 100% full-grain cowhide, steerhide, and vegetable-tanned Italian hides. We never compromise with bonded leather, bicast leather, or vinyl faux alternatives. Every piece is designed to develop a rich, personal patina over years of use.',
    },
    {
      q: 'Can I pay via Direct Bank Transfer (IBFT) instead of COD?',
      a: 'Yes. You can pay via 1Link / Raast IBFT into our Meezan Bank account (Title: ALI AHAB MUKARRAM, Account: 28020115438839). Your order is placed as Pending Verification until our accounts team verifies your transfer reference or receipt.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-bold font-serif text-zinc-950 dark:text-zinc-50">
          Customer Policies & Guarantees
        </h1>
        <p className="text-xs text-zinc-500">
          Transparent shipping timelines, 7-day returns, and consumer protection across Pakistan
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveSection('shipping')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeSection === 'shipping'
              ? 'text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          Shipping & Logistics
        </button>
        <button
          onClick={() => setActiveSection('returns')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeSection === 'returns'
              ? 'text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          7-Day Return & Exchange
        </button>
        <button
          onClick={() => setActiveSection('faqs')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeSection === 'faqs'
              ? 'text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          Frequently Asked Questions
        </button>
        <button
          onClick={() => setActiveSection('privacy')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeSection === 'privacy'
              ? 'text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          Buyer Protection
        </button>
      </div>

      {/* Section 1: Shipping */}
      {activeSection === 'shipping' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-6 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                Nationwide Courier Shipping Policy
              </h2>
              <p className="text-zinc-400">Powered by TCS, Leopards Courier, & Trax Pakistan</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Delivery Schedules</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Karachi (Same Day / Next Day):</strong> Dispatches from our Karachi hubs are delivered within 12 to 24 hours.
              </li>
              <li>
                <strong>Lahore, Islamabad, Rawalpindi (Express):</strong> Delivered within 24 to 48 hours via express air or road transit.
              </li>
              <li>
                <strong>Peshawar, Multan, Faisalabad, Quetta & Other Cities:</strong> Delivered within 2 to 3 business days.
              </li>
            </ul>

            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm pt-2">Shipping Charges</h3>
            <p>
              Free Delivery on orders of Rs. 5,000 or more. For orders below Rs. 5,000, Standard Delivery is Rs. 250 applied automatically at checkout.
            </p>

            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm pt-2">Multi-Vendor Shipments</h3>
            <p>
              When your order contains items from multiple verified vendor stores (e.g. an ensemble from Lahore and shoes from Peshawar), each vendor dispatches an individual tracking consignment. You can track each parcel independently from your customer portal.
            </p>
          </div>
        </div>
      )}

      {/* Section 2: Returns */}
      {activeSection === 'returns' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-6 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                7-Day Hassle-Free Returns & Exchanges
              </h2>
              <p className="text-zinc-400">Shop with absolute peace of mind</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Eligibility</h3>
            <p>
              Items may be returned or exchanged within 7 days of delivery if they are unworn, unwashed, with all original brand tags and artisan seals intact.
            </p>

            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm pt-2">Doorstep Courier Pickup</h3>
            <p>
              Unlike conventional marketplaces, Fawnic arranges doorstep pickup through TCS riders directly from your residence in any major Pakistani city.
            </p>

            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm pt-2">Refunds</h3>
            <p>
              Refunds for Cash on Delivery orders are issued via JazzCash, EasyPaisa, or direct bank transfer (IBFT) within 48 hours of quality approval.
            </p>
          </div>
        </div>
      )}

      {/* Section 3: FAQs */}
      {activeSection === 'faqs' && (
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 cursor-pointer transition-colors"
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div className="flex items-center justify-between text-xs font-bold text-zinc-950 dark:text-zinc-50">
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </div>
              {openFaq === idx && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section 4: Buyer Protection */}
      {activeSection === 'privacy' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-6 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                Fawnic Escrow & Authenticity Guarantee
              </h2>
              <p className="text-zinc-400">Zero tolerance for replicas or counterfeit items</p>
            </div>
          </div>

          <div className="space-y-4">
            <p>
              When you order on Fawnic, payments are protected under our Escrow standard. Merchant payouts are held until the customer receives the item in verified condition.
            </p>
            <p>
              All customer personal data, telephone numbers, and delivery addresses are encrypted and strictly utilized for delivery fulfillment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
