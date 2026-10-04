import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  Building,
  CreditCard,
  Banknote,
  Smartphone,
  Plus,
  ArrowRight,
  Copy,
  Check,
  UploadCloud,
  FileText,
  X,
  Image as ImageIcon,
  Info,
} from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { checkShoppingAuth } from '../utils/authGuard.js';
import type { Address } from '../types.js';

interface CheckoutPageProps {
  onNavigate: (route: string, param?: any) => void;
}

const PAKISTAN_PROVINCES = [
  'Sindh',
  'Punjab',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu & Kashmir',
  'Gilgit-Baltistan',
];

const MAJOR_CITIES: Record<string, string[]> = {
  Sindh: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Mirpur Khas', 'Nawabshah'],
  Punjab: ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Swat', 'Dera Ismail Khan'],
  Balochistan: ['Quetta', 'Gwadar', 'Hub', 'Turbat'],
  'Islamabad Capital Territory': ['Islamabad'],
  'Azad Jammu & Kashmir': ['Muzaffarabad', 'Mirpur'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu'],
};

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { items, subtotal, shippingFee, discountAmount, couponCode, total, clearCart } = useCart();
  const { user, token } = useAuth();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [useNewAddress, setUseNewAddress] = useState<boolean>(true);

  // Form Fields for Pakistani Address
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+92 ');
  const [province, setProvince] = useState('Sindh');
  const [city, setCity] = useState('Karachi');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [postalCode, setPostalCode] = useState('75500');

  // Payment Selection - Strictly COD and Bank Transfer only
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');
  const [bankTxRef, setBankTxRef] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [paymentProofName, setPaymentProofName] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Authenticated Shopping Guard: guests must sign in before checking out
  useEffect(() => {
    if (!token && !user) {
      checkShoppingAuth(false, onNavigate, { action: 'checkout', returnRoute: 'checkout' });
    }
  }, [token, user, onNavigate]);

  // Dynamic Store & Payment Settings
  const [storeSettings, setStoreSettings] = useState<{
    bankName?: string;
    bankAccountTitle?: string;
    bankAccountNumber?: string;
    bankIban?: string;
    bankPaymentInstructions?: string;
    bankPaymentProofRequired?: boolean;
    codEnabled?: boolean;
    bankTransferEnabled?: boolean;
  }>({
    bankName: 'Meezan Bank',
    bankAccountTitle: 'ALI AHAB MUKARRAM',
    bankAccountNumber: '28020115438839',
    bankIban: 'PK20MEZN0028020115438839',
    bankPaymentInstructions: 'Transfer the exact order amount to the account above.',
    bankPaymentProofRequired: true,
    codEnabled: true,
    bankTransferEnabled: true,
  });

  const isOnlineEligible = paymentMethod === 'bank_transfer' && subtotal >= 5000;
  const cashbackAmount = isOnlineEligible ? Math.round(subtotal * 0.07) : 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch store settings for realtime bank account info
  useEffect(() => {
    const updateSettingsFromData = (data: any) => {
      if (data && typeof data === 'object') {
        setStoreSettings((prev) => ({
          ...prev,
          bankName: data.bankName || 'Meezan Bank',
          bankAccountTitle: data.bankAccountTitle || 'ALI AHAB MUKARRAM',
          bankAccountNumber: data.bankAccountNumber || '28020115438839',
          bankIban: data.bankIban || 'PK20MEZN0028020115438839',
          bankPaymentInstructions: data.bankPaymentInstructions || 'Transfer the exact order amount to the account above.',
          bankPaymentProofRequired: data.bankPaymentProofRequired ?? true,
          codEnabled: data.codEnabled ?? true,
          bankTransferEnabled: data.bankTransferEnabled ?? true,
        }));
      }
    };

    fetch('/api/settings')
      .then((res) => res.json())
      .then(updateSettingsFromData)
      .catch((err) => console.error('Error fetching settings:', err));

    const handleSettingsChange = (e: any) => {
      if (e.detail?.settings) {
        updateSettingsFromData(e.detail.settings);
      }
    };

    window.addEventListener('fawnic:settings_change', handleSettingsChange);
    return () => {
      window.removeEventListener('fawnic:settings_change', handleSettingsChange);
    };
  }, []);

  // Fetch user addresses if logged in
  useEffect(() => {
    if (token) {
      fetch('/api/customer/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSavedAddresses(data);
            const defaultAddr = data.find((a) => a.isDefault) || data[0];
            setSelectedAddressId(defaultAddr.id);
            setUseNewAddress(false);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [token]);

  // Update city options when province changes
  useEffect(() => {
    const citiesInProvince = MAJOR_CITIES[province] || ['Karachi'];
    if (!citiesInProvince.includes(city)) {
      setCity(citiesInProvince[0]);
    }
  }, [province, city]);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif text-zinc-950 dark:text-zinc-50">
          Your Bag is Empty
        </h2>
        <p className="text-xs text-zinc-500">
          You need items in your cart to proceed to checkout.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Explore Shop
        </button>
      </div>
    );
  }

  // Multi-vendor package separation
  const packagesByVendor = items.reduce<Record<string, { vendorName: string; items: typeof items }>>(
    (acc, item) => {
      const vId = item.product.vendorId;
      if (!acc[vId]) {
        acc[vId] = {
          vendorName: item.product.vendorStoreName,
          items: [],
        };
      }
      acc[vId].items.push(item);
      return acc;
    },
    {}
  );

  const handleCopy = (text: string, type: 'account' | 'iban') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Proof file exceeds 10MB limit. Please upload a smaller image or document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPaymentProof(event.target?.result as string);
      setPaymentProofName(file.name);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let finalAddress: Address;
    if (!useNewAddress && selectedAddressId !== 'new') {
      const found = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!found) {
        setErrorMsg('Please select a valid delivery address.');
        return;
      }
      finalAddress = found;
    } else {
      if (!fullName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim()) {
        setErrorMsg('Please complete all required address fields.');
        return;
      }
      finalAddress = {
        id: `addr_${Date.now()}`,
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        province: province.trim(),
        postalCode: postalCode.trim() || '00000',
        isDefault: false,
      };
    }

    const finalEmail = (token ? user?.email : email) || '';
    if (!finalEmail.trim()) {
      setErrorMsg('Please provide a valid contact email address.');
      return;
    }

    // Strict Bank Transfer Validation: Both Transaction ID and Screenshot Proof are mandatory
    if (paymentMethod === 'bank_transfer') {
      if (!bankTxRef.trim()) {
        setErrorMsg('Transaction ID (TID) is required for Bank Transfer. Please enter the transfer reference number.');
        return;
      }
      if (!paymentProof) {
        setErrorMsg('Payment Screenshot is required for Bank Transfer. Please upload your transaction receipt/screenshot.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerName: finalAddress.fullName,
          customerEmail: finalEmail.trim().toLowerCase(),
          customerPhone: finalAddress.phone,
          shippingAddress: finalAddress,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            selectedVariants: i.selectedVariants,
            selectedVariation: i.selectedVariation,
            selectedColor:
              i.selectedColor ||
              i.selectedVariation?.color ||
              (i.selectedVariation && i.selectedVariation.type !== 'size' && !i.selectedVariation.size ? i.selectedVariation.name : undefined) ||
              i.selectedVariants?.['Color'],
            selectedSize:
              i.selectedSize ||
              i.selectedVariation?.size ||
              (i.selectedVariation && i.selectedVariation.type === 'size' ? i.selectedVariation.name : undefined) ||
              i.selectedVariants?.['Size'] ||
              i.selectedVariants?.['Waist Size'],
          })),
          paymentMethod,
          paymentProof: paymentProof || undefined,
          bankTxRef: bankTxRef.trim() || undefined,
          couponCode: couponCode || undefined,
          cashbackAmount: isOnlineEligible ? cashbackAmount : 0,
          cashbackPercentage: isOnlineEligible ? 7 : 0,
          notes: orderNotes ? `${orderNotes}${bankTxRef ? ` | Bank Ref: ${bankTxRef}` : ''}` : bankTxRef ? `Bank Ref: ${bankTxRef}` : undefined,
          guestEmail: !token ? finalEmail.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit order. Please check your details.');
        return;
      }

      // Success
      try {
        sessionStorage.setItem('fawnic_last_order', JSON.stringify(data.order));
        localStorage.setItem('fawnic_last_order', JSON.stringify(data.order));
      } catch (e) {
        // ignore
      }
      clearCart();
      onNavigate('order-success', data.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred during checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-zinc-950 dark:text-zinc-50">
          Checkout & Dispatch
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Complete your delivery address and preferred Pakistani payment method
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Columns: Address & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Delivery Address */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                Shipping Address in Pakistan
              </h2>

              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseNewAddress(!useNewAddress)}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {useNewAddress ? 'Use Saved Address' : '+ Add New Address'}
                </button>
              )}
            </div>

            {/* Saved Addresses Selector */}
            {!useNewAddress && savedAddresses.length > 0 && (
              <div className="space-y-3">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`block p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedAddressId === addr.id
                        ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/60 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="accent-zinc-900"
                        />
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {addr.fullName}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">{addr.phone}</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 pl-5">
                      {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}
                      {addr.landmark ? `(Near: ${addr.landmark}), ` : ''}
                      {addr.city}, {addr.province} - {addr.postalCode}
                    </p>
                  </label>
                ))}
              </div>
            )}

            {/* New Address Form */}
            {(useNewAddress || savedAddresses.length === 0) && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ayesha Khan"
                      required
                      className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Phone (TCS / Leopards SMS alert) *
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 3XX XXXXXXX"
                      required
                      className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                {!user && (
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Email Address (for order tracking & invoice) *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      required
                      className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Province / Region *
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none cursor-pointer"
                    >
                      {PAKISTAN_PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      City *
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none cursor-pointer"
                    >
                      {(MAJOR_CITIES[province] || [city]).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Street Address & House / Flat # *
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. House 42-B, Street 7"
                    required
                    className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Area / Sector / Block
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="e.g. Clifton Block 4 / Gulberg III / F-8"
                      className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Prominent Landmark
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Shell Pump / Opposite Jamia Masjid"
                      className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Payment Method */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                Payment Method (PKR)
              </h2>
              <span className="text-[11px] text-zinc-500 font-medium">
                Encrypted & Verified
              </span>
            </div>

            <div className="space-y-4">
              {/* Option 1: Cash on Delivery (COD) */}
              {storeSettings.codEnabled !== false && (
                <label
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/60 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 accent-zinc-900"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
                        Cash on Delivery (COD)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Nationwide
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Pay in Pakistani Rupees cash to the TCS or Leopards courier rider at your doorstep upon parcel arrival.
                    </p>
                  </div>
                </label>
              )}

              {/* Option 2: Bank Transfer (FAWNIC Meezan Bank) */}
              {storeSettings.bankTransferEnabled !== false && (
                <div
                  className={`rounded-2xl border transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-zinc-900 dark:border-white bg-zinc-50/50 dark:bg-zinc-800/40 p-4 sm:p-5 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 p-4'
                  }`}
                >
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="mt-1 accent-zinc-900"
                    />
                    <div className="space-y-1 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <Building className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50 tracking-wide uppercase">
                          Bank Transfer
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          {storeSettings.bankName || 'Meezan Bank'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Transfer the order amount using your bank or a supported digital banking/wallet application to the FAWNIC Meezan Bank account below.
                      </p>
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800/60">
                          ⚡ Get 7% cashback on online orders of Rs. 5,000 or more. Cashback is credited within 24 hours.
                        </span>
                      </div>
                    </div>
                  </label>

                  {/* Expanded Bank Transfer Details */}
                  {paymentMethod === 'bank_transfer' && (
                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700/60 space-y-4">
                      {isOnlineEligible && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-900 dark:text-emerald-200">
                            🎉 7% Online Payment Cashback: Rs. {cashbackAmount.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                            Credited within 24 hours
                          </span>
                        </div>
                      )}
                      {/* Premium Account Card */}
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-amber-500/30 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                          <div>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-700 dark:text-amber-400 block">
                              FAWNIC Bank Account Details
                            </span>
                            <h3 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {storeSettings.bankName || 'Meezan Bank'}
                            </h3>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            Payable: Rs. {total.toLocaleString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Account Title */}
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-0.5 font-medium">
                              Account Title
                            </span>
                            <span className="font-bold text-zinc-950 dark:text-zinc-100 font-serif">
                              {storeSettings.bankAccountTitle || 'ALI AHAB MUKARRAM'}
                            </span>
                          </div>

                          {/* Bank Name & Branch */}
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-0.5 font-medium">
                              Bank & Branch
                            </span>
                            <span className="font-bold text-zinc-950 dark:text-zinc-100">
                              {storeSettings.bankName || 'Meezan Bank'} ({(storeSettings as any).bankBranch || 'DHA Phase 5, Lahore'})
                            </span>
                          </div>

                          {/* Account Number with Copy */}
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-0.5 font-medium">
                                Account Number
                              </span>
                              <span className="font-mono font-bold text-zinc-950 dark:text-zinc-100 text-sm">
                                {storeSettings.bankAccountNumber || '28020115438839'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(storeSettings.bankAccountNumber || '28020115438839', 'account')}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[11px] font-semibold flex items-center gap-1 hover:opacity-90 transition cursor-pointer shrink-0"
                            >
                              {copiedAccount ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400 dark:text-emerald-600" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Account</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* IBAN with Copy */}
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-2">
                            <div className="truncate">
                              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-0.5 font-medium">
                                IBAN (Raast / 1Link)
                              </span>
                              <span className="font-mono font-bold text-zinc-950 dark:text-zinc-100 text-xs block truncate">
                                {storeSettings.bankIban || 'PK20MEZN0028020115438839'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(storeSettings.bankIban || 'PK20MEZN0028020115438839', 'iban')}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[11px] font-semibold flex items-center gap-1 hover:opacity-90 transition cursor-pointer shrink-0"
                            >
                              {copiedIban ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400 dark:text-emerald-600" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy IBAN</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/50 dark:border-amber-800/40 space-y-2">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">
                            Transfer the exact order amount to the FAWNIC Meezan Bank account above.
                          </p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-normal">
                            You can pay using your bank app or supported digital wallet such as <strong>JazzCash</strong>, <strong>Easypaisa</strong>, <strong>NayaPay</strong>, <strong>SadaPay</strong>, or another supported banking app (Meezan, HBL, Alfalah, SCB, etc.) by transferring the amount to the FAWNIC Meezan Bank account.
                          </p>
                          <p className="text-[10px] text-zinc-500 italic">
                            * Note: Digital wallet and banking apps are external transfer channels to send funds to our official Meezan Bank account.
                          </p>
                        </div>
                      </div>

                      {/* Transaction Reference Number Input (REQUIRED) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <span>Transaction ID / TID</span>
                            <span className="text-rose-600 text-xs">* Required</span>
                          </label>
                          <span className="text-[10px] text-zinc-400 font-mono">Reference Number</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={bankTxRef}
                          onChange={(e) => setBankTxRef(e.target.value)}
                          placeholder="Enter TID / Reference (e.g. 20260911004928 or TID-98214)"
                          className={`w-full text-xs p-3 bg-white dark:bg-zinc-900 border rounded-xl focus:outline-none font-mono ${
                            !bankTxRef.trim()
                              ? 'border-amber-400/80 dark:border-amber-600/80 focus:border-amber-600'
                              : 'border-emerald-500 dark:border-emerald-500'
                          }`}
                        />
                      </div>

                      {/* Payment Proof Upload Component (REQUIRED) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <UploadCloud className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>Payment Screenshot</span>
                            <span className="text-rose-600 text-xs">* Required</span>
                          </label>
                          <span className="text-[10px] text-zinc-400">
                            JPG, PNG, WebP (Max 10MB)
                          </span>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProofFileChange}
                          className="hidden"
                        />

                        {paymentProof ? (
                          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <img
                                src={paymentProof}
                                alt="Receipt preview"
                                className="w-14 h-14 object-cover rounded-lg border border-emerald-300 dark:border-emerald-700 shrink-0"
                              />
                              <div className="truncate">
                                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                                  {paymentProofName || 'Payment Screenshot Attached'}
                                </p>
                                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Screenshot verified ready for upload
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200 hover:underline cursor-pointer"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentProof(null);
                                  setPaymentProofName(null);
                                  if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition shrink-0 cursor-pointer"
                                title="Remove screenshot"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-amber-300 dark:border-amber-700/80 hover:border-amber-500 rounded-2xl p-5 text-center cursor-pointer transition bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40"
                          >
                            <UploadCloud className="w-7 h-7 mx-auto text-amber-600 dark:text-amber-400 mb-2" />
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              Upload Payment Screenshot / Transfer Receipt
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              Tap to select or take a photo of your transfer confirmation
                            </p>
                          </div>
                        )}

                        <div className="flex items-start gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                          <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            Bank transfer orders are created with status <strong>Pending Verification</strong>. Our accounts team verifies your TID and screenshot before dispatching.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Optional Order Instructions */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
              Special Delivery Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Call before arrival, leave parcel at gate with security..."
              className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        {/* Right Column: Order Review & Packages */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
            <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">Order Breakdown</h2>

            {/* Vendor Consignment Packages */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Consignment Packages ({Object.keys(packagesByVendor).length})
              </span>
              {Object.entries(packagesByVendor).map(([vId, pkg]: [string, { vendorName: string; items: typeof items }]) => (
                <div
                  key={vId}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span>Package from: {pkg.vendorName}</span>
                    <span>{pkg.items.length} item(s)</span>
                  </div>
                  {pkg.items.map((it) => (
                    <div key={it.id} className="py-1 border-b border-zinc-200/50 dark:border-zinc-700/50 last:border-b-0 space-y-0.5">
                      <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[170px]">{it.quantity}x {it.product.name}</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          Rs. {(it.unitPrice * it.quantity).toLocaleString()}
                        </span>
                      </div>
                      {(it.selectedColor || it.selectedVariation?.color || (it.selectedVariation && it.selectedVariation.type !== 'size' && !it.selectedVariation.size && it.selectedVariation.name)) && (
                        <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400">
                          Color: {it.selectedColor || it.selectedVariation?.color || it.selectedVariation?.name}
                        </p>
                      )}
                      {(it.selectedSize || it.selectedVariation?.size || it.selectedVariants?.['Size'] || (it.selectedVariation && it.selectedVariation.type === 'size' && it.selectedVariation.name)) && (
                        <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                          Size: {it.selectedSize || it.selectedVariation?.size || it.selectedVariants?.['Size'] || it.selectedVariation?.name}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-400 font-mono">
                        SKU: {it.selectedVariation?.sku || it.product.sku}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Discount ({couponCode})</span>
                  <span>- Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-zinc-500">
                <span>Delivery</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">FREE</span>
                  ) : (
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">Rs. 250</span>
                  )}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                {shippingFee === 0 ? 'Free Delivery on orders of Rs. 5,000 or more.' : 'Standard Delivery: Rs. 250'}
              </div>

              <div className="flex justify-between items-center text-zinc-500 pt-1">
                <span>Cashback</span>
                <span>
                  {isOnlineEligible ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      7% — Credited within 24 hours
                    </span>
                  ) : (
                    <span className="text-zinc-400">Not applicable</span>
                  )}
                </span>
              </div>
              {isOnlineEligible && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  Eligible Cashback: Rs. {cashbackAmount.toLocaleString()} (credited within 24 hours)
                </div>
              )}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-base font-bold text-zinc-950 dark:text-zinc-50">
                <span>Total Payable</span>
                <span className="font-serif">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Submit Order Button */}
            <button
              type="submit"
              disabled={isSubmitting || (paymentMethod === 'bank_transfer' && (!bankTxRef.trim() || !paymentProof))}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Processing Order in Pakistan...'
                  : paymentMethod === 'bank_transfer'
                  ? 'Submit Payment Proof & Place Order'
                  : 'Confirm & Place Order (COD)'}
              </span>
            </button>

            {paymentMethod === 'bank_transfer' && (!bankTxRef.trim() || !paymentProof) && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 text-center font-medium bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200 dark:border-amber-800/50">
                ⚠️ Bank Transfer requires both Transaction ID (TID) and payment screenshot before submission.
              </p>
            )}

            <div className="pt-2 text-center text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted 256-Bit SSL Checkout</span>
              </div>
              <p>By placing this order you agree to Fawnic&apos;s Terms & Shipping Policy.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
