import { getSiteSettings } from '@/lib/site-settings';
import Sidebar from '@/components/Sidebar';

export default async function FaqsPage() {
  const { siteName, logoUrl } = await getSiteSettings();
  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar siteName={siteName} logoUrl={logoUrl} />
      <main className="flex-1 min-w-0 max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">FAQs</h1>
        <p className="text-gray-500 text-sm">Coming soon — frequently asked questions will appear here.</p>
      </main>
    </div>
  );
}
