import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { printOrder } from '@/lib/print';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// This route is the real source of truth for "payment succeeded" — card payments
// can succeed/fail asynchronously (3D Secure, bank delays), so never mark an order
// paid purely from client-side code.
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata.order_id;

    await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'paid', status: 'preparing' })
      .eq('id', orderId);

    // Auto-print the kitchen receipt now that payment is confirmed.
    await printOrder(orderId);

    // TODO: trigger SMS/email confirmation here (Twilio/Resend)
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata.order_id;
    await supabaseAdmin.from('orders').update({ payment_status: 'unpaid' }).eq('id', orderId);
  }

  return NextResponse.json({ received: true });
}
