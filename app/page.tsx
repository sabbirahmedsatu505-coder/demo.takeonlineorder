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
  const facebookUrl = content?.facebook_url || null;
  const instagramUrl = content?.instagram_url || null;
  const trustBadgeImageUrl = content?.trust_badge_image_url || null;

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar siteName={siteName} logoUrl={logoUrl} />

      <main className="flex-1 min-w-0">
        <OfferPopup />

        {/* HERO */}
        <section className="relative pt-6 pb-10 flex items-center justify-center text-center text-white">
          <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url('${heroImage}')`, backgroundPosition: 'right center' }} />
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
          <section className="max-w-5xl mx-auto px-4 pt-4 pb-6 text-center">
            <p className="text-2xl sm:text-3xl font-black mb-1">
              Top <span className="text-red-600">3</span> This Week
            </p>
            <p className="text-gray-500 text-sm mb-5">Our most loved dishes right now</p>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
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
        <section className="max-w-6xl mx-auto px-4 pt-2 pb-10">
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
        <section id="story" className="bg-gray-50 py-10">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">{storyTitle}</h2>
            <p className="text-gray-700 leading-relaxed">{storyText}</p>
          </div>
        </section>

        {/* CUSTOMER REVIEWS */}
        {reviews.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
            <p className="text-brand text-sm font-semibold mb-1">{reviewsSubtitle}</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-5">{reviewsHeading}</h2>
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
                className="block text-gray-700 text-sm hover:text-brand transition mb-4"
              >
                {emailText}
              </a>
            )}

            {(facebookUrl || instagramUrl) && (
              <div className="flex gap-3 mb-6">
                {facebookUrl && (
                  <a
                    href={facebookUrl} target="_blank" rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-80"
                    style={{ backgroundColor: '#1877F2' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/>
                    </svg>
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl} target="_blank" rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-80"
                    style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 2c2.7 0 3.1 0 4.1.06 1.1.05 1.8.2 2.4.45.7.27 1.2.6 1.7 1.1.5.5.86 1 1.1 1.7.24.6.4 1.3.45 2.4.05 1 .06 1.4.06 4.1s0 3.1-.06 4.1c-.05 1.1-.2 1.8-.45 2.4-.27.7-.6 1.2-1.1 1.7-.5.5-1 .86-1.7 1.1-.6.24-1.3.4-2.4.45-1 .05-1.4.06-4.1.06s-3.1 0-4.1-.06c-1.1-.05-1.8-.2-2.4-.45-.7-.27-1.2-.6-1.7-1.1-.5-.5-.86-1-1.1-1.7-.24-.6-.4-1.3-.45-2.4C2 15.1 2 14.7 2 12s0-3.1.06-4.1c.05-1.1.2-1.8.45-2.4.27-.7.6-1.2 1.1-1.7.5-.5 1-.86 1.7-1.1.6-.24 1.3-.4 2.4-.45C8.9 2 9.3 2 12 2zm0 1.8c-2.6 0-3 0-4 .06-.9.04-1.4.18-1.7.3-.44.17-.75.37-1.08.7-.33.33-.53.64-.7 1.08-.12.3-.26.8-.3 1.7C4.2 8.6 4.2 9 4.2 12s0 3.4.06 4.36c.04.9.18 1.4.3 1.7.17.44.37.75.7 1.08.33.33.64.53 1.08.7.3.12.8.26 1.7.3 1 .06 1.4.06 4 .06s3-.0 4-.06c.9-.04 1.4-.18 1.7-.3.44-.17.75-.37 1.08-.7.33-.33.53-.64.7-1.08.12-.3.26-.8.3-1.7.06-1 .06-1.4.06-4.36s0-3.4-.06-4.36c-.04-.9-.18-1.4-.3-1.7a2.9 2.9 0 0 0-.7-1.08 2.9 2.9 0 0 0-1.08-.7c-.3-.12-.8-.26-1.7-.3-1-.06-1.4-.06-4-.06zM12 6.9a5.1 5.1 0 1 1 0 10.2 5.1 5.1 0 0 1 0-10.2zm0 1.8a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6zm5.3-2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* SECURE PAYMENTS TRUST BADGE — uses your uploaded image if set, otherwise a built-in version */}
            {trustBadgeImageUrl ? (
              <img src={trustBadgeImageUrl} alt="Secure Payments — powered by Stripe" className="max-w-[220px]" />
            ) : (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-black shrink-0">
                    <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 0 1 6 0v3H9zm3 4a1.5 1.5 0 0 1 1 2.6V17a1 1 0 1 1-2 0v-1.4A1.5 1.5 0 0 1 12 13z"/>
                  </svg>
                  <span className="text-lg font-extrabold text-black leading-tight">Secure Payments</span>
                </div>
                <div className="bg-black rounded-lg px-4 py-2 inline-block mb-3">
                  <span className="text-white text-sm">Powered by <span className="font-bold italic">stripe</span></span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold text-white bg-red-600 rounded-md px-2.5 py-1.5">
                    Master<span className="text-orange-300">card</span>
                  </span>
                  <span className="text-[11px] font-extrabold italic text-blue-700 bg-white border rounded-md px-2.5 py-1.5">
                    VISA
                  </span>
                  <span className="text-[11px] font-extrabold text-white bg-orange-500 rounded-md px-2.5 py-1.5">
                    DISCOVER
                  </span>
                  <span className="text-[11px] font-extrabold text-white bg-blue-600 rounded-md px-2.5 py-1.5">
                    AMEX
                  </span>
                </div>
              </div>
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
