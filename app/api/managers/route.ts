import { NextResponse } from "next/server";
import { z } from "zod";
import { clientFromRequest } from "@/lib/supabase/from-token";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

// Returns the caller's RLS-bound client if they are an admin, else null.
async function requireAdmin(request: Request) {
  const ctx = await clientFromRequest(request);
  if (!ctx?.user.email) return null;
  const { data: adminRow } = await ctx.supabase
    .from("admins")
    .select("email")
    .eq("email", ctx.user.email.toLowerCase())
    .maybeSingle();
  return adminRow ? ctx.supabase : null;
}

// Appoint a manager: ensure an auth account exists (service_role) and add
// their email to the managers table. Admin only.
export async function POST(request: Request) {
  const supabase = await requireAdmin(request);
  if (!supabase) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  }
  const { email } = parsed.data;

  const admin = createAdminClient();
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr && !/already/i.test(createErr.message)) {
    return NextResponse.json({ error: createErr.message }, { status: 500 });
  }

  const { error } = await supabase
    .from("managers")
    .upsert({ email }, { onConflict: "email" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Remove a manager. Their auth account and any profiles they own remain, but
// they lose manager rights (RLS stops matching is_manager()). Admin only.
export async function DELETE(request: Request) {
  const supabase = await requireAdmin(request);
  if (!supabase) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  }

  const { error } = await supabase
    .from("managers")
    .delete()
    .eq("email", parsed.data.email);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
