import React, { useState } from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  Scale,
  CreditCard,
  Truck,
  RotateCcw,
  Lock,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface TermsPageProps {
  onNavigate: (route: string, param?: any) => void;
}

const SECTIONS = [
  { id: 'intro', title: '1. Introduction & Acceptance' },
  { id: 'eligibility', title: '2. Eligibility & Account Security' },
  { id: 'products', title: '3. Products & Pricing Accuracy' },
  { id: 'orders', title: '4. Orders & Cancellations' },
  { id: 'payments', title: '5. Payment Methods & COD' },
  { id: 'shipping', title: '6. Nationwide Shipping & Risk' },
  { id: 'returns', title: '7. 7-Day Returns & Refunds' },
  { id: 'ip', title: '8. Intellectual Property & Atelier Marks' },
  { id: 'conduct', title: '9. Prohibited Conduct' },
  { id: 'liability', title: '10. Limitation of Liability' },
  { id: 'law', title: '11. Governing Law (Pakistan)' },
  { id: 'contact', title: '12. Contact & Atelier Address' },
];

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('intro');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrint = () => {
    window.print();
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
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Legal Agreement & Terms of Service
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 leading-tight">
                Terms & Conditions
              </h1>
              <div className="flex items-center gap-4 text-xs text-stone-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Effective: September 2026
                </span>
                <span>•</span>
                <span>Version 2.4</span>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-stone-200 hover:text-white transition-all cursor-pointer backdrop-blur-xs flex items-center gap-2 self-start sm:self-center"
            >
              <Printer className="w-4 h-4" />
              <span>Print Terms</span>
            </button>
          </div>
        </div>

        {/* Content Layout: Sticky Sidebar + Main Text */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Table of Contents Sidebar */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 font-mono">
              Table of Contents
            </h3>
            <nav className="space-y-1">
              {SECTIONS.map((sec) => (
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

          {/* Main Legal Content */}
          <div className="lg:col-span-3 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-8 sm:p-12 space-y-12 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed shadow-xs">
            {/* Section 1 */}
            <section id="intro" className="space-y-3 pt-2">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                1. Introduction & Acceptance of Terms
              </h2>
              <p>
                Welcome to <strong>FAWNIC Bespoke Leather Atelier</strong> (&ldquo;FAWNIC&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing our website, purchasing our handcrafted full-grain leather goods, or using any associated services, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms & Conditions.
              </p>
              <p>
                If you do not agree with any provision set forth herein, please discontinue the use of our services immediately. These terms apply to all visitors, registered customers, and buyers across Pakistan and worldwide.
              </p>
            </section>

            {/* Section 2 */}
            <section id="eligibility" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                2. Eligibility & Account Security
              </h2>
              <p>
                To place an order or create an account, you must be at least 18 years of age or possess legal parental/guardian consent. When registering an account:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-600 dark:text-stone-400">
                <li>You agree to provide accurate, current, and complete information.</li>
                <li>You are responsible for maintaining the confidentiality of your credentials.</li>
                <li>You must immediately notify FAWNIC Atelier of any unauthorized use or security breach.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="products" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                3. Products, Descriptions & Full-Grain Authenticity
              </h2>
              <p>
                Every FAWNIC product is crafted from genuine 100% full-grain steerhides, cowhides, and vegetable-tanned leathers. Because full-grain leather is an authentic natural material:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-600 dark:text-stone-400">
                <li>Natural variations in grain texture, growth marks, and subtle tonal shifts are hallmarks of genuine craftsmanship, not defects.</li>
                <li>Product colors viewed on digital displays may vary slightly from physical items due to monitor calibration.</li>
                <li>All prices are listed in Pakistani Rupees (PKR) and include applicable taxes unless otherwise noted.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="orders" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                4. Order Placement, Verification & Cancellations
              </h2>
              <p>
                When you place an order, you will receive an automatic confirmation via email and SMS. Orders are verified by our Karachi atelier team before dispatch. We reserve the right to cancel or limit quantities of any order if fraudulent activity is suspected, or in cases of unforeseen stock unavailability.
              </p>
              <p>
                You may cancel your order free of charge from your Customer Dashboard before the consignment is handed over to our courier partner.
              </p>
            </section>

            {/* Section 5 */}
            <section id="payments" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                5. Payment Methods & Cash on Delivery (COD)
              </h2>
              <p>
                We accept:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-600 dark:text-stone-400">
                <li><strong>Cash on Delivery (COD):</strong> Available throughout all serviced cities in Pakistan. Pay the courier rider the exact invoice amount upon delivery.</li>
                <li><strong>Direct Bank Transfer / 1Link IBFT:</strong> Direct deposit into FAWNIC’s corporate Meezan Bank account. Consignments are dispatched once the transaction is reconciled.</li>
                <li><strong>Online Debit / Credit Cards:</strong> Encrypted 256-bit gateway transactions via verified payment switches.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="shipping" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                6. Nationwide Shipping, Timelines & Risk of Loss
              </h2>
              <p>
                Free Delivery on orders of Rs. 5,000 or more. Orders below Rs. 5,000 incur a standard delivery charge of Rs. 250. Orders of Rs. 5,000 or more paid online receive 7% cashback credited within 24 hours. Estimated delivery times:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-600 dark:text-stone-400">
                <li>Karachi: 12 – 24 business hours</li>
                <li>Lahore, Islamabad, Rawalpindi, Faisalabad: 24 – 48 business hours</li>
                <li>Rest of Pakistan: 2 – 3 business days</li>
              </ul>
              <p>
                Consignments are fully insured against transit damage. If the parcel exterior appears compromised upon delivery, please do not accept it and notify our concierge immediately.
              </p>
            </section>

            {/* Section 7 */}
            <section id="returns" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                7. 7-Day Hassle-Free Returns & Refund Policy
              </h2>
              <p>
                We proudly provide a 7-day doorstep return and exchange window. To qualify, products must be in brand new, unused condition, inside their original magnetic box with protective dust bags.
              </p>
              <p>
                Once returned items are inspected at our Karachi facility, refunds are disbursed via IBFT or JazzCash within 48 hours. Please refer to our dedicated <button onClick={() => onNavigate('returns-policy')} className="text-amber-600 dark:text-amber-400 underline font-semibold">Return & Refund Policy</button> for comprehensive details.
              </p>
            </section>

            {/* Section 8 */}
            <section id="ip" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                8. Intellectual Property & Atelier Marks
              </h2>
              <p>
                All trademarks, logos, leather design patterns, product photography, text, and bespoke software code displayed on FAWNIC are the exclusive intellectual property of FAWNIC Atelier. Any reproduction, distribution, or unauthorized commercial exploitation is strictly prohibited under the Copyright Ordinance of Pakistan.
              </p>
            </section>

            {/* Section 9 */}
            <section id="conduct" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                9. Prohibited Conduct
              </h2>
              <p>
                You agree not to use the website or its services to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-600 dark:text-stone-400">
                <li>Submit false, misleading, or fraudulent inquiries or orders.</li>
                <li>Attempt to breach or probe website security infrastructure.</li>
                <li>Interfere with courier delivery personnel or staff operations.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="liability" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                10. Limitation of Liability & Warranty
              </h2>
              <p>
                FAWNIC stands behind the craftsmanship of every product with a 1-Year limited warranty covering stitching integrity and hardware attachments. We are not liable for incidental damage resulting from improper conditioning, water immersion, or normal cosmetic wear and tear.
              </p>
            </section>

            {/* Section 11 */}
            <section id="law" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                11. Governing Law & Jurisdiction
              </h2>
              <p>
                These Terms & Conditions and any separate agreements whereby we provide you goods shall be governed by and construed in accordance with the substantive laws of the Islamic Republic of Pakistan. Any dispute arising out of or related to these terms shall be submitted to the exclusive jurisdiction of the competent courts in Karachi, Sindh, Pakistan.
              </p>
            </section>

            {/* Section 12 */}
            <section id="contact" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
                12. Contact & Atelier Legal Notices
              </h2>
              <p>
                For questions regarding these Terms & Conditions, please contact:
              </p>
              <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono text-xs space-y-1">
                <p><strong>FAWNIC Bespoke Leather Atelier</strong></p>
                <p>Legal & Compliance Department</p>
                <p>Email: fawnic1@gmail.com</p>
                <p>Concierge Phone & WhatsApp: 03711661611</p>
                <p>Lahore, Punjab, Pakistan</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
