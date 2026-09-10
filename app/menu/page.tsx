import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/lib/site-settings';
import MenuClient from './menu-client';

export const revalidate = 60;

async function getMenuData() {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, subtitle, sort_order')
    .order('sort_order');

  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('id, category_id, name, sort_order')
    .order('sort_order');

  const { data: items } = await supabase
    .from('menu_items')
    .select(`
      id, category_id, subcategory_id, name, description, base_price, image_url, is_available, is_popular,
      option_groups (
        id, name, required, max_selections,
        option_choices ( id, name, price_delta )
      )
    `)
    .eq('is_available', true)
    .order('sort_order');

  return { categories: categories || [], subcategories: subcategories || [], items: items || [] };
}

export default async function MenuPage() {
  const { categories, subcategories, items } = await getMenuData();
  const { siteName, logoUrl } = await getSiteSettings();
  return <MenuClient categories={categories} subcategories={subcategories} items={items} siteName={siteName} logoUrl={logoUrl} />;
}
