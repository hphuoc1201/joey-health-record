import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  visitId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email(),
});

// The one remaining server endpoint: sharing a visit requires creating an
// auth account for the invited email (service_role), which must never run
// in the browser. The caller must be an authenticated admin.
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const { visitId, email } = parsed.data;

  // Verify the caller's session and admin status via their cookie-bound client.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();
  if (!adminRow) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const admin = createAdminClient();

  // Ensure an auth account exists so the invitee can receive an OTP.
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr && !/already/i.test(createErr.message)) {
    return NextResponse.json({ error: createErr.message }, { status: 500 });
  }

  // Insert the grant with the caller's RLS-bound client (admin policy allows it).
  const { error } = await supabase
    .from("access_grants")
    .upsert(
      { visit_id: visitId, granted_email: email },
      { onConflict: "visit_id,granted_email" },
    );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
