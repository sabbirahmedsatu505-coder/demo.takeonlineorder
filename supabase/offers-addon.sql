-- ============================================
-- ADD-ON: PROMO POPUP / OFFERS
-- Run this AFTER the main schema.sql
-- ============================================

create table offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,              -- e.g. "20% Off Today Only"
  message text,                     -- e.g. "Use code SAVE20 at checkout"
  image_url text,                   -- optional promo image
  button_text text default 'Order Now',
  button_link text default '/menu',
  is_active boolean not null default false,   -- only one should be active at a time
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

alter table offers enable row level security;

-- Public can read only the active offer (for the popup to display)
create policy "Public can view active offers" on offers for select using (true);

-- Writes (insert/update/delete) go through the service-role key on the server only,
-- called from the authenticated admin pages — not directly from the browser.
