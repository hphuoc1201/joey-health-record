"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL } from "./url";

// Browser Supabase client (uses the public anon key). All access is still
// constrained by Row Level Security on the database.
export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
