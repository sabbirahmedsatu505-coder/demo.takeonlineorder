import Link from 'next/link';

export default function OrderConfirmedPage({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <main className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
      <p className="text-gray-600 mb-1">Thanks for your order — we're getting started on it.</p>
      {searchParams.order && (
        <p className="text-gray-400 text-sm mb-6">Order ID: {searchParams.order.slice(0, 8)}</p>
      )}
      <Link href="/" className="inline-block bg-brand text-white px-6 py-3 rounded-full font-semibold">
        Back to Home
      </Link>
    </main>
  );
}
