# Restaurant Ordering Site — Setup Guide

Next.js + Supabase + Stripe. Homepage, menu with item customization, cart, checkout,
and a live kitchen order dashboard.

## 1. Push to GitHub

```bash
cd restaurant-site
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## 2. Set up Supabase

1. Create a new project at supabase.com (free tier is fine — see cost notes below).
2. Go to **SQL Editor** → paste the contents of `supabase/schema.sql` → Run.
   This creates all tables, security policies, and enables realtime on `orders`.
3. Add your menu data:
   - Go to **Table Editor → categories** → add rows (e.g. "Wraps", "Bowls", "Salads").
   - Go to **menu_items** → add items, linking `category_id` to the category you just made.
   - For items with choices (protein, sauce, size), add rows to **option_groups**
     (linked to the menu item) then **option_choices** (linked to the option group).
   - Upload photos: **Storage → create a bucket called `menu-images`** → set it public →
     upload images → copy the public URL into each item's `image_url` field.
4. Copy your keys: **Project Settings → API**
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret — server-only)

## 3. Set up Stripe

1. Create a Stripe account, stay in **Test mode** while building.
2. **Developers → API keys**: copy the publishable key and secret key.
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/stripe-webhook`
   - Event to send: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the **signing secret** → `STRIPE_WEBHOOK_SECRET`
   - (While developing locally, use the Stripe CLI instead: `stripe listen --forward-to localhost:3000/api/stripe-webhook`)
4. Change the currency in `app/api/create-order/route.ts` (`currency: 'usd'`) to match
   your client's market — `'gbp'` for UK, `'aed'` for UAE, etc.

## 4. Deploy to Vercel

1. Go to vercel.com → **Add New Project** → import your GitHub repo.
2. Add environment variables (copy from `.env.local.example`, fill in real values)
   in **Project Settings → Environment Variables**.
3. Deploy. Vercel gives you a live URL with SSL automatically.
4. Point the client's domain: **Project Settings → Domains** → add their domain →
   update their DNS (Vercel gives you the exact records to add).

## 5. Local development

```bash
npm install
cp .env.local.example .env.local   # fill in real keys
npm run dev
```

## 6. Replace placeholder branding

- `app/globals.css` — change `--brand` and `--brand-dark` to the client's colors
- `app/page.tsx` — replace hero text, `/public/hero.jpg`, story section, hours
- Add a `public/hero.jpg` image before deploying (referenced in the homepage hero)

## 7. Admin backend (login-protected)

Run `supabase/offers-addon.sql` in the SQL Editor (after the main schema) to add the
popup-offers table.

Create the restaurant owner's login: Supabase → **Authentication → Users → Add user** →
enter their email + a password → give it to them.

Admin pages, all behind `/admin/login`:
- `/admin/orders` — live incoming orders, real-time, advance status button
- `/admin/menu` — add categories, add menu items, toggle sold-out, delete items
- `/admin/offers` — create popup offers (title, message, button), toggle one "Active"
  at a time — that's what customers see as a popup on the homepage

Note: photo uploads and item option groups (protein/sauce/size choices) still go
through Supabase Table Editor directly for now — not yet in the admin UI.

## 8. Cost reality check (for a small single-location restaurant)

At low volume (a few dozen orders/day, a few hundred/month) — as discussed —
you'll comfortably stay on **free tiers for both Vercel and Supabase**. Main paid
cost is Stripe's transaction fee (2.9% + $0.30), which comes out of order revenue,
not your pocket. Supabase free projects pause after 7 days with zero API activity —
not a concern for a site with regular daily visitors.

## What's NOT included yet (future add-ons)

- SMS/email order confirmations (Twilio/Resend — hook into the webhook)
- In-store/walk-in order entry screen (staff manually building an order at the counter — separate from online ordering)
- Photo upload and option-group (protein/sauce/size) editing inside the admin UI — still via Supabase Table Editor
- Delivery fee / tax calculation (currently `total = subtotal`, add logic in `create-order/route.ts`)

## Cash payments

Checkout now offers **Card** (Stripe) or **Cash** (pay on pickup/delivery):
- Cash orders skip Stripe entirely — they're created with `payment_method: 'cash'`,
  `status: 'preparing'` (goes straight to the kitchen), and `payment_status: 'unpaid'`
  until staff mark it collected.
- The kitchen receipt prints immediately for cash orders (no webhook wait, since
  there's no payment to confirm first).
- If you already ran `schema.sql` before this update, run
  `supabase/migration-add-payment-method.sql` once to add the missing column.
  If you haven't run `schema.sql` yet, skip this — it's already included.
