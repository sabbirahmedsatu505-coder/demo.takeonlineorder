import { getSiteSettings } from '@/lib/site-settings';
import Sidebar from '@/components/Sidebar';

export default async function ReviewPage() {
  const { siteName, logoUrl } = await getSiteSettings();
  return (
    <div className="flex">
      <Sidebar siteName={siteName} logoUrl={logoUrl} />
      <main className="flex-1 min-w-0 max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Reviews</h1>
        <p className="text-gray-500 text-sm">Coming soon — customer reviews will appear here.</p>
      </main>
    </div>
  );
}
