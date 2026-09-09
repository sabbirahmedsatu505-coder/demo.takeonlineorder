'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Offer = {
  id: string; title: string; message: string | null;
  image_url: string | null; button_text: string; button_link: string;
};

export default function OfferPopup() {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't re-show the same offer to someone who already dismissed it this session
    const dismissedId = sessionStorage.getItem('dismissed-offer');

    supabase
      .from('offers')
      .select('id, title, message, image_url, button_text, button_link')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.id !== dismissedId) setOffer(data);
      });
  }, []);

  function handleDismiss() {
    if (offer) sessionStorage.setItem('dismissed-offer', offer.id);
    setDismissed(true);
  }

  if (!offer || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white bg-black/30 rounded-full w-7 h-7 flex items-center justify-center z-10"
        >
          &times;
        </button>
        {offer.image_url && (
          <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url('${offer.image_url}')` }} />
        )}
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
          {offer.message && <p className="text-gray-600 text-sm mb-5">{offer.message}</p>}
          <Link
            href={offer.button_link}
            onClick={handleDismiss}
            className="inline-block bg-brand text-white px-6 py-2.5 rounded-full font-semibold hover:bg-brand-dark transition"
          >
            {offer.button_text}
          </Link>
        </div>
      </div>
    </div>
  );
}
