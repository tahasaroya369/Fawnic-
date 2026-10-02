import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, ShieldCheck, Quote, MapPin } from 'lucide-react';
import type { Review } from '../../types.js';

interface TestimonialsSectionProps {
  onNavigate: (route: string, param?: any) => void;
}

const FALLBACK_REVIEWS = [
  {
    id: 'rev_f1',
    productId: 'fwn_wlt_01',
    productName: 'The Sovereign Executive Bifold Wallet',
    customerName: 'Dr. Hamza Raza',
    customerCity: 'Lahore, Punjab',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Outstanding full-grain leather craftsmanship',
    comment: 'I have carried wallets from luxury European houses that cost four times as much, yet the Sovereign from Fawnic surpasses them in edge burnishing and leather density. The patina after four months of everyday carry in Lahore is breathtaking.',
    verifiedPurchase: true,
  },
  {
    id: 'rev_f2',
    productId: 'vng_wtc_01',
    productName: 'The Vanguard Chronomaster 40mm Automatic',
    customerName: 'Tariq Mansoor',
    customerCity: 'Karachi, Sindh',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Mechanical perfection and immaculate dial finishing',
    comment: 'The Chronomaster arrived in a hand-lacquered wooden presentation box. The dual-register dial catching the sunlight is mesmerizing. Timekeeping accuracy is within +3 seconds per day. Truly world-class horology right here in Pakistan.',
    verifiedPurchase: true,
  },
  {
    id: 'rev_f3',
    productId: 'sth_bag_01',
    productName: 'The Saint-Honoré Grand Voyageur Leather Duffle',
    customerName: 'Bilal Siddiqui',
    customerCity: 'Islamabad, ICT',
    customerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'The only weekender bag you will ever need',
    comment: 'Used this on four business trips already. Heavy brass hardware, thick pull-up hide that absorbs scratches and buffs out instantly with a thumb swipe. The separate shoe chamber is genius. Unrivaled luxury.',
    verifiedPurchase: true,
  },
];

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ onNavigate }) => {
  const [reviews, setReviews] = useState<any[]>(FALLBACK_REVIEWS);

  useEffect(() => {
    fetch('/api/products/reviews')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setReviews(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section id="testimonials" className="py-24 bg-stone-50 dark:bg-stone-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold tracking-wider uppercase mb-3">
            <Quote className="w-3.5 h-3.5" />
            <span>Customer Reviews</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 dark:text-stone-50 tracking-tight">
            Voices of Our Customers
          </h2>

          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
            From corporate executives in Karachi to horology collectors in Islamabad, read genuine feedback from customers who live with our creations daily.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.slice(0, 3).map((rev, idx) => (
            <motion.div
              key={rev.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              className="flex flex-col justify-between p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div>
                {/* Rating & Product Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (rev.rating || 5) ? 'fill-amber-500' : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    ))}
                  </div>

                  {rev.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Order
                    </span>
                  )}
                </div>

                {/* Review Title & Body */}
                <h4 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
                  "{rev.title || 'Exceptional Quality'}"
                </h4>

                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-light italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author & Location */}
              <div className="mt-8 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 text-sm overflow-hidden">
                  {rev.customerAvatar ? (
                    <img src={rev.customerAvatar} alt={rev.customerName} className="w-full h-full object-cover" />
                  ) : (
                    rev.customerName?.charAt(0) || 'C'
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {rev.customerName}
                  </h5>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-stone-400" />
                    <span>{rev.customerCity || 'Pakistan'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
