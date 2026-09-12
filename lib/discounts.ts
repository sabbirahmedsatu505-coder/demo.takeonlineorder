import { supabase } from './supabase';

export type ActiveDiscount = {
  id: string;
  title: string;
  discount_type: 'percentage' | 'fixed' | 'none';
  discount_value: number;
  applies_to: 'delivery' | 'pickup' | 'both';
};

// Finds the best active discount offer that applies to the given order type
// (pickup or delivery), and returns the discount amount to subtract from subtotal.
// If multiple discount offers are active, the largest discount wins — never stack them.
export async function getBestDiscount(
  orderType: 'pickup' | 'delivery',
  subtotal: number
): Promise<{ discountAmount: number; appliedOffer: ActiveDiscount | null }> {
  const { data: offers } = await supabase
    .from('offers')
    .select('id, title, discount_type, discount_value, applies_to')
    .eq('is_active', true)
    .neq('discount_type', 'none');

  if (!offers || offers.length === 0) {
    return { discountAmount: 0, appliedOffer: null };
  }

  const eligible = (offers as ActiveDiscount[]).filter(
    o => o.applies_to === 'both' || o.applies_to === orderType
  );

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
