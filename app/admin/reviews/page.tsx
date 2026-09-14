'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RequireAuth from '@/lib/require-auth';
import AdminNav from '../admin-nav';

type Review = { id: string; customer_name: string; rating: number; review_text: string; is_active: boolean; sort_order: number };

export default function AdminReviewsPage() {
  return (
    <RequireAuth>
      <AdminNav>
        <ReviewsManager />
      </AdminNav>
    </RequireAuth>
  );
}

function ReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [heading, setHeading] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [savingHeading, setSavingHeading] = useState(false);

  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    const { data: reviewRows } = await supabase.from('reviews').select('*').order('sort_order');
    const { data: content } = await supabase.from('homepage_content').select('reviews_heading, reviews_subtitle').eq('id', 1).single();
    setReviews(reviewRows || []);
    if (content) {
      setHeading(content.reviews_heading || '');
      setSubtitle(content.reviews_subtitle || '');
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function saveHeading(e: React.FormEvent) {
    e.preventDefault();
    setSavingHeading(true);
    await supabase.from('homepage_content').update({ reviews_heading: heading, reviews_subtitle: subtitle }).eq('id', 1);
    setSavingHeading(false);
  }

  async function addReview(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !text) return;
    setSaving(true);
    setError('');
    const { error: insertError } = await supabase.from('reviews').insert({
      customer_name: name, rating, review_text: text, is_active: true, sort_order: reviews.length,
    });
    if (insertError) { setError(`Could not save review: ${insertError.message}`); setSaving(false); return; }
    setName(''); setRating(5); setText('');
    setSaving(false);
    loadAll();
  }

  async function toggleActive(review: Review) {
    await supabase.from('reviews').update({ is_active: !review.is_active }).eq('id', review.id);
    loadAll();
  }

  async function deleteReview(id: string) {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    loadAll();
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Customer Reviews</h1>
      <p className="text-sm text-gray-500 mb-6">
        Shows as an auto-sliding carousel on the homepage, right under "Our Story."
        Only reviews marked Active appear on the site.
      </p>

      <form onSubmit={saveHeading} className="border rounded-xl p-4 space-y-3 mb-8">
        <h2 className="font-semibold text-sm">Section Heading</h2>
        <input
          placeholder="Small label — e.g. Customer reviews" value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="Big heading — e.g. Customers are Awesome" value={heading}
          onChange={e => setHeading(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <button
          disabled={savingHeading}
          className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {savingHeading ? 'Saving…' : 'Save Heading'}
        </button>
      </form>

      <form onSubmit={addReview} className="border rounded-xl p-4 space-y-3 mb-8">
        <h2 className="font-semibold text-sm">Add Review</h2>
        <input
          placeholder="Customer name" value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm">Rating:</span>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n} type="button" onClick={() => setRating(n)}
              className={`text-xl ${n <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          placeholder="Review text" value={text}
          onChange={e => setText(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={saving}
          className="bg-brand text-white px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add Review'}
        </button>
      </form>

      <div className="space-y-3">
        {reviews.map(review => (
          <div key={review.id} className="border rounded-xl p-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-semibold text-sm">{review.customer_name}</p>
                <div className="text-yellow-400 text-sm">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <p className="text-sm text-gray-600 mt-1">{review.review_text}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(review)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    review.is_active ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {review.is_active ? 'Active' : 'Hidden'}
                </button>
                <button onClick={() => deleteReview(review.id)} className="text-xs text-gray-400 underline">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-400 text-sm">No reviews yet — add one above.</p>}
      </div>
    </main>
  );
}
