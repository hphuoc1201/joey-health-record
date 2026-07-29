import "server-only";

import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. SERVER ONLY — bypasses Row Level Security.
// Only use this AFTER verifying the caller's permissions in a server action
// (e.g. confirming the user is an admin, or that they can read a given visit).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
