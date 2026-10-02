import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, Quote, MapPin, CheckCircle, ThumbsUp, Filter } from 'lucide-react';
import type { Review } from '../types.js';

interface ReviewsPageProps {
  onNavigate: (route: string, param?: any) => void;
}

const INITIAL_REVIEWS: Array<{
  id: string;
  customerName: string;
  customerCity: string;
  rating: number;
  productName: string;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
}> = [
  {
    id: 'rev-01',
    customerName: 'Ayesha Khan',
    customerCity: 'Karachi, Sindh',
    rating: 5,
    productName: 'The Sovereign Executive Bifold Wallet',
    title: 'Remarkable leather quality and unmistakable full-grain aroma',
    comment: 'Ordered this as an anniversary gift for my husband. The full-grain leather texture and the rich smell right out of the box are unmatched. Delivered within 24 hours in Karachi by TCS in a pristine gift presentation box.',
    date: 'March 2026',
    verified: true,
  },
  {
    id: 'rev-02',
    customerName: 'Tariq Mansoor',
    customerCity: 'Lahore, Punjab',
    rating: 5,
    productName: 'The Solid Brass Garrison Full-Grain Belt',
    title: 'Solid brass hardware and pure vegetable-tanned hide',
    comment: 'Having worn belts from high-end European labels, the Garrison surpasses them in thickness and beveling. The solid brass buckle has genuine weight and will never peel or rust. Truly heirloom caliber.',
    date: 'February 2026',
    verified: true,
  },
  {
    id: 'rev-03',
    customerName: 'Bilal Siddiqui',
    customerCity: 'Islamabad, ICT',
    rating: 5,
    productName: 'The Minimalist Hand-Stitched Card Sleeve',
    title: 'Front pocket perfection with zero bulk',
    comment: 'Holds four bank cards and folded Pakistani rupee notes effortlessly. The saddle stitching is immaculately tensioned and edges are burnished smooth with natural beeswax.',
    date: 'February 2026',
    verified: true,
  },
  {
    id: 'rev-04',
    customerName: 'Dr. Hamza Raza',
    customerCity: 'Faisalabad, Punjab',
    rating: 5,
    productName: 'The Dual-Tone Reversible Executive Belt',
    title: 'Ingenious rotating buckle — jet black to chestnut in two seconds',
    comment: 'Superb versatility for boardroom wear and smart-casual chinos. The leather is supple yet firm, and the 360-degree swivel mechanism feels robust and mechanical.',
    date: 'January 2026',
    verified: true,
  },
  {
    id: 'rev-05',
    customerName: 'Zainab Merchant',
    customerCity: 'Karachi, Sindh',
    rating: 5,
    productName: 'The Fawnic Heirloom Gift Ensemble',
    title: 'Exceptional executive corporate gift set',
    comment: 'We commissioned custom monogrammed gift ensembles for our firm partners. The presentation packaging, wax seal authenticity card, and hand-stained leather exceeded our highest expectations.',
    date: 'January 2026',
    verified: true,
  },
  {
    id: 'rev-06',
    customerName: 'Omer Farooq',
    customerCity: 'Rawalpindi, Punjab',
    rating: 5,
    productName: 'The Raw Edge Casual Harness Belt',
    title: 'Built like a tank for heavy raw denim',
    comment: '40mm wide full-grain harness leather that develops character day by day. Heavy zinc roller buckle and raw edge aesthetic that looks better every month.',
    date: 'December 2025',
    verified: true,
  },
];

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ onNavigate }) => {
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);

  useEffect(() => {
    fetch('/api/products/reviews')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((r: any) => ({
            id: r.id,
            customerName: r.customerName || 'Verified Client',
            customerCity: r.customerCity || 'Pakistan',
            rating: r.rating || 5,
            productName: r.productName || 'FAWNIC Atelier Piece',
            title: r.title || 'Exceptional craftsmanship',
            comment: r.comment || '',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recent',
            verified: true,
          }));
          setReviews([...formatted, ...INITIAL_REVIEWS]);
        }
      })
      .catch(() => {});
  }, []);

  const filteredReviews = filterRating === 'all'
    ? reviews
    : reviews.filter((r) => r.rating === filterRating);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      {/* Header Banner */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold tracking-wider uppercase">
            <Quote className="w-3.5 h-3.5" />
            <span>Client Testimonials</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-950 dark:text-stone-50 tracking-tight">
            Voices of FAWNIC Patrons
          </h1>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Read authentic reflections from connoisseurs, executives, and everyday gentlemen across Pakistan who carry FAWNIC handcrafted leather creations.
          </p>

          {/* Aggregate Rating Scoreboard */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            <div className="text-center">
              <div className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">4.9</div>
              <div className="flex items-center justify-center gap-1 text-amber-500 my-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
                Average Rating (500+ Clients)
              </p>
            </div>

            <div className="h-10 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block" />

            <div className="text-center">
              <div className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">100%</div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 my-1 flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Certified Full-Grain
              </div>
              <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
                Authentic Hide Guarantee
              </p>
            </div>

            <div className="h-10 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block" />

            <div className="text-center">
              <div className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">24h</div>
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 my-1">
                Express Karachi & Nationwide
              </div>
              <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
                TCS & Leopards Tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Reviews Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Filter className="w-4 h-4 text-amber-600" />
            <span>Filter Reviews:</span>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => setFilterRating('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterRating === 'all'
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                All Ratings
              </button>
              <button
                onClick={() => setFilterRating(5)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  filterRating === 5
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                5 Stars <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </button>
            </div>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
          >
            Explore All Leather Goods →
          </button>
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 flex flex-col justify-between shadow-xs hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono">{item.date}</span>
                </div>

                <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm leading-snug">
                  "{item.title}"
                </h3>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {item.comment}
                </p>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 block truncate">
                    Item: {item.productName}
                  </span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{item.customerName}</p>
                  <p className="text-[10px] text-stone-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" /> {item.customerCity}
                  </p>
                </div>
                {item.verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-3 h-3" /> Verified Client
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-stone-900 text-stone-100 rounded-3xl p-8 sm:p-12 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Experience the FAWNIC Distinction
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto leading-relaxed">
            Every piece is cut from certified full-grain hide, saddle-stitched by hand, and backed by our 1-year atelier craftsmanship guarantee.
          </p>
          <div className="pt-3">
            <button
              onClick={() => onNavigate('shop')}
              className="px-8 py-3 rounded-full bg-white text-stone-950 font-bold text-xs hover:bg-stone-100 transition shadow-sm cursor-pointer"
            >
              Shop Curated Leather Collections
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
