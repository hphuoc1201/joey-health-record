import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEV_LOGIN } from "@/lib/config";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

// Fixed throwaway password used only while DEV_LOGIN is on.
const DEV_PASSWORD = "dev-testing-only-123456";

// TESTING ONLY (gated by DEV_LOGIN). Ensures the auth user exists with a known
// password so the client can sign in with signInWithPassword — a well-trodden
// path that avoids the OTP/token decoding that broke on Safari.
export async function POST(request: Request) {
  if (!DEV_LOGIN) {
    return NextResponse.json({ error: "Đã tắt." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  }
  const { email } = parsed.data;

  const admin = createAdminClient();

  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password: DEV_PASSWORD,
    email_confirm: true,
  });

  if (createErr) {
    if (!/already|registered|exists/i.test(createErr.message)) {
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    }
    // User already exists — reset the password so sign-in works.
    let id: string | undefined;
    for (let page = 1; page <= 20 && !id; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      id = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 200) break;
    }
    if (!id) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản." },
        { status: 500 },
      );
    }
    const { error: updErr } = await admin.auth.admin.updateUserById(id, {
      password: DEV_PASSWORD,
      email_confirm: true,
    });
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ password: DEV_PASSWORD });
}
