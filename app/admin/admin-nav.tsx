'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/homepage', label: 'Homepage' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/offers', label: 'Offers' },
];

export default function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 shrink-0 bg-white border-r min-h-screen flex flex-col px-4 py-6">
        <div className="px-2 mb-8 font-bold text-lg">Admin</div>
        <nav className="flex flex-col gap-1">
          {LINKS.map(link => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-100 text-left"
        >
          Log out
        </button>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
