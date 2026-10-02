import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Truck, HeadphonesIcon } from 'lucide-react';

export const FawnicStandardSection: React.FC = () => {
  const standards = [
    {
      icon: <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: 'Premium Materials',
      description: '100% full-grain hides and solid sand-cast brass hardware that only improve with age.',
      highlight: 'Zero bonded leather',
    },
    {
      icon: <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: 'Thoughtful Craftsmanship',
      description: 'Every seam, edge, and pocket is calibrated for structural integrity and effortless daily carry.',
      highlight: 'Lifetime stitch guarantee',
    },
    {
      icon: <Truck className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: 'Nationwide Delivery',
      description: 'Fast, secure insured courier dispatch across all cities in Pakistan via TCS and Leopards.',
      highlight: 'Dispatched within 24 hours',
    },
    {
      icon: <HeadphonesIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: 'Customer Support',
      description: 'Direct WhatsApp and email concierge assistance for sizing, custom orders, and inquiries.',
      highlight: '7-day hassle-free exchange',
    },
  ];

  return (
    <section className="py-20 bg-stone-100/60 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
            Uncompromising Quality
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            The FAWNIC Standard
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Our guiding commitments to authentic craftsmanship, responsible sourcing, and customer satisfaction.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {standards.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white dark:bg-stone-900 p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[11px] font-mono font-medium text-amber-700 dark:text-amber-400">
                  {item.highlight}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
