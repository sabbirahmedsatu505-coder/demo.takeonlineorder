'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RequireAuth from '@/lib/require-auth';
import AdminNav from '../admin-nav';

type Offer = {
  id: string; title: string; message: string | null; image_url: string | null;
  button_text: string; button_link: string; is_active: boolean;
  discount_type: 'percentage' | 'fixed' | 'none'; discount_value: number;
  applies_to: 'delivery' | 'pickup' | 'both';
};

export default function AdminOffersPage() {
  return (
    <RequireAuth>
      <AdminNav>
        <OffersEditor />
      </AdminNav>
    </RequireAuth>
  );
}

function OffersEditor() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttonText, setButtonText] = useState('Order Now');
  const [buttonLink, setButtonLink] = useState('/menu');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState('');
  const [appliesTo, setAppliesTo] = useState<'delivery' | 'pickup' | 'both'>('both');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadOffers() {
    const { data, error } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    if (error) { setError(`Could not load offers: ${error.message}`); return; }
    setOffers(data || []);
  }

  useEffect(() => { loadOffers(); }, []);

  async function createOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    setSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('offers').insert({
      title, message, button_text: buttonText, button_link: buttonLink,
      is_active: false,
      discount_type: discountType,
      discount_value: discountValue ? parseFloat(discountValue.replace(/[^0-9.]/g, '')) : 0,
      applies_to: appliesTo,
    });

    if (insertError) {
      setError(`Could not save offer: ${insertError.message}`);
      setSaving(false);
      return;
    }

    setTitle(''); setMessage(''); setButtonText('Order Now'); setButtonLink('/menu');
    setDiscountType('none'); setDiscountValue(''); setAppliesTo('both');
    setSaving(false);
    loadOffers();
  }

  async function toggleActive(offer: Offer) {
    // Multiple offers can be active at once now — they'll cycle as a sequence of
    // popups on the site, one after another, until the customer dismisses them.
    const { error: updateError } = await supabase
      .from('offers')
      .update({ is_active: !offer.is_active })
      .eq('id', offer.id);
    if (updateError) { setError(`Could not update offer: ${updateError.message}`); return; }
    loadOffers();
  }

  async function deleteOffer(id: string) {
    if (!confirm('Delete this offer?')) return;
    const { error: deleteError } = await supabase.from('offers').delete().eq('id', id);
    if (deleteError) { setError(`Could not delete offer: ${deleteError.message}`); return; }
    loadOffers();
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Popup Offers</h1>
      <p className="text-sm text-gray-500 mb-6">
        Turn on as many offers as you like — customers will see them as a sequence of
        popups, one sliding to the next as they close each one (or the whole thing
        dismisses if they scroll/touch the page). A discount offer automatically
        reduces the order total at checkout — no code needed from the customer.
      </p>

      <form onSubmit={createOffer} className="border rounded-xl p-4 space-y-3 mb-8">
        <h2 className="font-semibold">Create New Offer</h2>
        <input
          placeholder="Title — e.g. 20% Off Today Only" value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Message — e.g. Order online and enjoy your favourite food" value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Button text" value={buttonText}
            onChange={e => setButtonText(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Button link (e.g. /menu)" value={buttonLink}
            onChange={e => setButtonLink(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t pt-3">
          <p className="text-sm font-semibold mb-2">Discount (optional)</p>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as any)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="none">No discount — just promotional</option>
              <option value="percentage">Percentage off (%)</option>
              <option value="fixed">Fixed amount off ($)</option>
            </select>
            <input
              placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 5.00'}
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              disabled={discountType === 'none'}
              className="border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
          {discountType !== 'none' && (
            <select
              value={appliesTo}
              onChange={e => setAppliesTo(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="both">Applies to both pickup and delivery</option>
              <option value="pickup">Applies to pickup/collection only</option>
              <option value="delivery">Applies to delivery only</option>
            </select>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit" disabled={saving}
          className="bg-brand text-white px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Create Offer'}
        </button>
      </form>

      <div className="space-y-3">
        {offers.map(offer => (
          <div key={offer.id} className="border rounded-xl p-4 flex justify-between items-start gap-4">
            <div>
              <p className="font-semibold">{offer.title}</p>
              {offer.message && <p className="text-sm text-gray-500">{offer.message}</p>}
              {offer.discount_type !== 'none' && (
                <p className="text-xs text-green-600 font-semibold mt-1">
                  {offer.discount_type === 'percentage' ? `${offer.discount_value}% off` : `$${offer.discount_value.toFixed(2)} off`}
                  {' · '}
                  {offer.applies_to === 'both' ? 'Pickup & Delivery' : offer.applies_to === 'pickup' ? 'Pickup only' : 'Delivery only'}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => toggleActive(offer)}
                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  offer.is_active ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {offer.is_active ? 'Active' : 'Turn On'}
              </button>
              <button onClick={() => deleteOffer(offer.id)} className="text-xs text-gray-400 underline">
                Delete
              </button>
            </div>
          </div>
        ))}
        {offers.length === 0 && <p className="text-gray-400 text-sm">No offers yet — create one above.</p>}
      </div>
    </main>
  );
}
