'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RequireAuth from '@/lib/require-auth';
import AdminNav from '../admin-nav';

type GalleryImage = { id: string; image_url: string; caption: string | null; sort_order: number };

export default function AdminGalleryPage() {
  return (
    <RequireAuth>
      <AdminNav />
      <GalleryManager />
    </RequireAuth>
  );
}

function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    const { data } = await supabase.from('gallery_images').select('*').order('sort_order');
    setImages(data || []);
  }

  useEffect(() => { loadAll(); }, []);

  async function addImage(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
      const { error: insertError } = await supabase.from('gallery_images').insert({
        image_url: data.publicUrl,
        caption: caption || null,
        sort_order: images.length,
      });
      if (insertError) throw new Error(insertError.message);

      setFile(null);
      setPreview(null);
      setCaption('');
      loadAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(id: string) {
    if (!confirm('Delete this photo?')) return;
    await supabase.from('gallery_images').delete().eq('id', id);
    loadAll();
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gallery Manager</h1>

      <form onSubmit={addImage} className="border rounded-xl p-4 space-y-3 mb-8">
        <h2 className="font-semibold text-sm">Add Photo</h2>
        <input
          type="file" accept="image/*"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
          }}
          className="w-full text-sm"
        />
        {preview && (
          <div className="w-32 h-32 rounded-lg bg-cover bg-center border" style={{ backgroundImage: `url('${preview}')` }} />
        )}
        <input
          placeholder="Caption (optional)" value={caption}
          onChange={e => setCaption(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={uploading || !file}
          className="bg-brand text-white px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Add Photo'}
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map(img => (
          <div key={img.id} className="relative group">
            <div className="w-full aspect-square rounded-xl bg-cover bg-center bg-gray-100" style={{ backgroundImage: `url('${img.image_url}')` }} />
            {img.caption && <p className="text-xs text-gray-500 mt-1">{img.caption}</p>}
            <button
              onClick={() => deleteImage(img.id)}
              className="absolute top-2 right-2 bg-white rounded-full w-7 h-7 text-sm shadow opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {images.length === 0 && <p className="text-gray-400 text-sm">No photos yet — add one above.</p>}
    </main>
  );
}
