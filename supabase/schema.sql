-- ============================================
-- RESTAURANT ORDERING SYSTEM — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Menu categories (e.g. Wraps, Bowls, Salads)
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Menu items
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  description text,
  base_price numeric(10,2) not null,
  image_url text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Option groups (e.g. "Choose your protein", "Choose your sauce")
create table option_groups (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items(id) on delete cascade,
  name text not null,               -- e.g. "Protein"
  required boolean not null default false,
  max_selections int not null default 1,  -- 1 = single choice, >1 = multi
  sort_order int not null default 0
);

-- Individual choices inside an option group (e.g. "Chicken", "+$2.00")
create table option_choices (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid references option_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(10,2) not null default 0,
  sort_order int not null default 0
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  order_type text not null check (order_type in ('pickup','delivery')),
  payment_method text not null default 'card' check (payment_method in ('card','cash')),
  delivery_address text,
  status text not null default 'pending'
    check (status in ('pending','preparing','ready','completed','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid','refunded')),
  stripe_payment_intent_id text,
  subtotal numeric(10,2) not null,
  total numeric(10,2) not null,
  notes text,
  created_at timestamptz default now()
);

-- Order line items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  item_name text not null,          -- snapshot, in case menu changes later
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  selected_options jsonb,           -- snapshot of chosen options e.g. [{"group":"Protein","choice":"Chicken","price_delta":2}]
  line_total numeric(10,2) not null
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_menu_items_category on menu_items(category_id);
create index idx_option_groups_item on option_groups(menu_item_id);
create index idx_option_choices_group on option_choices(option_group_id);
create index idx_orders_status on orders(status);
create index idx_orders_created on orders(created_at desc);
create index idx_order_items_order on order_items(order_id);

-- ============================================
-- ROW LEVEL SECURITY
-- Public can READ menu; only service role can write orders/menu
-- ============================================
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table option_groups enable row level security;
alter table option_choices enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Anyone can view the menu (public storefront)
create policy "Public can view categories" on categories for select using (true);
create policy "Public can view menu items" on menu_items for select using (true);
create policy "Public can view option groups" on option_groups for select using (true);
create policy "Public can view option choices" on option_choices for select using (true);

-- Orders: customers can insert (place order) but not read others' orders.
-- Reading/updating orders (kitchen dashboard) should go through the service role key on the server, not the public anon key.
create policy "Anyone can create an order" on orders for insert with check (true);
create policy "Anyone can create order items" on order_items for insert with check (true);

-- ============================================
-- REALTIME (for the kitchen/admin dashboard)
-- ============================================
alter publication supabase_realtime add table orders;
