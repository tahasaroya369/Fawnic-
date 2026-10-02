import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  DollarSign,
  Truck,
  ShieldCheck,
  Save,
  CheckCircle2,
  Building,
  CreditCard,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Globe,
  AlertTriangle,
  FileText,
  Search,
  Sparkles,
} from 'lucide-react';

interface AdminSettingsTabProps {
  token: string | null;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form State
  const [storeName, setStoreName] = useState('FAWNIC Leather Atelier');
  const [tagline, setTagline] = useState('Bespoke Handcrafted Full-Grain Leather Atelier');
  const [logoUrl, setLogoUrl] = useState('https://i.postimg.cc/d391qxwY/Whats-App-Image-2026-09-11-at-11-39-40-AM.jpg');
  const [email, setEmail] = useState('fawnic1@gmail.com');
  const [phone, setPhone] = useState('03711661611');
  const [whatsapp, setWhatsapp] = useState('03711661611');
  const [address, setAddress] = useState('Lahore, Punjab, Pakistan');
  const [currency, setCurrency] = useState('PKR');

  // Shipping
  const [standardShippingFee, setStandardShippingFee] = useState(250);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(3500);
  const [estimatedDeliveryKarachi, setEstimatedDeliveryKarachi] = useState('2 - 3 Business Days');
  const [estimatedDeliveryMajorCities, setEstimatedDeliveryMajorCities] = useState('24 - 48 Hours');
  const [estimatedDeliveryNationwide, setEstimatedDeliveryNationwide] = useState('2 - 3 Business Days');

  // Payments
  const [codEnabled, setCodEnabled] = useState(true);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(true);
  const [bankPaymentProofRequired, setBankPaymentProofRequired] = useState(true);
  const [bankAccountTitle, setBankAccountTitle] = useState('ALI AHAB MUKARRAM');
  const [bankName, setBankName] = useState('Meezan Bank');
  const [bankAccountNumber, setBankAccountNumber] = useState('28020115438839');
  const [bankIban, setBankIban] = useState('PK20MEZN0028020115438839');
  const [bankBranchCode, setBankBranchCode] = useState('Islamic Banking Branch');
  const [bankPaymentInstructions, setBankPaymentInstructions] = useState('Transfer the exact order total via mobile banking app, ATM, or internet banking. After making the transfer, enter your transaction reference number or upload your payment receipt below.');

  // SEO Settings
  const [seoEnabled, setSeoEnabled] = useState(true);
  const [productSeo, setProductSeo] = useState(true);
  const [productSchema, setProductSchema] = useState(true);
  const [sitemapEnabled, setSitemapEnabled] = useState(true);
  const [indexProducts, setIndexProducts] = useState(true);

  // Maintenance Mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Social Links
  const [instagram, setInstagram] = useState('https://instagram.com/fawnic.pk');
  const [facebook, setFacebook] = useState('https://facebook.com/fawnic.pk');
  const [tiktok, setTiktok] = useState('https://tiktok.com/@fawnic');

  // Invoice Preferences
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');

  useEffect(() => {
    loadSettings();
  }, [token]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const s = await res.json();
        if (s) {
          setStoreName(s.storeName || 'FAWNIC Leather Atelier');
          setTagline(s.tagline || 'Bespoke Handcrafted Full-Grain Leather Atelier');
          setLogoUrl(s.logoUrl || 'https://i.postimg.cc/d391qxwY/Whats-App-Image-2026-09-11-at-11-39-40-AM.jpg');
          setEmail(s.supportEmail || 'fawnic1@gmail.com');
          setPhone(s.supportPhone || '03711661611');
          setWhatsapp(s.supportWhatsApp || '03711661611');
          setAddress(s.officeAddress || 'Lahore, Punjab, Pakistan');
          setCurrency(s.currency || 'PKR');

          setStandardShippingFee(s.standardShippingFee ?? 250);
          setFreeShippingThreshold(s.freeShippingThreshold ?? 3500);
          setEstimatedDeliveryKarachi(s.estimatedDeliveryKarachi || '2 - 3 Business Days');
          setEstimatedDeliveryMajorCities(s.estimatedDeliveryMajorCities || '24 - 48 Hours');
          setEstimatedDeliveryNationwide(s.estimatedDeliveryNationwide || '2 - 3 Business Days');

          setCodEnabled(s.codEnabled ?? true);
          setBankTransferEnabled(s.bankTransferEnabled ?? true);
          setBankPaymentProofRequired(s.bankPaymentProofRequired ?? true);
          setBankAccountTitle(s.bankAccountTitle || 'ALI AHAB MUKARRAM');
          setBankName(s.bankName || 'Meezan Bank');
          setBankAccountNumber(s.bankAccountNumber || '28020115438839');
          setBankIban(s.bankIban || 'PK20MEZN0028020115438839');
          setBankBranchCode(s.bankBranchCode || 'Islamic Banking Branch');
          setBankPaymentInstructions(s.bankPaymentInstructions || 'Transfer the exact order total via mobile banking app, ATM, or internet banking. After making the transfer, enter your transaction reference number or upload your payment receipt below.');

          if (s.seoSettings) {
            setSeoEnabled(s.seoSettings.enabled ?? true);
            setProductSeo(s.seoSettings.productSeo ?? true);
            setProductSchema(s.seoSettings.productSchema ?? true);
            setSitemapEnabled(s.seoSettings.sitemap ?? true);
            setIndexProducts(s.seoSettings.indexProducts ?? true);
          }

          setMaintenanceMode(s.maintenanceMode ?? false);

          if (s.socialLinks) {
            setInstagram(s.socialLinks.instagram || '');
            setFacebook(s.socialLinks.facebook || '');
            setTiktok(s.socialLinks.tiktok || '');
          }

          if (s.invoicePrefix) {
            setInvoicePrefix(s.invoicePrefix);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load store settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        storeName,
        tagline,
        logoUrl,
        supportEmail: email,
        supportPhone: phone,
        supportWhatsApp: whatsapp,
        officeAddress: address,
        currency,
        standardShippingFee: Number(standardShippingFee),
        freeShippingThreshold: Number(freeShippingThreshold),
        estimatedDeliveryKarachi,
        estimatedDeliveryMajorCities,
        estimatedDeliveryNationwide,
        codEnabled,
        bankTransferEnabled,
        bankPaymentProofRequired,
        bankAccountTitle,
        bankName,
        bankAccountNumber,
        bankIban,
        bankBranchCode,
        bankPaymentInstructions,
        seoSettings: {
          enabled: seoEnabled,
          productSeo,
          productSchema,
          sitemap: sitemapEnabled,
          indexProducts,
        },
        maintenanceMode,
        socialLinks: {
          instagram,
          facebook,
          tiktok,
        },
        invoicePrefix,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update store settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-stone-500">
        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading Atelier Configuration...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Store Settings & Operations
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Manage FAWNIC brand parameters, Pakistan delivery charges, IBFT banking details, SEO switches, and maintenance status.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-serif uppercase tracking-widest font-bold rounded-xl hover:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50 transition flex items-center gap-2 shadow-sm cursor-pointer"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Atelier configuration saved and applied across the boutique!</span>
        </div>
      )}

      {/* Maintenance Mode Callout */}
      <div className={`p-6 border rounded-2xl shadow-xs transition-colors ${
        maintenanceMode
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
          : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${maintenanceMode ? 'text-amber-600' : 'text-stone-400'}`} />
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Atelier Maintenance Mode
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              When Maintenance Mode is <strong>ON</strong>, visitors to the public boutique see the private luxury message:
              <br />
              <em className="text-amber-800 dark:text-amber-300 font-serif">
                "FAWNIC Atelier is currently updating the private collection. We will be back shortly."
              </em>
              <br />
              The admin console at <span className="font-mono text-[11px] font-bold">/aliadmin</span> remains completely accessible to you.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>
      </div>

      {/* Brand Identity & Contact */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Store className="w-4 h-4 text-amber-500" />
          <span>Brand Identity & Public Contact</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Store Name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-serif text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Brand Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Contact Phone
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Contact WhatsApp
            </label>
            <div className="relative">
              <MessageSquare className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Concierge Email
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Store Currency
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={currency}
                disabled
                className="w-full pl-9 pr-3.5 py-2 bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-600 dark:text-stone-300 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Store & Atelier Address
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Store Logo URL
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>
      </div>

      {/* Nationwide Consignment & Delivery Rates */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-500" />
          <span>Pakistan Delivery Charges & SLAs</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Standard Shipping Fee (PKR)
            </label>
            <input
              type="number"
              value={standardShippingFee}
              onChange={(e) => setStandardShippingFee(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
            />
            <p className="text-[11px] text-stone-400 mt-1">Charged on orders below the threshold</p>
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Free Shipping Threshold (PKR)
            </label>
            <input
              type="number"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
            />
            <p className="text-[11px] text-stone-400 mt-1">Orders at or above this value get free delivery</p>
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Karachi Delivery Window
            </label>
            <input
              type="text"
              value={estimatedDeliveryKarachi}
              onChange={(e) => setEstimatedDeliveryKarachi(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Major Cities (Lahore, Islamabad, etc.)
            </label>
            <input
              type="text"
              value={estimatedDeliveryMajorCities}
              onChange={(e) => setEstimatedDeliveryMajorCities(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>
      </div>

      {/* Payment Methods & Bank Details */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-500" />
          <span>Payment Gateways & Pakistani Bank Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2 border-b border-stone-200 dark:border-zinc-800 text-xs">
          <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={codEnabled}
              onChange={(e) => setCodEnabled(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">Cash on Delivery (COD)</p>
              <p className="text-[11px] text-stone-500">Allow customers to pay upon physical delivery</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={bankTransferEnabled}
              onChange={(e) => setBankTransferEnabled(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">Bank Transfer (1Link IBFT)</p>
              <p className="text-[11px] text-stone-500">Allow customers to transfer to atelier account</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={bankPaymentProofRequired}
              onChange={(e) => setBankPaymentProofRequired(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">Require Payment Proof</p>
              <p className="text-[11px] text-stone-500">Customer must upload screenshot/receipt</p>
            </div>
          </label>
        </div>

        {bankTransferEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Account Title
              </label>
              <input
                type="text"
                value={bankAccountTitle}
                onChange={(e) => setBankAccountTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-serif text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                IBAN Number
              </label>
              <input
                type="text"
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Branch Code / Name
              </label>
              <input
                type="text"
                value={bankBranchCode}
                onChange={(e) => setBankBranchCode(e.target.value)}
                placeholder="e.g. 0101 (Clifton Branch, Karachi)"
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Bank Transfer Instructions for Customer Checkout
              </label>
              <textarea
                rows={2}
                value={bankPaymentInstructions}
                onChange={(e) => setBankPaymentInstructions(e.target.value)}
                placeholder="Transfer the exact order total via mobile banking app, ATM, or internet banking..."
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* SEO Settings per Requirement #44 */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-500" />
          <span>SEO & Search Indexing Controls</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={seoEnabled}
              onChange={(e) => setSeoEnabled(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">Global SEO Active</p>
              <p className="text-[11px] text-stone-500">Inject meta tags and OpenGraph tags storewide</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={productSeo}
              onChange={(e) => setProductSeo(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">Product SEO Overrides</p>
              <p className="text-[11px] text-stone-500">Allow per-product custom SEO titles and descriptions</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={productSchema}
              onChange={(e) => setProductSchema(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">Product Schema (JSON-LD)</p>
              <p className="text-[11px] text-stone-500">Generate structured rich snippets for Google search</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={indexProducts}
              onChange={(e) => setIndexProducts(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">Index Products</p>
              <p className="text-[11px] text-stone-500">Instruct search engines to crawl catalog articles</p>
            </div>
          </label>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Social Media Links</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Instagram
            </label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Facebook
            </label>
            <input
              type="text"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-stone-700 dark:text-stone-300 mb-1">
              TikTok
            </label>
            <input
              type="text"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl font-mono text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
