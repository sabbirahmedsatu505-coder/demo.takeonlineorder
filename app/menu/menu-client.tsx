'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

type Choice = { id: string; name: string; price_delta: number };
type OptionGroup = { id: string; name: string; required: boolean; max_selections: number; option_choices: Choice[] };
type MenuItem = {
  id: string; category_id: string; name: string; description: string | null;
  base_price: number; image_url: string | null; is_available: boolean;
  option_groups: OptionGroup[];
};
type Category = { id: string; name: string; sort_order: number };

export default function MenuClient({ categories, items }: { categories: Category[]; items: MenuItem[] }) {
  const { lines, addLine, removeLine, updateQuantity, subtotal, itemCount } = useCart();
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const itemsByCategory = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const item of items) {
      (map[item.category_id] ||= []).push(item);
    }
    return map;
  }, [items]);

  function scrollToCategory(catId: string) {
    sectionRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div>
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold text-brand">Your Restaurant</Link>
          <button
            onClick={() => setCartOpen(true)}
            className="relative bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-dark transition"
          >
            Cart {itemCount > 0 && `(${itemCount})`}
          </button>
        </div>
        {/* CATEGORY NAV */}
        <nav className="max-w-6xl mx-auto px-4 pb-3 flex gap-4 overflow-x-auto text-sm font-medium">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full border hover:bg-gray-100 transition"
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </header>

      {/* MENU SECTIONS */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {categories.map(cat => (
          <section
            key={cat.id}
            ref={el => { sectionRefs.current[cat.id] = el; }}
            className="mb-12 scroll-mt-32"
          >
            <h2 className="text-2xl font-bold mb-4">{cat.name}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {(itemsByCategory[cat.id] || []).map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="text-left border rounded-xl p-4 hover:shadow-md transition flex justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                    <p className="text-brand font-bold mt-2">
                      ${item.base_price.toFixed(2)}{item.option_groups.length > 0 && '+'}
                    </p>
                  </div>
                  {item.image_url && (
                    <div
                      className="w-20 h-20 rounded-lg bg-cover bg-center shrink-0"
                      style={{ backgroundImage: `url('${item.image_url}')` }}
                    />
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

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

// ============ ITEM CUSTOMIZATION MODAL ============
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
        if (next.length > group.max_selections) return prev; // enforce cap
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

// ============ CART DRAWER ============
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
