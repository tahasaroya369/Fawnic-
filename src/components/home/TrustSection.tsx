import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Award, Lock, Headphones } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const pillars = [
    {
      icon: <Truck className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: 'Nationwide Express Insured',
      description: 'Dispatched via TCS / Leopard with real-time SMS tracking and signature release across all cities of Pakistan.',
    },
    {
      icon: <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: 'Lifetime Craft Guarantee',
      description: 'Every full-grain leather creation carries our atelier repair pledge against structural or stitching failure.',
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: '7-Day Effortless Exchange',
      description: 'Exchange belt sizes or wallet variants smoothly with our doorstep pickup concierge in major metropolises.',
    },
    {
      icon: <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: 'Cash on Delivery & Secure Transfer',
      description: 'Pay comfortably upon physical receipt or via direct bank transfer and encrypted payment cards.',
    },
  ];

  return (
    <section className="py-16 bg-white dark:bg-stone-900 border-y border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="flex flex-col items-start p-6 rounded-2xl bg-stone-50/80 dark:bg-stone-950/60 border border-stone-200/70 dark:border-stone-800/80"
            >
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800/60 mb-4">
                {pillar.icon}
              </div>

              <h4 className="text-base font-serif font-bold text-stone-950 dark:text-stone-50 mb-1.5">
                {pillar.title}
              </h4>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-light">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
