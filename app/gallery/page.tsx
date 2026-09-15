import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/lib/site-settings';
import Sidebar from '@/components/Sidebar';

export const revalidate = 60;

export default async function GalleryPage() {
  const { data: images } = await supabase.from('gallery_images').select('*').order('sort_order');
  const { data: content } = await supabase.from('homepage_content').select('gallery_banner_image_url').eq('id', 1).single();
  const { siteName, logoUrl } = await getSiteSettings();
  const bannerUrl = content?.gallery_banner_image_url || null;

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar siteName={siteName} logoUrl={logoUrl} />
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-4 pt-6">
          {bannerUrl ? (
            <div
              className="relative rounded-2xl overflow-hidden h-32 sm:h-44 flex items-center justify-center mb-8 bg-cover bg-center"
              style={{ backgroundImage: `url('${bannerUrl}')` }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <h1 className="relative z-10 text-3xl sm:text-4xl font-extrabold text-white">Gallery</h1>
            </div>
          ) : (
            <h1 className="text-3xl font-bold mb-8">Gallery</h1>
          )}

          {(!images || images.length === 0) && (
            <p className="text-gray-400 text-sm">No photos yet.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {images?.map(img => (
              <div key={img.id}>
                <div
                  className="w-full aspect-[4/3] rounded-2xl shadow-sm bg-cover bg-center bg-gray-100"
                  style={{ backgroundImage: `url('${img.image_url}')` }}
                />
                {img.caption && <p className="text-sm text-gray-600 mt-2">{img.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
