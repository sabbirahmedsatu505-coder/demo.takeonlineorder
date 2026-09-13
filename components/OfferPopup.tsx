'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Offer = {
  id: string; title: string; message: string | null;
  image_url: string | null; button_text: string; button_link: string;
  discount_type: string; discount_value: number; applies_to: string;
  min_order_amount: number;
};

const SCOPE_LABEL: Record<string, string> = {
  pickup: 'COLLECTION ORDER',
  delivery: 'DELIVERY ORDER',
  both: 'ORDER',
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
      .select('id, title, message, image_url, button_text, button_link, discount_type, discount_value, applies_to, min_order_amount')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setOffers(data);
      });
  }, []);

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
      setIndex(i => i + 1);
    } else {
      dismissEverything();
    }
  }

  if (offers.length === 0 || dismissedAll) return null;

  const offer = offers[index];
  const hasDiscount = offer.discount_type === 'percentage' || offer.discount_type === 'fixed';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="relative max-w-md w-full rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-white bg-black/40 rounded-full w-8 h-8 flex items-center justify-center z-20 hover:bg-black/60 transition"
          aria-label="Close"
        >
          &times;
        </button>

        {hasDiscount ? (
          <DiscountOfferCard offer={offer} onAction={handleClose} />
        ) : (
          <SimpleOfferCard offer={offer} onAction={handleClose} />
        )}

        {offers.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {offers.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// The bold "GET 20% OFF" style card — used automatically whenever an offer has a real discount.
function DiscountOfferCard({ offer, onAction }: { offer: Offer; onAction: () => void }) {
  const numberLabel = offer.discount_type === 'percentage'
    ? `${offer.discount_value}%`
    : `$${offer.discount_value.toFixed(2)}`;

  const scopeLabel = SCOPE_LABEL[offer.applies_to] || 'ORDER';

  return (
    <div className="relative min-h-[300px] flex items-end text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: offer.image_url ? `url('${offer.image_url}')` : 'linear-gradient(135deg, #2b2b2b, #111)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />

      <div className="relative z-10 p-6 pb-10 max-w-[75%]">
        <p className="text-2xl font-extrabold italic tracking-wide" style={{ color: '#f5b942' }}>
          GET
        </p>
        <p
          className="text-5xl font-extrabold italic leading-none mb-1"
          style={{ color: '#f5b942', textShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}
        >
          {numberLabel} OFF
        </p>
        <p className="text-lg font-bold mb-3">
          ON YOUR <span style={{ color: '#f5b942' }}>{scopeLabel}</span>
        </p>
        {offer.message && (
          <p className="text-sm text-gray-200 mb-5">{offer.message}</p>
        )}
        {offer.min_order_amount > 0 && (
          <p className="text-xs text-gray-300 mb-4">
            Minimum order ${offer.min_order_amount.toFixed(2)}
          </p>
        )}
        <Link
          href={offer.button_link}
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-2.5 rounded-full font-bold hover:from-red-700 hover:to-red-600 transition"
        >
          {offer.button_text} <span aria-hidden>›</span>
        </Link>
      </div>
    </div>
  );
}

// Plain informational popup (no discount) — same as before, for things like "Sign up for offers."
function SimpleOfferCard({ offer, onAction }: { offer: Offer; onAction: () => void }) {
  return (
    <div className="bg-white">
      {offer.image_url && (
        <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url('${offer.image_url}')` }} />
      )}
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold mb-2 text-black">{offer.title}</h3>
        {offer.message && <p className="text-gray-600 text-sm mb-5">{offer.message}</p>}
        <Link
          href={offer.button_link}
          onClick={onAction}
          className="inline-block bg-brand text-white px-6 py-2.5 rounded-full font-semibold hover:bg-brand-dark transition"
        >
          {offer.button_text}
        </Link>
      </div>
    </div>
  );
}
