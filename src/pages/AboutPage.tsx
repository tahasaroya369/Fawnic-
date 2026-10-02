import React from 'react';
import {
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  Feather,
  HeartHandshake,
  Compass,
  Layers,
  Scissors,
  Eye,
  ArrowRight,
  Gem,
  Clock,
  ThumbsUp,
  Flame,
} from 'lucide-react';

interface AboutPageProps {
  onNavigate: (route: string, param?: any) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-20">
        
        {/* =================================================== */}
        {/* 1. HERO SECTION */}
        {/* =================================================== */}
        <div className="relative rounded-3xl p-8 sm:p-16 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-800/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-5">
            <span className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              The FAWNIC Heritage & Philosophy
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-100 leading-tight">
              Crafted for Those Who Appreciate the Details
            </h1>
            <p className="text-xs sm:text-base text-stone-300 leading-relaxed max-w-2xl mx-auto font-light">
              Born in Karachi, FAWNIC was founded to revive the quiet power of bespoke men’s leathercraft. Rejecting synthetic disposability, we handcraft heirlooms meant to travel with you for decades.
            </p>
          </div>
        </div>

        {/* =================================================== */}
        {/* 2. THE FAWNIC STORY */}
        {/* =================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                Atelier Origins
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 dark:text-stone-50">
                The FAWNIC Story
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              In an era dominated by synthetic fast-fashion and plastic-coated leathers that deteriorate in months, FAWNIC was conceived with a single unyielding standard: to hand-tool genuine full-grain steerhides into minimalist men&apos;s accessories of world-class distinction.
            </p>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Every wallet, cardholder, and brass-buckled belt that departs our Karachi bench is an ode to patience, tactile honesty, and mathematical geometry. We believe the items you touch multiple times each day should feel reassuring, substantial, and quietly luxurious.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">100%</h4>
                <p className="text-[11px] text-stone-500 font-medium">Full-Grain Hides</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">1-Year</h4>
                <p className="text-[11px] text-stone-500 font-medium">Craft Guarantee</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">10k+</h4>
                <p className="text-[11px] text-stone-500 font-medium">Gentlemen Served</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-4/3 rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xl bg-stone-900">
              <img
                src="/assets/images/hero_mens_wallet_1790447762128.jpg"
                alt="Leather Crafting Atelier"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 p-6 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-950 text-white border border-stone-800 shadow-2xl hidden sm:block max-w-xs">
              <p className="text-xs italic text-stone-300">
                &ldquo;True luxury does not shout; it endures in the warmth of natural grain and precise saddle stitches.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* =================================================== */}
        {/* 3. OUR CRAFT — 5 STEP SEQUENTIAL PROCESS */}
        {/* =================================================== */}
        <div className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Metier & Technique
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 dark:text-stone-50">
              Our 5-Stage Craftsmanship Process
            </h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              From raw steerhide inspection to hand-burnished beeswax sealing, nothing is outsourced or rushed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center font-mono">
                01
              </div>
              <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
                Leather Selection
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                Hand-grading cowhides and vegetable-tanned steerhides. We inspect thickness, pull-up density, and natural grain texture.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center font-mono">
                02
              </div>
              <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
                Precision Cutting
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                Single-pass clicker dies and straight razors ensure millimeter precision for smooth, clean edge profiles.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center font-mono">
                03
              </div>
              <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
                Reinforced Stitching
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                Sewn with industrial bonded nylon thread and dual-pass backstitching on pocket stress-points so seams never unravel.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center font-mono">
                04
              </div>
              <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
                Beeswax Burnishing
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                Raw edges are hand-beveled, rubbed with organic beeswax and friction-burnished into glass-smooth waterproof rims.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center font-mono">
                05
              </div>
              <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
                Quality Inspection
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                A 12-point audit verifying pocket tolerances, card fit, leather hydration, and enclosure into our magnetic gift box.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================== */}
        {/* 4. WHAT MAKES FAWNIC DIFFERENT */}
        {/* =================================================== */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Distinction
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 dark:text-stone-50">
              What Sets FAWNIC Apart
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
                <Gem className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100">
                Premium Materials
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                100% full-grain leather, solid brass hardware, and heavy-duty bonded threads. Zero polyurethane, zero bonded paper backing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100">
                Thoughtful Design
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Slim silhouette profiles engineered specifically for Pakistani currency sizes, CNIC cards, and everyday front-pocket comfort.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100">
                Quality Craftsmanship
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Constructed by master leather artisans in Karachi with decades of bench experience in bespoke luggage and saddlery.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100">
                Customer Experience
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Nationwide COD, 7-day hassle-free returns, fast WhatsApp concierge support, and luxury gift-ready unboxing.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================== */}
        {/* 5. PRODUCT PHILOSOPHY & THE PATINA PROMISE */}
        {/* =================================================== */}
        <div className="bg-gradient-to-br from-amber-950 via-stone-950 to-stone-950 text-white rounded-3xl p-8 sm:p-12 border border-amber-900/40 shadow-2xl space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider font-mono">
              Material Philosophy
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
              The Patina Promise: Beautiful with Age
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Unlike mass-manufactured accessories that peel and fray with use, full-grain leather is living, porous, and dynamic. Every scratch, sun exposure, and friction marks polish the natural oils into a warm, lustrous patina that reflects your personal journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-800">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-amber-300 font-serif">Longevity over Disposable Trends</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                We design classic, understated silhouettes that remain in style for decades, freeing you from seasonal wardrobe turnover.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-amber-300 font-serif">Function-First Ergonomics</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Tested card access pull-tabs, quick-swipe exterior thumb slots, and unencumbered bifold hinges.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-amber-300 font-serif">Clean Modern Aesthetics</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Free of garish billboard branding. Our subtle blind-debossed hallmark certifies authenticity with discreet refinement.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================== */}
        {/* 6. MEN'S COLLECTION SHOWCASE */}
        {/* =================================================== */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                Atelier Editions
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 dark:text-stone-50">
                Men&apos;s Collection Showcase
              </h2>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => onNavigate('shop')}
              className="group rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs cursor-pointer hover:border-amber-500/50 transition-all"
            >
              <div className="aspect-4/3 overflow-hidden bg-stone-100 dark:bg-stone-800">
                <img
                  src="https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80"
                  alt="Bifold Wallets"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 space-y-1">
                <h4 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
                  Bifold & Trifold Wallets
                </h4>
                <p className="text-[11px] text-stone-500">Full-grain steerhide, RFID protection</p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('shop')}
              className="group rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs cursor-pointer hover:border-amber-500/50 transition-all"
            >
              <div className="aspect-4/3 overflow-hidden bg-stone-100 dark:bg-stone-800">
                <img
                  src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80"
                  alt="Card Holders"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 space-y-1">
                <h4 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
                  Minimalist Card Sleeves
                </h4>
                <p className="text-[11px] text-stone-500">Ultra-slim 6-card front pocket carry</p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('shop')}
              className="group rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs cursor-pointer hover:border-amber-500/50 transition-all"
            >
              <div className="aspect-4/3 overflow-hidden bg-stone-100 dark:bg-stone-800">
                <img
                  src="https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80"
                  alt="Belts"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 space-y-1">
                <h4 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
                  Solid Brass Buckle Belts
                </h4>
                <p className="text-[11px] text-stone-500">Single piece 9oz harness leather</p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('shop')}
              className="group rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs cursor-pointer hover:border-amber-500/50 transition-all"
            >
              <div className="aspect-4/3 overflow-hidden bg-stone-100 dark:bg-stone-800">
                <img
                  src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80"
                  alt="Accessories"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 space-y-1">
                <h4 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
                  Valet Trays & Key Fobs
                </h4>
                <p className="text-[11px] text-stone-500">Everyday carry desk accessories</p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================== */}
        {/* 7. FINAL CTA */}
        {/* =================================================== */}
        <div className="text-center space-y-6 py-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 dark:text-stone-50">
            Ready to Experience Genuine Atelier Craftsmanship?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
            Discover our collection of handcrafted men&apos;s wallets, cardholders, and belts. Delivered nationwide with Cash on Delivery and a 7-day satisfaction guarantee.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('shop')}
              className="px-8 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Explore the Collection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <span>Contact Concierge</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
