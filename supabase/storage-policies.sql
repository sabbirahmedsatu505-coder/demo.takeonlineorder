-- ============================================
-- ADD-ON: MENU PHOTO UPLOADS
-- Run this AFTER schema.sql and offers-addon.sql
--
-- NOTE: You must ALSO manually create the storage bucket first —
-- SQL alone can't do this part. See instructions below.
-- ============================================

-- STEP 1 (do this in the Supabase dashboard, not here):
--   Storage → New bucket → name it exactly: menu-images
--   Toggle "Public bucket" ON → Create bucket

-- STEP 2 (run this SQL after creating the bucket above):

-- Anyone can VIEW images (needed so the public menu page can display photos)
create policy "Public can view menu images"
on storage.objects for select
using (bucket_id = 'menu-images');

-- Only logged-in staff (authenticated via Supabase Auth) can UPLOAD images
create policy "Authenticated users can upload menu images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'menu-images');

-- Only logged-in staff can DELETE/replace images
create policy "Authenticated users can delete menu images"
on storage.objects for delete
to authenticated
using (bucket_id = 'menu-images');
