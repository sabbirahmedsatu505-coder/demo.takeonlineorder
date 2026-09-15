import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/lib/site-settings';
import Sidebar from '@/components/Sidebar';

export const revalidate = 60;

export default async function ReviewPage() {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, review_text')
    .eq('is_active', true)
    .order('sort_order');

  const { data: content } = await supabase
    .from('homepage_content')
    .select('reviews_heading, reviews_subtitle')
    .eq('id', 1)
    .single();

  const { siteName, logoUrl } = await getSiteSettings();
  const heading = content?.reviews_heading || 'Customers are Awesome';
  const subtitle = content?.reviews_subtitle || 'Customer reviews';

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar siteName={siteName} logoUrl={logoUrl} />
      <main className="flex-1 min-w-0 max-w-5xl mx-auto px-4 py-10">
        <p className="text-brand text-sm font-semibold mb-1">{subtitle}</p>
        <h1 className="text-3xl sm:text-4xl font-black mb-8">{heading}</h1>

        {(!reviews || reviews.length === 0) && (
          <p className="text-gray-400 text-sm">No reviews yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews?.map(review => (
            <div key={review.id} className="bg-white border rounded-2xl shadow-sm p-5">
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
      </main>
    </div>
  );
}
