'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError('Incorrect email or password.');
    router.push('/admin/menu');
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-2xl font-bold mb-6 text-center">Staff Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-brand text-white py-3 rounded-full font-semibold disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </main>
  );
}
