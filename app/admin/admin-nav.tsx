'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminNav() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  return (
    <div className="border-b bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/menu">Menu</Link>
          <Link href="/admin/homepage">Homepage</Link>
          <Link href="/admin/gallery">Gallery</Link>
          <Link href="/admin/offers">Offers</Link>
        </nav>
        <button onClick={handleLogout} className="text-sm text-gray-400 underline">
          Log out
        </button>
      </div>
    </div>
  );
}
