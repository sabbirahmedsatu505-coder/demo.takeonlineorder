import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/lib/site-settings';
import Sidebar from '@/components/Sidebar';

export const revalidate = 60;

export default async function GalleryPage() {
  const { data: images } = await supabase.from('gallery_images').select('*').order('sort_order');
  const { siteName, logoUrl } = await getSiteSettings();

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar siteName={siteName} logoUrl={logoUrl} />
      <main className="flex-1 min-w-0 max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">Gallery</h1>
        {(!images || images.length === 0) && (
          <p className="text-gray-400 text-sm">No photos yet.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images?.map(img => (
            <div key={img.id}>
              <div
                className="w-full aspect-square rounded-xl bg-cover bg-center bg-gray-100"
                style={{ backgroundImage: `url('${img.image_url}')` }}
              />
              {img.caption && <p className="text-sm text-gray-600 mt-1">{img.caption}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
