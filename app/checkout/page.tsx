'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { getBestDiscount, ActiveDiscount } from '@/lib/discounts';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements, PaymentElement, useStripe, useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const { lines, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [discount, setDiscount] = useState<{ amount: number; offer: ActiveDiscount | null }>({ amount: 0, offer: null });

  useEffect(() => {
    let cancelled = false;
    getBestDiscount(orderType, subtotal).then(({ discountAmount, appliedOffer }) => {
      if (!cancelled) setDiscount({ amount: discountAmount, offer: appliedOffer });
    });
    return () => { cancelled = true; };
  }, [orderType, subtotal]);

  const total = Math.max(subtotal - discount.amount, 0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name || !phone) return setError('Name and phone are required.');
    if (orderType === 'delivery' && !address) return setError('Delivery address is required.');
    if (lines.length === 0) return setError('Your cart is empty.');

    setLoading(true);
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          customer_email: email,
          order_type: orderType,
          payment_method: paymentMethod,
          delivery_address: orderType === 'delivery' ? address : null,
          lines,
          subtotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start order');

      if (paymentMethod === 'cash') {
        // No Stripe step needed — order is placed, goes straight to the kitchen as "unpaid / pay on pickup"
        clearCart();
        router.push(`/order-confirmed?order=${data.orderId}`);
        return;
      }

      // Card — continue to Stripe payment step
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm orderId={orderId!} onSuccess={() => { clearCart(); router.push(`/order-confirmed?order=${orderId}`); }} />
      </Elements>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="mb-4 flex gap-3">
        {(['pickup', 'delivery'] as const).map(type => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`flex-1 py-2 rounded-full border font-medium capitalize transition ${
              orderType === type ? 'bg-brand text-white border-brand' : 'border-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <p className="text-sm font-semibold mb-2">Payment Method</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`flex-1 py-2 rounded-full border font-medium transition ${
              paymentMethod === 'card' ? 'bg-brand text-white border-brand' : 'border-gray-300'
            }`}
          >
            Pay by Card
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 py-2 rounded-full border font-medium transition ${
              paymentMethod === 'cash' ? 'bg-brand text-white border-brand' : 'border-gray-300'
            }`}
          >
            Cash {orderType === 'pickup' ? 'on Pickup' : 'on Delivery'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        {orderType === 'delivery' && (
          <input
            placeholder="Delivery address" value={address} onChange={e => setAddress(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        )}

        <div className="border-t pt-4 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount.amount > 0 && discount.offer && (
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>{discount.offer.title}</span>
              <span>−${discount.amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {paymentMethod === 'cash' && (
          <p className="text-xs text-gray-500 bg-gray-50 border rounded-lg p-3">
            You'll pay ${total.toFixed(2)} in cash when your order is {orderType === 'pickup' ? 'picked up' : 'delivered'}.
          </p>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-white py-3 rounded-full font-semibold hover:bg-brand-dark transition disabled:opacity-50"
        >
          {loading
            ? 'Placing order…'
            : paymentMethod === 'cash'
              ? 'Place Order — Pay with Cash'
              : 'Continue to Payment'}
        </button>
      </form>
    </main>
  );
}

function PaymentForm({ orderId, onSuccess }: { orderId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');

    const { error: payError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/order-confirmed?order=${orderId}` },
      redirect: 'if_required',
    });

    if (payError) {
      setError(payError.message || 'Payment failed.');
      setSubmitting(false);
    } else {
      onSuccess();
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Payment</h1>
      <form onSubmit={handlePay} className="space-y-4">
        <PaymentElement />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="w-full bg-brand text-white py-3 rounded-full font-semibold hover:bg-brand-dark transition disabled:opacity-50"
        >
          {submitting ? 'Processing…' : 'Pay Now'}
        </button>
      </form>
    </main>
  );
}
