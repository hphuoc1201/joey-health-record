import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEV_LOGIN } from "@/lib/config";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

// TESTING ONLY (gated by DEV_LOGIN). Given an email, ensures the auth user
// exists and returns a one-time code so the client can establish a session
// without waiting for an emailed OTP. generateLink does not send any email.
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
    email_confirm: true,
  });
  if (createErr && !/already/i.test(createErr.message)) {
    return NextResponse.json({ error: createErr.message }, { status: 500 });
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data.properties?.email_otp) {
    return NextResponse.json(
      { error: error?.message ?? "Không tạo được phiên." },
      { status: 500 },
    );
  }

  return NextResponse.json({ otp: data.properties.email_otp });
}
