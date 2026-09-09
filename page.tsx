import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import OfferPopup from '@/components/OfferPopup';

export const revalidate = 60; // refresh featured items every 60s

async function getFeaturedItems() {
  const { data } = await supabase
    .from('menu_items')
    .select('id, name, description, base_price, image_url')
    .eq('is_available', true)
    .order('sort_order')
    .limit(6);
  return data || [];
}

export default async function HomePage() {
  const featured = await getFeaturedItems();

  return (
    <main>
      <OfferPopup />

      {/* NAV */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <span className="text-xl font-bold text-brand">Your Restaurant</span>
          <nav className="hidden sm:flex gap-6 text-sm font-medium">
            <Link href="/menu">Menu</Link>
            <Link href="#story">Our Story</Link>
            <Link href="#hours">Hours &amp; Location</Link>
          </nav>
          <Link
            href="/menu"
            className="bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-dark transition"
          >
            Order Now
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative h-[70vh] min-h-[420px] flex items-center justify-center text-center text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 px-4 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Fresh, Fast, Made to Order
          </h1>
          <p className="text-lg mb-6 opacity-90">
            Order directly from us — no delivery-app markup, just great food.
          </p>
          <Link
            href="/menu"
            className="inline-block bg-brand px-8 py-3 rounded-full font-semibold text-lg hover:bg-brand-dark transition"
          >
            View Menu &amp; Order
          </Link>
        </div>
      </section>

      {/* MOST ORDERED */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Most Ordered</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {featured.map(item => (
            <Link
              key={item.id}
              href={`/menu?item=${item.id}`}
              className="group block rounded-xl overflow-hidden border hover:shadow-lg transition"
            >
              <div
                className="h-36 bg-gray-100 bg-cover bg-center"
                style={{ backgroundImage: item.image_url ? `url('${item.image_url}')` : undefined }}
              />
              <div className="p-3">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-brand font-bold text-sm">${item.base_price.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Our Story</h2>
          <p className="text-gray-700 leading-relaxed">
            Replace this with your restaurant's story — what makes your food, your process,
            your ingredients different. Short, sensory, specific sells better than generic copy.
          </p>
        </div>
      </section>

      {/* HOURS + LOCATION */}
      <section id="hours" className="max-w-6xl mx-auto px-4 py-16 grid sm:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-3">Hours</h3>
          <ul className="text-gray-700 space-y-1 text-sm">
            <li>Mon–Thu: 11am – 9pm</li>
            <li>Fri–Sat: 11am – 10pm</li>
            <li>Sun: 12pm – 8pm</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3">Location</h3>
          <p className="text-gray-700 text-sm">123 High Street, Your City</p>
          <p className="text-gray-700 text-sm">+44 0000 000000</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Your Restaurant. All rights reserved.</p>
      </footer>
    </main>
  );
}
