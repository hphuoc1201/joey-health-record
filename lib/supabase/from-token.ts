import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./url";

// Authenticates an API request via its Authorization: Bearer <access_token>
// header (the client stores its session in localStorage, not cookies, so the
// token is passed explicitly). Returns a Supabase client scoped to that user —
// queries run under their RLS — plus the verified user, or null if unauthed.
export async function clientFromRequest(
  request: Request,
): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const supabase = createClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return null;

  return { supabase, user };
}
