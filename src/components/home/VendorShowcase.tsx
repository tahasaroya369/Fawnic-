import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Store, Star, ArrowRight, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import type { Vendor } from '../../types.js';

interface VendorShowcaseProps {
  onNavigate: (route: string, param?: any) => void;
}

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'vdr_fawnic',
    name: 'FAWNIC Atelier',
    tagline: 'Master Leathercraft & Heritage Binders',
    description: 'Our in-house flagship atelier dedicated to vegetable-tanned full-grain cowhides, hand-burnished edges, and lifetime durability.',
    category: 'Leather Goods & Heritage Sets',
    logo: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 142,
    productsCount: 11,
    badge: 'Flagship Atelier',
    verified: true,
    origin: 'Karachi, Pakistan',
  },
  {
    id: 'vdr_vanguard',
    name: 'Vanguard Horlogerie',
    tagline: 'Independent Mechanical Watchmakers',
    description: 'Specializing in hand-assembled automatic chronographs, anti-reflective sapphire crystals, and surgical 316L steel.',
    category: 'Luxury Horology & Timepieces',
    logo: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1200&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviewCount: 34,
    productsCount: 2,
    badge: 'Independent Watchmaker',
    verified: true,
    origin: 'Geneva & Lahore',
  },
  {
    id: 'vdr_sainthonore',
    name: 'Atelier Saint-Honoré',
    tagline: 'Master Bagmakers & Luggage Guild',
    description: 'Architectural weekender duffels, briefcases, and travel luggage cut from continuous oiled pull-up leather hides.',
    category: 'Travel Bags & Briefcases',
    logo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&auto=format&fit=crop&q=80',
    rating: 4.95,
    reviewCount: 46,
    productsCount: 2,
    badge: 'Master Bagmaker',
    verified: true,
    origin: 'Florence & Sialkot',
  },
  {
    id: 'vdr_aethelgard',
    name: 'Aethelgard Watchmakers',
    tagline: 'Artisanal Dual-Time & Dress Calibers',
    description: 'Heritage mid-century timepieces featuring guilloché textured dials, heat-blued hands, and full-grain calfskin straps.',
    category: 'Dress Watches & Mechanical',
    logo: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 21,
    productsCount: 1,
    badge: 'Artisan Horologist',
    verified: true,
    origin: 'Zurich & Islamabad',
  },
];

export const VendorShowcase: React.FC<VendorShowcaseProps> = ({ onNavigate }) => {
  const [vendors, setVendors] = useState<Vendor[]>(DEFAULT_VENDORS);

  useEffect(() => {
    fetch('/api/products/vendors')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Vendor[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setVendors(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleVisitStore = (vendor: Vendor) => {
    // Navigate to shop with vendor filter or search
    onNavigate('shop', { search: vendor.name });
  };

  return (
    <section id="vendors" className="py-20 bg-stone-100/70 dark:bg-stone-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold tracking-wider uppercase mb-3">
            <Store className="w-3.5 h-3.5" />
            <span>Curated Artisan Network</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 dark:text-stone-50 tracking-tight">
            Discover Our Vendors
          </h2>

          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
            FAWNIC curates independent watchmakers, leather ateliers, and bespoke bagmakers. Every artisan upholds non-negotiable standards of raw material purity, ethical labor, and lifetime repairability.
          </p>
        </div>

        {/* Vendors Grid with 3D Depth Card Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {vendors.map((vendor, idx) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              className="group flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5"
            >
              {/* Store Banner */}
              <div className="relative h-36 w-full overflow-hidden bg-stone-900">
                <img
                  src={vendor.banner}
                  alt={`${vendor.name} banner`}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

                {/* Badge */}
                {vendor.badge && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-950/80 border border-stone-700/80 text-amber-300 text-[10px] font-semibold tracking-wide backdrop-blur-md">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{vendor.badge}</span>
                  </span>
                )}
              </div>

              {/* Vendor Avatar & Header */}
              <div className="px-5 pt-0 pb-5 flex-1 flex flex-col relative">
                {/* Overlapping Logo */}
                <div className="relative -mt-9 mb-3 flex items-end justify-between">
                  <div className="w-16 h-16 rounded-xl border-2 border-white dark:border-stone-900 overflow-hidden shadow-md bg-stone-800 shrink-0">
                    <img
                      src={vendor.logo}
                      alt={vendor.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* Rating Pill */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{vendor.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-stone-500">({vendor.reviewCount})</span>
                  </div>
                </div>

                {/* Name & Verification */}
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-serif font-bold text-stone-950 dark:text-stone-50 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {vendor.name}
                  </h3>
                  {vendor.verified && (
                    <span title="Verified Artisan">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    </span>
                  )}
                </div>

                {/* Origin / Category */}
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                  <span>{vendor.origin || 'Pakistan'}</span>
                </div>

                {/* Tagline / Description */}
                <p className="mt-3 text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3 font-light">
                  {vendor.description}
                </p>

                {/* Specialty Pill */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    {vendor.category}
                  </span>
                  <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                    {vendor.productsCount} items
                  </span>
                </div>

                {/* Action CTA */}
                <div className="mt-4 pt-1">
                  <button
                    id={`visit-vendor-${vendor.id}`}
                    onClick={() => handleVisitStore(vendor)}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-100 dark:text-stone-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer group/btn"
                  >
                    <span>VISIT STORE</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
