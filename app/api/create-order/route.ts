import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { printOrder } from '@/lib/print';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customer_name, customer_phone, customer_email,
      order_type, delivery_address, lines, subtotal,
      payment_method, // 'card' | 'cash'
    } = body;

    if (!customer_name || !customer_phone || !lines?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const isCash = payment_method === 'cash';

    // 1. Create the order.
    // Cash orders go straight to "preparing" (staff accept it in person / on pickup),
    // card orders stay "pending" until the Stripe webhook confirms payment.
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name,
        customer_phone,
        customer_email,
        order_type,
        delivery_address,
        payment_method: isCash ? 'cash' : 'card',
        status: isCash ? 'preparing' : 'pending',
        payment_status: isCash ? 'unpaid' : 'unpaid', // cash stays "unpaid" until collected in person
        subtotal,
        total: subtotal,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Insert order line items
    const orderItems = lines.map((line: any) => {
      const optTotal = line.options.reduce((s: number, o: any) => s + o.price_delta, 0);
      const unitPrice = line.basePrice + optTotal;
      return {
        order_id: order.id,
        menu_item_id: line.menuItemId,
        item_name: line.name,
        quantity: line.quantity,
        unit_price: unitPrice,
        selected_options: line.options,
        line_total: unitPrice * line.quantity,
      };
    });

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    // 3a. CASH ORDER — no Stripe needed. Print immediately, order is placed.
    if (isCash) {
      await printOrder(order.id);
      return NextResponse.json({ orderId: order.id, paymentMethod: 'cash' });
    }

    // 3b. CARD ORDER — create Stripe PaymentIntent, printing happens later via webhook
    // once payment_intent.succeeded fires (see app/api/stripe-webhook/route.ts).
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(subtotal * 100),
      currency: 'usd', // change per client market: 'gbp', 'aed', etc.
      metadata: { order_id: order.id },
    });

    await supabaseAdmin
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', order.id);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, orderId: order.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Something went wrong' }, { status: 500 });
  }
}
