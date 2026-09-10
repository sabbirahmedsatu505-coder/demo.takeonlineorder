'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';

type Item = { id: string; name: string; base_price: number; image_url: string | null };

export default function MostOrderedCarousel({ items }: { items: Item[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;

    const interval = setInterval(() => {
      if (pausedRef.current) return;

      const cardWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 16 // + gap
        : 200;

      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;

      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div
      ref={scrollRef}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onTouchStart={() => { pausedRef.current = true; }}
      onTouchEnd={() => { setTimeout(() => { pausedRef.current = false; }, 3000); }}
      className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
    >
      {items.map(item => (
        <Link key={item.id} href={`/menu?item=${item.id}`} className="group shrink-0 w-44 snap-start">
          <div className="relative w-44 h-44 rounded-2xl overflow-hidden bg-gray-100">
            <div
              className="w-full h-full bg-cover bg-center group-hover:scale-105 transition"
              style={{ backgroundImage: item.image_url ? `url('${item.image_url}')` : undefined }}
            />
            <div className="absolute bottom-2 right-2 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center text-xl font-bold leading-none">
              +
            </div>
          </div>
          <p className="font-semibold text-sm mt-2">{item.name}</p>
          <p className="text-gray-600 text-sm">${item.base_price.toFixed(2)}</p>
        </Link>
      ))}
      {items.length === 0 && (
        <p className="text-gray-400 text-sm">No items yet — add some in the menu manager.</p>
      )}
    </div>
  );
}
