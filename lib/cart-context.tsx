'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CartOption = { group: string; choice: string; price_delta: number };

export type CartLine = {
  lineId: string;          // unique id for this cart line (item + options combo)
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  options: CartOption[];
};

type CartContextType = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, 'lineId'>) => void;
  removeLine: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'restaurant-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setLines(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Persist cart on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  function addLine(line: Omit<CartLine, 'lineId'>) {
    const lineId = `${line.menuItemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLines(prev => [...prev, { ...line, lineId }]);
  }

  function removeLine(lineId: string) {
    setLines(prev => prev.filter(l => l.lineId !== lineId));
  }

  function updateQuantity(lineId: string, quantity: number) {
    if (quantity <= 0) return removeLine(lineId);
    setLines(prev => prev.map(l => l.lineId === lineId ? { ...l, quantity } : l));
  }

  function clearCart() {
    setLines([]);
  }

  const lineTotal = (l: CartLine) =>
    (l.basePrice + l.options.reduce((s, o) => s + o.price_delta, 0)) * l.quantity;

  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, addLine, removeLine, updateQuantity, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
