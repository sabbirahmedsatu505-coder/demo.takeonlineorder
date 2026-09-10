'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/review', label: 'Review' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/contact-us', label: 'Contact Us' },
];

export default function Sidebar({ siteName, logoUrl }: { siteName: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* MOBILE: small hamburger button, fixed top-left, logo next to it */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b flex items-center gap-3 px-4 py-3">
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
      <aside className="hidden md:flex md:flex-col w-52 shrink-0 border-r min-h-screen sticky top-0 px-6 py-8 bg-white">
        <Link href="/" className="mb-10">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-12" />
          ) : (
            <span className="font-bold text-lg text-brand">{siteName}</span>
          )}
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
    </>
  );
}
