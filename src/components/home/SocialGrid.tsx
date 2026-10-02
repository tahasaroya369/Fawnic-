import React from 'react';
import { Instagram, Heart, ExternalLink } from 'lucide-react';

export const SocialGrid: React.FC = () => {
  const posts = [
    {
      id: 'ig_01',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=85',
      likes: '1.4k',
      caption: 'Bench notes: edge-burnishing with natural carnauba wax on our 9oz steerhide.',
    },
    {
      id: 'ig_02',
      image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=85',
      likes: '2.1k',
      caption: 'The Chronomaster mechanical caliber ticking at 28,800 beats per hour.',
    },
    {
      id: 'ig_03',
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=85',
      likes: '980',
      caption: 'Sovereign bifold in Deep Havana Brown. Hand-buffed and ready for dispatch.',
    },
    {
      id: 'ig_04',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=85',
      likes: '1.8k',
      caption: 'Weekend voyageur packed for Northern Pakistan mountain escapes.',
    },
    {
      id: 'ig_05',
      image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=85',
      likes: '1.2k',
      caption: 'Solid forged brass buckles waiting for assembly with 35mm dress steerhide.',
    },
  ];

  return (
    <section className="py-20 bg-stone-100/60 dark:bg-stone-950 transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-widest text-amber-700 dark:text-amber-400 uppercase mb-2">
          <Instagram className="w-3.5 h-3.5" />
          <span>Follow Our Atelier</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 dark:text-stone-50">
          @fawnic.atelier
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
          Daily workbench snapshots, caliber assembly, and customer styling moments.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-900 shadow-xs cursor-pointer"
            >
              <img
                src={post.image}
                alt="FAWNIC Atelier Social Post"
                loading="lazy"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-stone-950/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{post.likes}</span>
                  </div>
                  <Instagram className="w-4 h-4 text-stone-300" />
                </div>

                <p className="text-[11px] text-stone-200 line-clamp-3 leading-snug font-light">
                  {post.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
