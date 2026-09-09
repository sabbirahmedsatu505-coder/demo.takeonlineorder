'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RequireAuth from '@/lib/require-auth';
import AdminNav from '../admin-nav';

type Category = { id: string; name: string };
type MenuItem = {
  id: string; category_id: string; name: string; description: string | null;
  base_price: number; is_available: boolean;
};

export default function AdminMenuPage() {
  return (
    <RequireAuth>
      <AdminNav />
      <MenuManager />
    </RequireAuth>
  );
}

function MenuManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [form, setForm] = useState({ category_id: '', name: '', description: '', base_price: '' });

  async function loadAll() {
    const { data: cats } = await supabase.from('categories').select('id, name').order('sort_order');
    const { data: menuItems } = await supabase.from('menu_items')
      .select('id, category_id, name, description, base_price, is_available')
      .order('sort_order');
    setCategories(cats || []);
    setItems(menuItems || []);
  }

  useEffect(() => { loadAll(); }, []);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName) return;
    await supabase.from('categories').insert({ name: newCatName, sort_order: categories.length });
    setNewCatName('');
    loadAll();
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category_id || !form.name || !form.base_price) return;
    await supabase.from('menu_items').insert({
      category_id: form.category_id,
      name: form.name,
      description: form.description,
      base_price: parseFloat(form.base_price),
      is_available: true,
      sort_order: items.filter(i => i.category_id === form.category_id).length,
    });
    setForm({ category_id: '', name: '', description: '', base_price: '' });
    loadAll();
  }

  async function toggleAvailable(item: MenuItem) {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
    loadAll();
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    loadAll();
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Menu Manager</h1>

      {/* ADD CATEGORY */}
      <form onSubmit={addCategory} className="flex gap-2 mb-8">
        <input
          placeholder="New category name (e.g. Salads)" value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          Add Category
        </button>
      </form>

      {/* ADD ITEM */}
      <form onSubmit={addItem} className="border rounded-xl p-4 space-y-3 mb-8">
        <h2 className="font-semibold">Add Menu Item</h2>
        <select
          value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select category…</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input
          placeholder="Item name" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
        />
        <input
          placeholder="Price (e.g. 11.45)" value={form.base_price}
          onChange={e => setForm({ ...form, base_price: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-400">
          To add a photo or protein/sauce options for this item, use Supabase Table Editor
          for now (menu_items.image_url, option_groups, option_choices).
        </p>
        <button className="bg-brand text-white px-5 py-2 rounded-full text-sm font-semibold">
          Add Item
        </button>
      </form>

      {/* ITEM LIST */}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="border rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{item.name}</p>
              <p className="text-xs text-gray-500">${item.base_price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleAvailable(item)}
                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {item.is_available ? 'Available' : 'Sold Out'}
              </button>
              <button onClick={() => deleteItem(item.id)} className="text-xs text-gray-400 underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
