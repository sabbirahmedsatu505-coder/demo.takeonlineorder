'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/review', label: 'Review' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/contact-us', label: 'Contact Us' },
];

type OfferBarData = { id: string; title: string; discount_type: string; discount_value: number; applies_to: string };

const APPLIES_LABEL: Record<string, string> = {
  pickup: 'On Collection',
  delivery: 'On Delivery',
  both: '',
};

export default function Sidebar({ siteName, logoUrl }: { siteName: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [offerBars, setOfferBars] = useState<OfferBarData[]>([]);
  const [barIndex, setBarIndex] = useState(0);
  const [barDismissed, setBarDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('dismissed-offer-bar') === '1') {
      setBarDismissed(true);
      return;
    }

    supabase
      .from('offers')
      .select('id, title, discount_type, discount_value, applies_to')
      .eq('is_active', true)
      .neq('discount_type', 'none')
      .order('discount_value', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setOfferBars(data);
      });
  }, []);

  // Rotate through all active discount offers, one at a time
  useEffect(() => {
    if (offerBars.length <= 1) return;
    const interval = setInterval(() => {
      setBarIndex(i => (i + 1) % offerBars.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [offerBars.length]);

  function dismissOfferBar() {
    sessionStorage.setItem('dismissed-offer-bar', '1');
    setBarDismissed(true);
  }

  const currentBar = offerBars[barIndex];
  const isMenuPage = pathname === '/menu';
  const showBar = currentBar && !barDismissed && !isMenuPage;

  const offerLabel = currentBar
    ? currentBar.discount_type === 'percentage'
      ? `${currentBar.discount_value}%`
      : `$${currentBar.discount_value.toFixed(2)}`
    : null;

  return (
    <>
      {/* MOBILE: hamburger + logo on left, Order Now on right */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="border rounded-lg w-9 h-9 flex items-center justify-center shrink-0"
            aria-label="Open menu"
          >
            ☰
          </button>
          <Link href="/" className="flex items-center">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-8" />
            ) : (
              <span className="font-bold text-brand">{siteName}</span>
            )}
          </Link>
        </div>
        <Link
          href="/menu"
          className="bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold shrink-0"
        >
          Order Now
        </Link>
      </div>
      {/* Spacer so page content isn't hidden under the fixed mobile bar */}
      <div className="md:hidden h-14" />

      {/* MOBILE SLIDE-OUT MENU */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white w-64 h-full p-6" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="text-2xl mb-6">&times;</button>
            <nav className="flex flex-col gap-5">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`text-lg ${pathname === link.href ? 'font-bold' : 'text-gray-700'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* DESKTOP: fixed left sidebar, only from md breakpoint up */}
      <aside className="hidden md:flex md:flex-col w-52 shrink-0 border-r min-h-screen sticky top-0 px-6 py-6 bg-white">
        <Link href="/" className="mb-2">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-12" />
          ) : (
            <span className="font-bold text-lg text-brand">{siteName}</span>
          )}
        </Link>
        <Link
          href="/menu"
          className="bg-brand text-white text-center px-4 py-2 rounded-full text-sm font-semibold mb-5 hover:bg-brand-dark transition"
        >
          Order Now
        </Link>
        <nav className="flex flex-col gap-5">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-base ${pathname === link.href ? 'font-bold text-black' : 'text-gray-600 hover:text-black'} transition`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* STICKY PROMO BAR — fixed at the BOTTOM, cycles through all active discount offers */}
      {showBar && (
        <div
          onClick={() => window.dispatchEvent(new CustomEvent('reopen-offers-popup'))}
          className="fixed bottom-0 left-0 right-0 z-50 bg-brand text-white flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-brand-dark transition cursor-pointer"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0" aria-hidden>🎁</span>
            <span className="min-w-0">
              <span className="block text-xs font-bold leading-tight">Special Offer!</span>
              <span className="block text-xs leading-tight truncate">
                Get {offerLabel} OFF {APPLIES_LABEL[currentBar.applies_to]} — {currentBar.title}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold underline whitespace-nowrap">Tap for details</span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissOfferBar(); }}
              className="text-white/80 hover:text-white text-lg leading-none"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </span>
        </div>
      )}
      {/* Spacer so bottom content (e.g. cart bar on menu page) isn't hidden under the promo bar */}
      {showBar && <div className="h-12" />}
    </>
  );
}
