import { createClient } from "@/lib/supabase/server";

export interface SessionContext {
  userId: string;
  email: string;
  isAdmin: boolean;
}

// Returns the current user's session context, or null if not logged in.
// Admin status is read from the `admins` table (RLS lets a user see only
// their own row), keeping the app and database in agreement.
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const email = user.email.toLowerCase();
  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  return {
    userId: user.id,
    email,
    isAdmin: Boolean(adminRow),
  };
}
