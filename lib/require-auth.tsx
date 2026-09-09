'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Wrap any /admin page's content with this to require a logged-in session.
// Usage: <RequireAuth>{...page content...}</RequireAuth>
export default function RequireAuth({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/admin/login');
      } else {
        setAuthed(true);
      }
      setChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/admin/login');
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  if (!checked) return <div className="p-8 text-center text-gray-400">Checking login…</div>;
  if (!authed) return null;
  return <>{children}</>;
}
