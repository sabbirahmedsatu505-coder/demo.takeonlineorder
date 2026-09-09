import { createClient } from '@supabase/supabase-js';

// Public client — safe to use in the browser (menu reads, placing orders)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-only client — full access, NEVER import this in a client component.
// Use it inside API routes (app/api/**) for reading/updating orders (kitchen dashboard, webhooks).
export function getSupabaseAdmin() {
  const { createClient: createServerClient } = require('@supabase/supabase-js');
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
