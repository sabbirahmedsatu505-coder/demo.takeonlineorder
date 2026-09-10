import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/lib/site-settings';
import OfferPopup from '@/components/OfferPopup';
import MostOrderedCarousel from '@/components/MostOrderedCarousel';
import Sidebar from '@/components/Sidebar';

export const revalidate = 60;

async function getHomeData() {
  const { data: content } = await supabase.from('homepage_content').select('*').eq('id', 1).single();
  const { data: features } = await supabase.from('homepage_features').select('*').order('sort_order');
  const { data: featured } = await supabase
    .from('menu_items')
    .select('id, name, description, base_price, image_url')
    .eq('is_available', true)
    .order('sort_order')
    .limit(6);
  return { content, features: features || [], featured: featured || [] };
}

export default async function HomePage() {
  const { content, features, featured } = await getHomeData();
  const { siteName, logoUrl } = await getSiteSettings();

  const heroHeadline = content?.hero_headline || 'Fresh, Fast, Made to Order';
  const heroSubtext = content?.hero_subtext || 'Order directly from us — no delivery-app markup, just great food.';
  const heroImage = content?.hero_image_url || '/hero.jpg';
  const storyTitle = content?.story_title || 'Our Story';
  const storyText = content?.story_text || "Replace this with your restaurant's story.";
  const hoursLines = (content?.hours_text || '').split('\n').filter(Boolean);
  const locationText = content?.location_text || '123 High Street, Your City';
  const phoneText = content?.phone_text || '+44 0000 000000';
  const hygieneRating = content?.hygiene_rating || null;
  const hygieneRatingUrl = content?.hygiene_rating_url || null;

  return (
    <div className="flex">
      <Sidebar siteName={siteName} logoUrl={logoUrl} />

      <main className="flex-1 min-w-0">
        <OfferPopup />

        {/* HERO */}
        <section className="relative h-[70vh] min-h-[420px] flex items-center justify-center text-center text-white">
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

            {hygieneRating !== null && (
              <a
                href={hygieneRatingUrl || 'https://ratings.food.gov.uk'}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex flex-col items-center bg-white text-black rounded-lg overflow-hidden shadow-lg text-xs"
              >
                <span className="bg-green-700 text-white px-3 py-1 font-semibold tracking-wide">
                  FOOD HYGIENE RATING
                </span>
                <span className="flex items-center gap-1 px-3 py-2">
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <span
                      key={n}
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold border ${
                        n === hygieneRating ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-300'
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </span>
                <span className="bg-green-700 text-white px-3 py-0.5 text-[10px]">VIEW GOOD</span>
              </a>
            )}
          </div>
        </section>

        {/* MOST ORDERED */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Most Ordered</h2>
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

        {/* HOURS + LOCATION */}
        <section id="hours" className="max-w-6xl mx-auto px-4 py-16 grid sm:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-3">Hours</h3>
            <ul className="text-gray-700 space-y-1 text-sm">
              {hoursLines.map((line: string, i: number) => <li key={i}>{line}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3">Location</h3>
            <p className="text-gray-700 text-sm">{locationText}</p>
            <p className="text-gray-700 text-sm">{phoneText}</p>
          </div>
        </section>

        <footer className="border-t py-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
