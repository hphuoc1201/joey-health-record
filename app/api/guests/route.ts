import { NextResponse } from "next/server";
import { z } from "zod";
import { clientFromRequest } from "@/lib/supabase/from-token";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  profileIds: z.array(z.string().uuid()).min(1),
});

// Grant a guest read-only access to specific patients. Creating the auth
// account needs the service role (server only); the actual grant rows are
// inserted through the caller's RLS-bound client, so the database enforces
// that the caller is an admin or owns each of those patients.
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const { email, profileIds } = parsed.data;

  const ctx = await clientFromRequest(request);
  if (!ctx?.user.email) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const supabase = ctx.supabase;
  const callerEmail = ctx.user.email.toLowerCase();

  // Authorize BEFORE creating any auth account: the caller must be an admin,
  // or own every target profile. (Doing this first prevents an authenticated
  // user from creating arbitrary accounts by passing profiles they don't own.)
  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", callerEmail)
    .maybeSingle();

  if (!adminRow) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, owner_email")
      .in("id", profileIds);
    const owned = new Set(
      (profs ?? [])
        .filter((p) => (p as { owner_email: string | null }).owner_email === callerEmail)
        .map((p) => (p as { id: string }).id),
    );
    if (!profileIds.every((id) => owned.has(id))) {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }
  }

  // Ensure an auth account exists so the guest can receive an OTP.
  const admin = createAdminClient();
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr && !/already/i.test(createErr.message)) {
    return NextResponse.json({ error: createErr.message }, { status: 500 });
  }

  // RLS is the final guard on the actual grant rows.
  const { error } = await supabase
    .from("profile_grants")
    .upsert(
      profileIds.map((profile_id) => ({ profile_id, granted_email: email })),
      { onConflict: "profile_id,granted_email" },
    );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
