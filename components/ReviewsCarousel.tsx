'use client';

import { useRef, useEffect } from 'react';

type Review = { id: string; customer_name: string; rating: number; review_text: string };

export default function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || reviews.length === 0) return;

    const interval = setInterval(() => {
      if (pausedRef.current) return;
      const cardWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 16
        : 280;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [reviews.length]);

  function scrollByCard(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    pausedRef.current = true;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 16
      : 280;
    el.scrollBy({ left: cardWidth * direction, behavior: 'smooth' });
    setTimeout(() => { pausedRef.current = false; }, 4000);
  }

  if (reviews.length === 0) return null;

  return (
    <div>
      <div
        ref={scrollRef}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onTouchStart={() => { pausedRef.current = true; }}
        onTouchEnd={() => { setTimeout(() => { pausedRef.current = false; }, 3000); }}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
      >
        {reviews.map(review => (
          <div
            key={review.id}
            className="shrink-0 w-72 snap-start bg-white border rounded-2xl shadow-sm p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold shrink-0">
                {review.customer_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{review.customer_name}</p>
                <div className="text-yellow-400 text-sm leading-none">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{review.review_text}</p>
          </div>
        ))}
      </div>

      {reviews.length > 1 && (
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={() => scrollByCard(-1)}
            className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition"
            aria-label="Previous review"
          >
            ‹
          </button>
          <button
            onClick={() => scrollByCard(1)}
            className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition"
            aria-label="Next review"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
