import { supabase } from './supabase';

export type ActiveDiscount = {
  id: string;
  title: string;
  discount_type: 'percentage' | 'fixed' | 'none';
  discount_value: number;
  applies_to: 'delivery' | 'pickup' | 'both';
  min_order_amount: number;
  max_order_amount: number | null;
};

// Finds the best active discount offer that applies to the given order type
// (pickup or delivery) and falls within its min/max order amount range, and
// returns the discount to subtract from subtotal. A max of null/empty means
// "no upper limit." If multiple qualify, the largest wins — discounts never stack.
export async function getBestDiscount(
  orderType: 'pickup' | 'delivery',
  subtotal: number
): Promise<{ discountAmount: number; appliedOffer: ActiveDiscount | null }> {
  const { data: offers } = await supabase
    .from('offers')
    .select('id, title, discount_type, discount_value, applies_to, min_order_amount, max_order_amount')
    .eq('is_active', true)
    .neq('discount_type', 'none');

  if (!offers || offers.length === 0) {
    return { discountAmount: 0, appliedOffer: null };
  }

  const eligible = (offers as ActiveDiscount[]).filter(o => {
    const scopeMatches = o.applies_to === 'both' || o.applies_to === orderType;
    const meetsMin = subtotal >= (o.min_order_amount || 0);
    const meetsMax = o.max_order_amount == null || subtotal <= o.max_order_amount;
    return scopeMatches && meetsMin && meetsMax;
  });

  if (eligible.length === 0) {
    return { discountAmount: 0, appliedOffer: null };
  }

  let best: { discountAmount: number; appliedOffer: ActiveDiscount } | null = null;

  for (const offer of eligible) {
    const amount = offer.discount_type === 'percentage'
      ? subtotal * (offer.discount_value / 100)
      : offer.discount_value;

    const cappedAmount = Math.min(amount, subtotal); // never discount below $0

    if (!best || cappedAmount > best.discountAmount) {
      best = { discountAmount: cappedAmount, appliedOffer: offer };
    }
  }

  return best || { discountAmount: 0, appliedOffer: null };
}
