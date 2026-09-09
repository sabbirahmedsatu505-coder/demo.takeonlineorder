'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RequireAuth from '@/lib/require-auth';
import AdminNav from '../admin-nav';

type Category = { id: string; name: string; subtitle: string | null; sort_order: number };
type MenuItem = {
  id: string; category_id: string; name: string; description: string | null;
  base_price: number; is_available: boolean; image_url: string | null;
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
  const [activeCat, setActiveCat] = useState<string>('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatSubtitle, setNewCatSubtitle] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const [form, setForm] = useState({ name: '', description: '', base_price: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  async function loadAll() {
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order');
    const { data: menuItems } = await supabase.from('menu_items')
      .select('id, category_id, name, description, base_price, is_available, image_url')
      .order('sort_order');
    setCategories(cats || []);
    setItems(menuItems || []);
    if (!activeCat && cats && cats.length > 0) setActiveCat(cats[0].id);
  }

  useEffect(() => { loadAll(); }, []);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName) return;
    const { data } = await supabase
      .from('categories')
      .insert({ name: newCatName, subtitle: newCatSubtitle || null, sort_order: categories.length })
      .select()
      .single();
    setNewCatName('');
    setNewCatSubtitle('');
    setAddingCategory(false);
    await loadAll();
    if (data) setActiveCat(data.id);
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category and all its items?')) return;
    await supabase.from('categories').delete().eq('id', id);
    if (activeCat === id) setActiveCat('');
    loadAll();
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhotoIfAny(): Promise<string | null> {
    if (!photoFile) return null;
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, photoFile, { cacheControl: '3600', upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!activeCat || !form.name || !form.base_price) return;

    setUploading(true);
    try {
      const imageUrl = await uploadPhotoIfAny();
      await supabase.from('menu_items').insert({
        category_id: activeCat,
        name: form.name,
        description: form.description,
        base_price: parseFloat(form.base_price),
        is_available: true,
        image_url: imageUrl,
        sort_order: items.filter(i => i.category_id === activeCat).length,
      });
      setForm({ name: '', description: '', base_price: '' });
      setPhotoFile(null);
      setPhotoPreview(null);
      loadAll();
    } catch (err: any) {
      setError(`Photo upload failed: ${err.message}. Item was not saved.`);
    } finally {
      setUploading(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    setUploading(true);
    setError('');
    try {
      const newImageUrl = await uploadPhotoIfAny();
      await supabase.from('menu_items').update({
        name: editingItem.name,
        description: editingItem.description,
        base_price: editingItem.base_price,
        ...(newImageUrl ? { image_url: newImageUrl } : {}),
      }).eq('id', editingItem.id);
      setEditingItem(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      loadAll();
    } catch (err: any) {
      setError(`Photo upload failed: ${err.message}. Other changes were not saved either — try again.`);
    } finally {
      setUploading(false);
    }
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

  const currentCategory = categories.find(c => c.id === activeCat);
  const currentItems = items.filter(i => i.category_id === activeCat);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
      {/* SIDEBAR — categories, same layout as customer menu */}
      <aside className="w-56 shrink-0">
        <h1 className="text-lg font-bold mb-4">Menu Manager</h1>
        <nav className="space-y-1 mb-4">
          {categories.map(cat => (
            <div key={cat.id} className="group flex items-center">
              <button
                onClick={() => setActiveCat(cat.id)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition ${
                  activeCat === cat.id ? 'bg-black text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs px-1"
                title="Delete category"
              >
                ✕
              </button>
            </div>
          ))}
        </nav>

        {!addingCategory ? (
          <button
            onClick={() => setAddingCategory(true)}
            className="text-sm text-brand font-semibold"
          >
            + Add category
          </button>
        ) : (
          <form onSubmit={addCategory} className="space-y-2 border rounded-lg p-3">
            <input
              placeholder="Category name" value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
              autoFocus
            />
            <input
              placeholder="Subtitle (optional)" value={newCatSubtitle}
              onChange={e => setNewCatSubtitle(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <button className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                Save
              </button>
              <button type="button" onClick={() => setAddingCategory(false)} className="text-xs text-gray-400">
                Cancel
              </button>
            </div>
          </form>
        )}
      </aside>

      {/* MAIN — items in the selected category */}
      <div className="flex-1 min-w-0">
        {!currentCategory ? (
          <p className="text-gray-400 text-sm">Add a category to get started.</p>
        ) : (
          <>
            <h2 className="text-2xl font-bold">{currentCategory.name}</h2>
            {currentCategory.subtitle && (
              <p className="text-gray-500 text-sm italic mt-1 mb-4">"{currentCategory.subtitle}"</p>
            )}

            {/* ADD ITEM FORM — scoped to this category */}
            <form onSubmit={addItem} className="border rounded-xl p-4 space-y-3 my-4">
              <h3 className="font-semibold text-sm">Add item to "{currentCategory.name}"</h3>
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
              <div>
                <label className="block text-sm font-medium mb-1">Photo (optional)</label>
                <input type="file" accept="image/*" onChange={handlePhotoSelect} className="w-full text-sm" />
                {photoPreview && (
                  <div
                    className="mt-2 w-20 h-20 rounded-lg bg-cover bg-center border"
                    style={{ backgroundImage: `url('${photoPreview}')` }}
                  />
                )}
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                disabled={uploading}
                className="bg-brand text-white px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
              >
                {uploading ? 'Saving…' : 'Add Item'}
              </button>
            </form>

            {/* ITEM LIST — matches customer-facing card style */}
            <div className="grid sm:grid-cols-2 gap-5 mt-6">
              {currentItems.map(item => (
                <div key={item.id} className="border-b pb-5 flex gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">${item.base_price.toFixed(2)}</p>
                    {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => toggleAvailable(item)}
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Sold Out'}
                      </button>
                      <button
                        onClick={() => { setEditingItem(item); setPhotoPreview(null); setPhotoFile(null); }}
                        className="text-xs text-gray-500 underline"
                      >
                        Edit
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="text-xs text-gray-400 underline">
                        Delete
                      </button>
                    </div>
                  </div>
                  {item.image_url && (
                    <div
                      className="w-28 h-28 rounded-lg bg-cover bg-center shrink-0"
                      style={{ backgroundImage: `url('${item.image_url}')` }}
                    />
                  )}
                </div>
              ))}
              {currentItems.length === 0 && (
                <p className="text-gray-400 text-sm col-span-2">No items yet — add one above.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <form onSubmit={saveEdit} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Edit item</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="text-gray-400 text-2xl leading-none">&times;</button>
            </div>
            <input
              value={editingItem.name}
              onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={editingItem.description || ''}
              onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
            />
            <input
              type="number" step="0.01"
              value={editingItem.base_price}
              onChange={e => setEditingItem({ ...editingItem, base_price: parseFloat(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <div>
              <label className="block text-sm font-medium mb-1">Replace photo (optional)</label>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="w-full text-sm" />
              {photoPreview && (
                <div
                  className="mt-2 w-20 h-20 rounded-lg bg-cover bg-center border"
                  style={{ backgroundImage: `url('${photoPreview}')` }}
                />
              )}
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              disabled={uploading}
              className="bg-brand text-white px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
            >
              {uploading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
