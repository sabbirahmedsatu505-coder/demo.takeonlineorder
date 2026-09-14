import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/lib/site-settings';
import OfferPopup from '@/components/OfferPopup';
import MostOrderedCarousel from '@/components/MostOrderedCarousel';
import ReviewsCarousel from '@/components/ReviewsCarousel';
import Sidebar from '@/components/Sidebar';

export const revalidate = 60;

async function getHomeData() {
  const { data: content } = await supabase.from('homepage_content').select('*').eq('id', 1).single();
  const { data: features } = await supabase.from('homepage_features').select('*').order('sort_order');
  const { data: featured } = await supabase
    .from('menu_items')
    .select('id, name, description, base_price, image_url, is_popular')
    .eq('is_available', true)
    .order('sort_order')
    .limit(6);

  // Real "Top 3 This Week" — based on actual order history, not just menu order.
  // Falls back to the first 3 featured items if there's no order history yet.
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: recentItems } = await supabase
    .from('order_items')
    .select('menu_item_id, quantity, orders!inner(created_at)')
    .gte('orders.created_at', oneWeekAgo.toISOString());

  let topThree: NonNullable<typeof featured> = [];
  if (recentItems && recentItems.length > 0) {
    const counts: Record<string, number> = {};
    for (const row of recentItems as any[]) {
      if (!row.menu_item_id) continue;
      counts[row.menu_item_id] = (counts[row.menu_item_id] || 0) + row.quantity;
    }
    const topIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    if (topIds.length > 0) {
      const { data: topItems } = await supabase
        .from('menu_items')
        .select('id, name, description, base_price, image_url, is_popular')
        .in('id', topIds)
        .eq('is_available', true);
      // Keep them ordered by popularity, not database order
      topThree = topIds
        .map(id => topItems?.find(i => i.id === id))
        .filter(Boolean) as NonNullable<typeof featured>;
    }
  }
  if (topThree.length === 0) topThree = (featured || []).slice(0, 3);

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, review_text')
    .eq('is_active', true)
    .order('sort_order');

  return { content, features: features || [], featured: featured || [], topThree, reviews: reviews || [] };
}

export default async function HomePage() {
  const { content, features, featured, topThree, reviews } = await getHomeData();
  const { siteName, logoUrl } = await getSiteSettings();

  const heroHeadline = content?.hero_headline || 'Fresh, Fast, Made to Order';
  const heroSubtext = content?.hero_subtext || 'Order directly from us — no delivery-app markup, just great food.';
  const heroImage = content?.hero_image_url || '/hero.jpg';
  const storyTitle = content?.story_title || 'Our Story';
  const storyText = content?.story_text || "Replace this with your restaurant's story.";
  const hoursLines = (content?.hours_text || '').split('\n').filter(Boolean);
  const locationText = content?.location_text || '123 High Street, Your City';
  const phoneText = content?.phone_text || '+44 0000 000000';
  const hygieneRatingImageUrl = content?.hygiene_rating_image_url || null;
  const reviewsHeading = content?.reviews_heading || 'Customers are Awesome';
  const reviewsSubtitle = content?.reviews_subtitle || 'Customer reviews';
  const emailText = content?.email_text || null;

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar siteName={siteName} logoUrl={logoUrl} />

      <main className="flex-1 min-w-0">
        <OfferPopup />

        {/* HERO */}
        <section className="relative min-h-[480px] py-20 flex items-center justify-center text-center text-white">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage}')` }} />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 px-4 max-w-2xl flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{heroHeadline}</h1>
            <p className="text-lg mb-6 opacity-90">{heroSubtext}</p>
            <Link
              href="/menu"
              className="inline-block bg-brand px-8 py-3 rounded-full font-semibold text-lg hover:bg-brand-dark transition"
            >
              View Menu &amp; Order
            </Link>

            {hygieneRatingImageUrl && (
              <a
                href={hygieneRatingImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block"
              >
                <img src={hygieneRatingImageUrl} alt="Food Hygiene Rating" className="h-24" />
              </a>
            )}
          </div>
        </section>

        {/* TOP 3 THIS WEEK */}
        {topThree.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pt-8 pb-8 text-center">
            <p className="text-2xl sm:text-3xl font-black mb-1">
              Top <span className="text-red-600">3</span> This Week
            </p>
            <p className="text-gray-500 text-sm mb-8">Our most loved dishes right now</p>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
              {topThree.map(item => (
                <Link key={item.id} href={`/menu?item=${item.id}`} className="text-left group">
                  <div
                    className="w-full aspect-square rounded-2xl shadow-sm bg-cover bg-center bg-gray-100 group-hover:opacity-90 group-hover:shadow-md transition"
                    style={{ backgroundImage: item.image_url ? `url('${item.image_url}')` : undefined }}
                  />
                  <p className="font-semibold text-sm mt-2 truncate">{item.name}</p>
                  {item.is_popular && (
                    <p className="text-xs text-orange-600 font-semibold">🔥 Popular</p>
                  )}
                  {item.description && (
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  )}
                </Link>
              ))}
            </div>
            <div className="bg-gray-50 rounded-2xl py-4 px-2 flex flex-nowrap justify-center gap-x-3 sm:gap-x-6 text-[11px] sm:text-sm font-black text-gray-700">
              <span>Fresh Ingredients</span>
              <span className="text-gray-300">|</span>
              <span>Secure Payment</span>
              <span className="text-gray-300">|</span>
              <span>Direct Ordering</span>
            </div>
          </section>
        )}

        {/* MOST ORDERED */}
        <section className="max-w-6xl mx-auto px-4 pt-2 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black">Most Ordered</h2>
            <Link
              href="/menu"
              className="flex items-center gap-1 border rounded-full px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition"
            >
              View menu <span aria-hidden>›</span>
            </Link>
          </div>
          <MostOrderedCarousel items={featured} />
        </section>

        {/* ALTERNATING FEATURE SHOWCASE */}
        {features.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-8 space-y-16">
            {features.map((feature, idx) => {
              const imageOnRight = idx % 2 === 1;
              return (
                <div
                  key={feature.id}
                  className={`flex flex-col sm:flex-row items-center gap-8 ${imageOnRight ? 'sm:flex-row-reverse' : ''}`}
                >
                  {feature.image_url && (
                    <div className="w-full sm:w-1/2">
                      <div
                        className="w-full h-64 sm:h-80 rounded-2xl bg-cover bg-center"
                        style={{ backgroundImage: `url('${feature.image_url}')` }}
                      />
                    </div>
                  )}
                  <div className="w-full sm:w-1/2">
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    {feature.description && <p className="text-gray-600 leading-relaxed">{feature.description}</p>}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* STORY */}
        <section id="story" className="bg-gray-50 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">{storyTitle}</h2>
            <p className="text-gray-700 leading-relaxed">{storyText}</p>
          </div>
        </section>

        {/* CUSTOMER REVIEWS */}
        {reviews.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pt-16 pb-8">
            <p className="text-brand text-sm font-semibold mb-1">{reviewsSubtitle}</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-8">{reviewsHeading}</h2>
            <ReviewsCarousel reviews={reviews} />
          </section>
        )}

        {/* HOURS + LOCATION + CONTACT */}
        <section id="hours" className="max-w-6xl mx-auto px-4 pt-8 pb-16 grid sm:grid-cols-3 gap-10">
          <div>
            <h3 className="text-xl font-bold mb-4">Hours</h3>
            <table className="w-full text-sm text-gray-700">
              <tbody>
                {hoursLines.map((line: string, i: number) => {
                  const match = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[:\s]*(.*)$/i);
                  const day = match ? match[1] : line;
                  const time = match ? match[2].trim() : '';
                  return (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 pr-2 font-medium">{day}</td>
                      <td className="py-1.5 text-right text-gray-500">{time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Location</h3>
            <p className="text-gray-700 text-sm whitespace-pre-line mb-4">{locationText}</p>
            <div className="w-full h-40 rounded-xl overflow-hidden border bg-gray-100">
              <iframe
                title="Restaurant location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(locationText)}&output=embed`}
              />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <a
              href={`tel:${phoneText.replace(/[^0-9+]/g, '')}`}
              className="block text-gray-700 text-sm mb-2 hover:text-brand transition"
            >
              {phoneText}
            </a>
            {emailText && (
              <a
                href={`mailto:${emailText}`}
                className="block text-gray-700 text-sm hover:text-brand transition"
              >
                {emailText}
              </a>
            )}
          </div>
        </section>

        <footer className="border-t py-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
