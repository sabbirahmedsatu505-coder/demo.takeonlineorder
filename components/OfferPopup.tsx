'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Offer = {
  id: string; title: string; message: string | null;
  image_url: string | null; button_text: string; button_link: string;
  discount_type: string; discount_value: number; applies_to: string;
};

export default function OfferPopup() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [index, setIndex] = useState(0);
  const [dismissedAll, setDismissedAll] = useState(false);
  const startedScroll = useRef(false);

  useEffect(() => {
    const dismissedSession = sessionStorage.getItem('dismissed-offers-session');
    if (dismissedSession === '1') {
      setDismissedAll(true);
      return;
    }

    supabase
      .from('offers')
      .select('id, title, message, image_url, button_text, button_link, discount_type, discount_value, applies_to')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setOffers(data);
      });
  }, []);

  // Any scroll or touch-move while a popup is showing dismisses the whole sequence,
  // not just the current one — per the requested behavior.
  useEffect(() => {
    if (offers.length === 0 || dismissedAll) return;

    function handleInteraction() {
      if (startedScroll.current) return;
      startedScroll.current = true;
      dismissEverything();
    }

    window.addEventListener('scroll', handleInteraction, { passive: true });
    window.addEventListener('touchmove', handleInteraction, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('touchmove', handleInteraction);
    };
  }, [offers, dismissedAll]);

  function dismissEverything() {
    sessionStorage.setItem('dismissed-offers-session', '1');
    setDismissedAll(true);
  }

  function handleClose() {
    if (index < offers.length - 1) {
      setIndex(i => i + 1); // slide to the next offer automatically
    } else {
      dismissEverything();
    }
  }

  if (offers.length === 0 || dismissedAll) return null;

  const offer = offers[index];

  const discountLabel =
    offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` :
    offer.discount_type === 'fixed' ? `$${offer.discount_value.toFixed(2)} OFF` :
    null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden relative">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-white bg-black/30 rounded-full w-7 h-7 flex items-center justify-center z-10"
          aria-label="Close"
        >
          &times;
        </button>
        {offer.image_url && (
          <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url('${offer.image_url}')` }} />
        )}
        <div className="p-6 text-center">
          {discountLabel && (
            <p className="text-3xl font-extrabold text-brand mb-1">{discountLabel}</p>
          )}
          <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
          {offer.message && <p className="text-gray-600 text-sm mb-5">{offer.message}</p>}
          <Link
            href={offer.button_link}
            onClick={handleClose}
            className="inline-block bg-brand text-white px-6 py-2.5 rounded-full font-semibold hover:bg-brand-dark transition"
          >
            {offer.button_text}
          </Link>
        </div>
        {offers.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-4">
            {offers.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-brand' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
