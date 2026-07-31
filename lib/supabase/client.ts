"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./url";

// Browser Supabase client. Uses localStorage for the session (the default)
// rather than cookies: Safari throws "The string did not match the expected
// pattern" when decoding @supabase/ssr's base64 session cookie, and this app
// is a client-side SPA that doesn't need cookie-based SSR auth. Access is
// still governed by Row Level Security on the database.
let cached: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (cached) return cached;
  cached = createSupabaseClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    },
  );
  return cached;
}
