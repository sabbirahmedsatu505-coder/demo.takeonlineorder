'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RequireAuth from '@/lib/require-auth';
import AdminNav from '../admin-nav';

type Offer = {
  id: string; title: string; message: string | null; image_url: string | null;
  button_text: string; button_link: string; is_active: boolean;
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
  const [saving, setSaving] = useState(false);

  async function loadOffers() {
    const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    setOffers(data || []);
  }

  useEffect(() => { loadOffers(); }, []);

  async function createOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    setSaving(true);
    await supabase.from('offers').insert({
      title, message, button_text: buttonText, button_link: buttonLink, is_active: false,
    });
    setTitle(''); setMessage(''); setButtonText('Order Now'); setButtonLink('/menu');
    setSaving(false);
    loadOffers();
  }

  async function toggleActive(offer: Offer) {
    // Only one offer active at a time — turn off all others first
    if (!offer.is_active) {
      await supabase.from('offers').update({ is_active: false }).neq('id', offer.id);
    }
    await supabase.from('offers').update({ is_active: !offer.is_active }).eq('id', offer.id);
    loadOffers();
  }

  async function deleteOffer(id: string) {
    if (!confirm('Delete this offer?')) return;
    await supabase.from('offers').delete().eq('id', id);
    loadOffers();
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Popup Offers</h1>
      <p className="text-sm text-gray-500 mb-6">
        Only one offer can be "Active" at a time — that's the one customers see as a popup
        when they visit the homepage.
      </p>

      <form onSubmit={createOffer} className="border rounded-xl p-4 space-y-3 mb-8">
        <h2 className="font-semibold">Create New Offer</h2>
        <input
          placeholder="Title — e.g. 20% Off Today Only" value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Message — e.g. Use code SAVE20 at checkout" value={message}
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
