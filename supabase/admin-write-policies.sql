-- ============================================
-- ADD-ON: LET LOGGED-IN STAFF EDIT THE MENU
-- Run this in Supabase SQL Editor.
--
-- The original schema only allowed the PUBLIC to view the menu
-- (read-only). This adds write permissions for authenticated
-- staff (anyone logged in via /admin/login) to actually manage it.
-- ============================================

-- CATEGORIES — staff can add/edit/delete
create policy "Authenticated can insert categories"
on categories for insert
to authenticated
with check (true);

create policy "Authenticated can update categories"
on categories for update
to authenticated
using (true);

create policy "Authenticated can delete categories"
on categories for delete
to authenticated
using (true);

-- MENU ITEMS — staff can add/edit/delete
create policy "Authenticated can insert menu items"
on menu_items for insert
to authenticated
with check (true);

create policy "Authenticated can update menu items"
on menu_items for update
to authenticated
using (true);

create policy "Authenticated can delete menu items"
on menu_items for delete
to authenticated
using (true);

-- OPTION GROUPS / CHOICES — staff can manage these too (for later)
create policy "Authenticated can manage option groups"
on option_groups for all
to authenticated
using (true) with check (true);

create policy "Authenticated can manage option choices"
on option_choices for all
to authenticated
using (true) with check (true);

-- ORDERS — staff need to update status (advance/cancel) from the dashboard
create policy "Authenticated can update orders"
on orders for update
to authenticated
using (true);

create policy "Authenticated can view all orders"
on orders for select
to authenticated
using (true);
