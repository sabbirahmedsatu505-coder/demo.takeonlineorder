import { supabase } from './supabase';

export async function getSiteSettings() {
  const { data } = await supabase.from('homepage_content').select('site_name, logo_url').eq('id', 1).single();
  return {
    siteName: data?.site_name || 'Your Restaurant',
    logoUrl: data?.logo_url || null,
  };
}
