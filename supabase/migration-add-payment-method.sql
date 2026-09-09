-- Run this ONLY if you already ran schema.sql before this update.
-- If you haven't run schema.sql yet, skip this — the updated schema.sql already includes it.

alter table orders
  add column if not exists payment_method text not null default 'card'
  check (payment_method in ('card','cash'));
