'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Offer = {
  id: string; title: string; message: string | null;
  image_url: string | null; button_text: string; button_link: string;
  discount_type: string; discount_value: number; applies_to: string;
  min_order_amount: number; max_order_amount: number | null;
};

const SCOPE_LABEL: Record<string, string> = {
  pickup: 'On Collection',
  delivery: 'On Delivery',
  both: 'On Collection & Delivery',
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
      .select('id, title, message, image_url, button_text, button_link, discount_type, discount_value, applies_to, min_order_amount, max_order_amount')
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="relative max-w-sm w-full">
        {hasDiscount ? (
          <DiscountOfferCard offer={offer} onAction={handleClose} onClose={handleClose} />
        ) : (
          <SimpleOfferCard offer={offer} onAction={handleClose} onClose={handleClose} />
        )}

        {offers.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {offers.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Clean white card style — used automatically whenever an offer has a real discount.
// Builds the sentence dynamically from whatever the admin set: minimum spend,
// discount amount, and which order type it applies to.
function DiscountOfferCard({
  offer, onAction, onClose,
}: { offer: Offer; onAction: () => void; onClose: () => void }) {
  const numberLabel = offer.discount_type === 'percentage'
    ? `${offer.discount_value}%`
    : `$${offer.discount_value.toFixed(2)}`;

  const scopeLabel = SCOPE_LABEL[offer.applies_to] || '';

  const hasMin = offer.min_order_amount > 0;
  const hasMax = offer.max_order_amount != null;

  let rangeText = '';
  if (hasMin && hasMax) rangeText = `Order $${offer.min_order_amount.toFixed(2)}–$${offer.max_order_amount!.toFixed(2)} &`;
  else if (hasMin) rangeText = `Order Over $${offer.min_order_amount.toFixed(2)} &`;
  else if (hasMax) rangeText = `Order Under $${offer.max_order_amount!.toFixed(2)} &`;

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden text-center relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl leading-none"
        aria-label="Close"
      >
        &times;
      </button>

      <div className="pt-8 pb-2 px-6">
        <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl" aria-hidden>🎁</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Special Offer!</h3>
        <p className="text-gray-700 text-base leading-snug">
          {rangeText && <>{rangeText} </>}
          Get <span className="font-bold text-brand">{numberLabel} OFF</span>
        </p>
        {scopeLabel && <p className="text-gray-500 text-sm mt-1">({scopeLabel})</p>}
        {offer.message && <p className="text-gray-500 text-sm mt-3">{offer.message}</p>}
      </div>

      <div className="p-6 pt-4">
        <Link
          href={offer.button_link}
          onClick={onAction}
          className="block bg-brand text-white py-3 rounded-full font-semibold hover:bg-brand-dark transition"
        >
          {offer.button_text}
        </Link>
      </div>
    </div>
  );
}

// Plain informational popup (no discount) — for things like "Sign up for offers."
function SimpleOfferCard({
  offer, onAction, onClose,
}: { offer: Offer; onAction: () => void; onClose: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-white bg-black/30 rounded-full w-7 h-7 flex items-center justify-center z-10"
        aria-label="Close"
      >
        &times;
      </button>
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
