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

  // Ensure an auth account exists so the guest can receive an OTP.
  const admin = createAdminClient();
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr && !/already/i.test(createErr.message)) {
    return NextResponse.json({ error: createErr.message }, { status: 500 });
  }

  // RLS rejects any profile the caller neither owns nor administers.
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
