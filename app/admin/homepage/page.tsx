'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RequireAuth from '@/lib/require-auth';
import AdminNav from '../admin-nav';

type Content = {
  site_name: string; logo_url: string | null;
  hero_image_url: string | null; hero_headline: string; hero_subtext: string;
  story_title: string; story_text: string; hours_text: string;
  location_text: string; phone_text: string;
  hygiene_rating_image_url: string | null;
};
type Feature = { id: string; title: string; description: string | null; image_url: string | null; sort_order: number };

export default function AdminHomepagePage() {
  return (
    <RequireAuth>
      <AdminNav>
        <HomepageEditor />
      </AdminNav>
    </RequireAuth>
  );
}

function HomepageEditor() {
  const [content, setContent] = useState<Content | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [hygieneFile, setHygieneFile] = useState<File | null>(null);
  const [hygienePreview, setHygienePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  async function loadAll() {
    const { data: c } = await supabase.from('homepage_content').select('*').eq('id', 1).single();
    const { data: f } = await supabase.from('homepage_features').select('*').order('sort_order');
    setContent(c);
    setFeatures(f || []);
  }

  useEffect(() => { loadAll(); }, []);

  async function uploadPhoto(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function saveContent(e: React.FormEvent) {
    e.preventDefault();
    if (!content) return;
    setSaving(true);
    setError('');
    try {
      let heroUrl = content.hero_image_url;
      if (heroFile) heroUrl = await uploadPhoto(heroFile);

      let logoUrl = content.logo_url;
      if (logoFile) logoUrl = await uploadPhoto(logoFile);

      let hygieneUrl = content.hygiene_rating_image_url;
      if (hygieneFile) hygieneUrl = await uploadPhoto(hygieneFile);

      const { error: updateError } = await supabase
        .from('homepage_content')
        .update({ ...content, hero_image_url: heroUrl, logo_url: logoUrl, hygiene_rating_image_url: hygieneUrl })
        .eq('id', 1);

      if (updateError) throw new Error(updateError.message);
      setHeroFile(null);
      setHeroPreview(null);
      setLogoFile(null);
      setLogoPreview(null);
      setHygieneFile(null);
      setHygienePreview(null);
      setSavedMsg('Saved!');
      setTimeout(() => setSavedMsg(''), 2000);
      loadAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addFeature() {
    await supabase.from('homepage_features').insert({
      title: 'New feature title', description: 'Description here', sort_order: features.length,
    });
    loadAll();
  }

  async function updateFeature(feature: Feature, changes: Partial<Feature>, file?: File | null) {
    let imageUrl = feature.image_url;
    if (file) {
      try {
        imageUrl = await uploadPhoto(file);
      } catch (err: any) {
        setError(`Photo upload failed: ${err.message}`);
        return;
      }
    }
    await supabase.from('homepage_features').update({ ...changes, image_url: imageUrl }).eq('id', feature.id);
    loadAll();
  }

  async function deleteFeature(id: string) {
    if (!confirm('Delete this feature block?')) return;
    await supabase.from('homepage_features').delete().eq('id', id);
    loadAll();
  }

  if (!content) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">Homepage Editor</h1>
        <p className="text-sm text-gray-500">Everything here updates the live homepage immediately after saving.</p>
      </div>

      <form onSubmit={saveContent} className="border rounded-xl p-4 space-y-4">
        <h2 className="font-semibold">Site Identity</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Restaurant name</label>
          <input
            value={content.site_name}
            onChange={e => setContent({ ...content, site_name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Logo (shows in the sidebar instead of the name if set)</label>
          <input
            type="file" accept="image/*"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
            }}
            className="w-full text-sm"
          />
          {(logoPreview || content.logo_url) && (
            <img src={logoPreview || content.logo_url || ''} alt="Logo preview" className="mt-2 h-12" />
          )}
        </div>

        <h2 className="font-semibold pt-2">Hero Section</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Hero background photo</label>
          <input
            type="file" accept="image/*"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) { setHeroFile(f); setHeroPreview(URL.createObjectURL(f)); }
            }}
            className="w-full text-sm"
          />
          <div
            className="mt-2 w-full h-32 rounded-lg bg-cover bg-center border"
            style={{ backgroundImage: `url('${heroPreview || content.hero_image_url || '/hero.jpg'}')` }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Headline</label>
          <input
            value={content.hero_headline}
            onChange={e => setContent({ ...content, hero_headline: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subtext</label>
          <input
            value={content.hero_subtext}
            onChange={e => setContent({ ...content, hero_subtext: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <h2 className="font-semibold pt-2">Food Hygiene Rating (optional)</h2>
        <p className="text-xs text-gray-400">
          Upload a photo/graphic of your official hygiene rating (e.g. a screenshot from
          ratings.food.gov.uk). It'll show under the "Order Now" button exactly as uploaded.
          Leave empty to hide it.
        </p>
        <input
          type="file" accept="image/*"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) { setHygieneFile(f); setHygienePreview(URL.createObjectURL(f)); }
          }}
          className="w-full text-sm"
        />
        {(hygienePreview || content.hygiene_rating_image_url) && (
          <img
            src={hygienePreview || content.hygiene_rating_image_url || ''}
            alt="Hygiene rating preview"
            className="h-24 mt-2"
          />
        )}

        <h2 className="font-semibold pt-2">Our Story</h2>
        <input
          placeholder="Story title" value={content.story_title}
          onChange={e => setContent({ ...content, story_title: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Story text" value={content.story_text}
          onChange={e => setContent({ ...content, story_text: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm" rows={4}
        />

        <h2 className="font-semibold pt-2">Hours &amp; Location</h2>
        <textarea
          placeholder={'One line per row, e.g.\nMon–Thu: 11am – 9pm\nFri–Sat: 11am – 10pm'}
          value={content.hours_text}
          onChange={e => setContent({ ...content, hours_text: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
        />
        <input
          placeholder="Address" value={content.location_text}
          onChange={e => setContent({ ...content, location_text: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="Phone number" value={content.phone_text}
          onChange={e => setContent({ ...content, phone_text: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {savedMsg && <p className="text-green-600 text-sm font-semibold">{savedMsg}</p>}

        <button
          disabled={saving}
          className="bg-brand text-white px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">Feature Showcase Blocks</h2>
          <button onClick={addFeature} className="text-sm text-brand font-semibold">+ Add block</button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          These appear on the homepage as alternating photo/text sections, in the order shown below.
        </p>
        <div className="space-y-4">
          {features.map(feature => (
            <FeatureEditor
              key={feature.id}
              feature={feature}
              onSave={(changes, file) => updateFeature(feature, changes, file)}
              onDelete={() => deleteFeature(feature.id)}
            />
          ))}
          {features.length === 0 && <p className="text-gray-400 text-sm">No feature blocks yet — add one above.</p>}
        </div>
      </div>
    </main>
  );
}

function FeatureEditor({
  feature, onSave, onDelete,
}: {
  feature: Feature;
  onSave: (changes: Partial<Feature>, file?: File | null) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(feature.title);
  const [description, setDescription] = useState(feature.description || '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ title, description }, file);
    setFile(null);
    setPreview(null);
    setSaving(false);
  }

  return (
    <div className="border rounded-xl p-4 space-y-2">
      <input
        value={title} onChange={e => setTitle(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm font-semibold"
      />
      <textarea
        value={description} onChange={e => setDescription(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
      />
      <input
        type="file" accept="image/*"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
        }}
        className="w-full text-sm"
      />
      {(preview || feature.image_url) && (
        <div
          className="w-full h-32 rounded-lg bg-cover bg-center border"
          style={{ backgroundImage: `url('${preview || feature.image_url}')` }}
        />
      )}
      <div className="flex gap-3 pt-1">
        <button
          onClick={handleSave} disabled={saving}
          className="bg-brand text-white px-4 py-1.5 rounded-full text-xs font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onDelete} className="text-xs text-gray-400 underline">Delete</button>
      </div>
    </div>
  );
}
