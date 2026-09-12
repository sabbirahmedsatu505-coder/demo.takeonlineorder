import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { printOrder } from '@/lib/print';
import { getBestDiscount } from '@/lib/discounts';

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

    // Recompute the discount server-side — never trust a discount amount sent
    // from the browser, since that would let anyone edit it before submitting.
    const { discountAmount, appliedOffer } = await getBestDiscount(order_type, subtotal);
    const total = Math.max(subtotal - discountAmount, 0);

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
        discount_amount: discountAmount,
        applied_offer_id: appliedOffer?.id || null,
        applied_offer_title: appliedOffer?.title || null,
        total,
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
      return NextResponse.json({ orderId: order.id, paymentMethod: 'cash', total, discountAmount });
    }

    // 3b. CARD ORDER — create Stripe PaymentIntent for the DISCOUNTED total,
    // printing happens later via webhook once payment_intent.succeeded fires.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // charge the discounted amount, not the raw subtotal
      currency: 'usd', // change per client market: 'gbp', 'aed', etc.
      metadata: { order_id: order.id },
    });

    await supabaseAdmin
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', order.id);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, orderId: order.id, total, discountAmount });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Something went wrong' }, { status: 500 });
  }
}
