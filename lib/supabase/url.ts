// Normalizes the Supabase project URL so the app works even if the env var was
// pasted with a trailing slash or the "/rest/v1" REST endpoint suffix. The
// Supabase client expects the bare project origin (https://xxx.supabase.co).
export function normalizeSupabaseUrl(raw?: string): string {
  return (raw ?? "")
    .trim()
    .replace(/\/+$/, "") // drop trailing slashes
    .replace(/\/rest\/v1$/, "") // drop a REST endpoint suffix
    .replace(/\/+$/, ""); // drop any slash left behind
}

export const SUPABASE_URL = normalizeSupabaseUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);
