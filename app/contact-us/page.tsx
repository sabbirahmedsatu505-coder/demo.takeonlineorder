import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/lib/site-settings';
import Sidebar from '@/components/Sidebar';

export default async function ContactUsPage() {
  const { data: content } = await supabase.from('homepage_content').select('location_text, phone_text').eq('id', 1).single();
  const { siteName, logoUrl } = await getSiteSettings();

  return (
    <div className="flex">
      <Sidebar siteName={siteName} logoUrl={logoUrl} />
      <main className="flex-1 min-w-0 max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-700 text-sm">{content?.location_text || '123 High Street, Your City'}</p>
        <p className="text-gray-700 text-sm">{content?.phone_text || '+44 0000 000000'}</p>
        <p className="text-gray-500 text-sm mt-6">A contact form will go here.</p>
      </main>
    </div>
  );
}
