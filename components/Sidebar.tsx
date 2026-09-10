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
      {/* MOBILE TOP BAR */}
      <div className="sm:hidden sticky top-0 z-40 bg-white border-b flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8" />
          ) : (
            <span className="font-bold text-brand">{siteName}</span>
          )}
        </Link>
        <button onClick={() => setOpen(true)} className="text-2xl leading-none" aria-label="Open menu">
          ☰
        </button>
      </div>

      {/* MOBILE SLIDE-OUT MENU */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
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

      {/* DESKTOP FIXED LEFT SIDEBAR */}
      <aside className="hidden sm:flex flex-col w-52 shrink-0 border-r min-h-screen sticky top-0 px-6 py-8">
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
