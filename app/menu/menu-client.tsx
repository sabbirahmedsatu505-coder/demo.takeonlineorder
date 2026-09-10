'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import Sidebar from '@/components/Sidebar';

type Choice = { id: string; name: string; price_delta: number };
type OptionGroup = { id: string; name: string; required: boolean; max_selections: number; option_choices: Choice[] };
type MenuItem = {
  id: string; category_id: string; subcategory_id: string | null; name: string; description: string | null;
  base_price: number; image_url: string | null; is_available: boolean; is_popular: boolean;
  option_groups: OptionGroup[];
};
type Category = { id: string; name: string; subtitle: string | null; sort_order: number };
type Subcategory = { id: string; category_id: string; name: string; sort_order: number };

export default function MenuClient({
  categories, subcategories, items, siteName, logoUrl,
}: { categories: Category[]; subcategories: Subcategory[]; items: MenuItem[]; siteName: string; logoUrl: string | null }) {
  const { lines, addLine, removeLine, updateQuantity, subtotal, itemCount } = useCart();
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string>(categories[0]?.id || '');

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isClickScrolling = useRef(false);

  const itemsByCategory = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const item of items) {
      (map[item.category_id] ||= []).push(item);
    }
    return map;
  }, [items]);

  const subcatsByCategory = useMemo(() => {
    const map: Record<string, Subcategory[]> = {};
    for (const sub of subcategories) {
      (map[sub.category_id] ||= []).push(sub);
    }
    return map;
  }, [subcategories]);

  // Group a category's items by subcategory; items with no subcategory_id go in an "Other" bucket
  function groupItemsBySubcategory(catId: string) {
    const catItems = itemsByCategory[catId] || [];
    const subs = subcatsByCategory[catId] || [];
    const groups: { id: string | null; name: string | null; items: MenuItem[] }[] = [];

    for (const sub of subs) {
      const subItems = catItems.filter(i => i.subcategory_id === sub.id);
      if (subItems.length > 0) groups.push({ id: sub.id, name: sub.name, items: subItems });
    }
    const ungrouped = catItems.filter(i => !i.subcategory_id);
    if (ungrouped.length > 0) groups.push({ id: null, name: null, items: ungrouped });

    return groups;
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (isClickScrolling.current) return;
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const topMost = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          const catId = topMost.target.getAttribute('data-cat-id');
          if (catId) setActiveCat(catId);
        }
      },
      { rootMargin: '-140px 0px -60% 0px', threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [categories, items]);

  useEffect(() => {
    tabRefs.current[activeCat]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeCat]);

  function goToCategory(catId: string) {
    isClickScrolling.current = true;
    setActiveCat(catId);
    sectionRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { isClickScrolling.current = false; }, 700);
  }

  return (
    <div className="flex">
      <Sidebar siteName={siteName} logoUrl={logoUrl} />

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-end px-4 py-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-dark transition"
            >
              Cart {itemCount > 0 && `(${itemCount})`}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                ref={el => { tabRefs.current[cat.id] = el; }}
                onClick={() => goToCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition shrink-0 ${
                  activeCat === cat.id ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {categories.map(cat => {
          const groups = groupItemsBySubcategory(cat.id);
          return (
            <section
              key={cat.id}
              data-cat-id={cat.id}
              ref={el => { sectionRefs.current[cat.id] = el; }}
              className="mb-10 scroll-mt-32"
            >
              <h2 className="text-2xl font-bold">{cat.name}</h2>
              {cat.subtitle && (
                <p className="text-gray-500 text-sm italic mt-1 mb-4">"{cat.subtitle}"</p>
              )}

              {groups.map((group, idx) => (
                <div key={group.id || 'ungrouped'} className={idx > 0 ? 'mt-6' : 'mt-2'}>
                  {group.name && (
                    <h3 className="text-lg font-bold mb-1">{group.name}</h3>
                  )}
                  <div className="divide-y">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveItem(item)}
                        className="w-full text-left py-4 flex gap-4 hover:opacity-80 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{item.name}</p>
                          {item.is_popular && (
                            <p className="text-xs text-orange-600 font-semibold mt-0.5">🔥 Popular</p>
                          )}
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">
                            ${item.base_price.toFixed(2)}{item.option_groups.length > 0 && '+'}
                          </p>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                        {item.image_url && (
                          <div className="relative w-24 h-24 shrink-0">
                            <div
                              className="w-full h-full rounded-lg bg-cover bg-center"
                              style={{ backgroundImage: `url('${item.image_url}')` }}
                            />
                            <div className="absolute bottom-1 right-1 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-lg leading-none">
                              +
                            </div>
                          </div>
                        )}
                        {!item.image_url && (
                          <div className="w-9 h-9 shrink-0 bg-green-600 text-white rounded-lg flex items-center justify-center text-lg font-bold self-center">
                            +
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {groups.length === 0 && (
                <p className="text-gray-400 text-sm py-4">No items in this category yet.</p>
              )}
            </section>
          );
        })}
      </main>

      {lines.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t px-4 py-3">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-brand text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2"
          >
            View cart · ${subtotal.toFixed(2)}
          </button>
        </div>
      )}
      </div>

      {activeItem && (
        <ItemModal item={activeItem} onClose={() => setActiveItem(null)} onAdd={addLine} />
      )}

      {cartOpen && (
        <CartDrawer
          lines={lines}
          subtotal={subtotal}
          onClose={() => setCartOpen(false)}
          onRemove={removeLine}
          onUpdateQty={updateQuantity}
        />
      )}
    </div>
  );
}

function ItemModal({
  item, onClose, onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (line: any) => void;
}) {
  const [selections, setSelections] = useState<Record<string, Choice[]>>({});
  const [quantity, setQuantity] = useState(1);

  function toggleChoice(group: OptionGroup, choice: Choice) {
    setSelections(prev => {
      const current = prev[group.id] || [];
      const exists = current.find(c => c.id === choice.id);
      let next: Choice[];
      if (group.max_selections === 1) {
        next = exists ? [] : [choice];
      } else {
        next = exists ? current.filter(c => c.id !== choice.id) : [...current, choice];
        if (next.length > group.max_selections) return prev;
      }
      return { ...prev, [group.id]: next };
    });
  }

  const optionsTotal = Object.values(selections).flat().reduce((s, c) => s + c.price_delta, 0);
  const unitPrice = item.base_price + optionsTotal;
  const canAdd = item.option_groups
    .filter(g => g.required)
    .every(g => (selections[g.id] || []).length > 0);

  function handleAdd() {
    const flatOptions = item.option_groups.flatMap(g =>
      (selections[g.id] || []).map(c => ({ group: g.name, choice: c.name, price_delta: c.price_delta }))
    );
    onAdd({
      menuItemId: item.id,
      name: item.name,
      basePrice: item.base_price,
      quantity,
      options: flatOptions,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {item.image_url && (
          <div className="h-40 bg-cover bg-center rounded-t-2xl" style={{ backgroundImage: `url('${item.image_url}')` }} />
        )}
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold">{item.name}</h3>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
          </div>
          {item.description && <p className="text-gray-600 text-sm mb-4">{item.description}</p>}

          {item.option_groups.map(group => (
            <div key={group.id} className="mb-5">
              <p className="font-semibold mb-2">
                {group.name} {group.required && <span className="text-brand text-xs">(required)</span>}
              </p>
              <div className="space-y-2">
                {group.option_choices.map(choice => {
                  const selected = !!(selections[group.id] || []).find(c => c.id === choice.id);
                  return (
                    <button
                      key={choice.id}
                      onClick={() => toggleChoice(group, choice)}
                      className={`w-full flex justify-between items-center border rounded-lg px-3 py-2 text-sm transition ${
                        selected ? 'border-brand bg-brand/5' : 'border-gray-200'
                      }`}
                    >
                      <span>{choice.name}</span>
                      {choice.price_delta > 0 && <span>+${choice.price_delta.toFixed(2)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-3 border rounded-full px-3 py-1">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)}>+</button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className="bg-brand text-white px-6 py-2.5 rounded-full font-semibold disabled:opacity-40"
            >
              Add to Cart · ${(unitPrice * quantity).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  lines, subtotal, onClose, onRemove, onUpdateQty,
}: {
  lines: any[]; subtotal: number; onClose: () => void;
  onRemove: (id: string) => void; onUpdateQty: (id: string, q: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="bg-white w-full sm:max-w-md h-full overflow-y-auto flex flex-col">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Your Cart</h3>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 p-5 space-y-4">
          {lines.length === 0 && <p className="text-gray-500 text-sm">Your cart is empty.</p>}
          {lines.map(line => {
            const optTotal = line.options.reduce((s: number, o: any) => s + o.price_delta, 0);
            const lineTotal = (line.basePrice + optTotal) * line.quantity;
            return (
              <div key={line.lineId} className="border-b pb-3">
                <div className="flex justify-between">
                  <p className="font-semibold text-sm">{line.name}</p>
                  <p className="font-semibold text-sm">${lineTotal.toFixed(2)}</p>
                </div>
                {line.options.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {line.options.map((o: any) => o.choice).join(', ')}
                  </p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2 border rounded-full px-2 py-0.5 text-sm">
                    <button onClick={() => onUpdateQty(line.lineId, line.quantity - 1)}>−</button>
                    <span>{line.quantity}</span>
                    <button onClick={() => onUpdateQty(line.lineId, line.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => onRemove(line.lineId)} className="text-xs text-gray-400 underline">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {lines.length > 0 && (
          <div className="p-5 border-t">
            <div className="flex justify-between font-bold mb-4">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              className="block text-center bg-brand text-white py-3 rounded-full font-semibold hover:bg-brand-dark transition"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
