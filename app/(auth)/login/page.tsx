"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEV_LOGIN } from "@/lib/config";
import { HeartPulse, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Go home. (Gating is fully client-side now.)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const cleanEmail = email.trim().toLowerCase();

    if (DEV_LOGIN) {
      // TESTING: sign in with just the email, no OTP. The server sets a known
      // password; we sign in with it here.
      try {
        const res = await fetch("/api/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const body = (await res.json()) as { password?: string; error?: string };
        if (!res.ok || !body.password) {
          throw new Error(body.error ?? "Lỗi đăng nhập.");
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: body.password,
        });
        if (error) throw error;
        router.replace("/");
        router.refresh();
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? err.message : "Không đăng nhập được.");
      }
      return;
    }

    // shouldCreateUser: false — only accounts the admin has already created can
    // receive a code. Unknown emails get no OTP, blocking outsiders.
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: false },
    });

    if (error) {
      setLoading(false);
      setError(
        "Không gửi được mã. Email này chưa được cấp quyền truy cập, hoặc vui lòng thử lại sau.",
      );
      return;
    }

    // Keep the button in its loading state through the navigation so it never
    // flashes back to normal before the OTP screen appears.
    router.push(`/verify?email=${encodeURIComponent(cleanEmail)}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 md:grid md:grid-cols-2 md:bg-none">
      {/* Mobile: family photo as full background (falls back to gradient). */}
      <div
        className="absolute inset-0 bg-cover bg-center md:hidden"
        style={{ backgroundImage: "url(/login.jpg)" }}
      />
      <div className="absolute inset-0 bg-brand-900/55 md:hidden" />

      {/* Form side */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 md:bg-white">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl md:rounded-none md:p-0 md:shadow-none">
          <div className="mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="mb-4 h-12 w-12 rounded-2xl shadow-fab" />
            <h1 className="text-2xl font-bold tracking-tight">Đăng nhập</h1>
            <p className="mt-1 text-sm text-gray-500">
              {DEV_LOGIN
                ? "Chế độ thử nghiệm — nhập email để vào."
                : "Lưu hồ sơ khám bệnh & theo dõi bảo hiểm cho cả gia đình."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@gmail.com"
                className="input"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {DEV_LOGIN ? "Đăng nhập" : "Gửi mã xác thực"}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-400">
            {DEV_LOGIN
              ? "Chế độ thử nghiệm: bỏ qua mã OTP. Sẽ bật lại khi dùng thật."
              : "Chỉ những email đã được cấp quyền mới đăng nhập được."}
          </p>
        </div>
      </div>

      {/* Brand side (desktop): family photo with a readable gradient overlay. */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 md:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-800/90 via-brand-700/40 to-brand-600/10" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-2 font-semibold">
            <HeartPulse className="h-5 w-5" />
            Hồ sơ sức khỏe
          </div>
          <div>
            <h2 className="text-3xl font-bold leading-snug">
              Lưu hồ sơ, theo dõi sức khỏe
              <br />
              và claim bảo hiểm — cho cả nhà.
            </h2>
            <p className="mt-4 max-w-md text-white/85">
              Ghi lại mỗi lần khám cùng kết quả xét nghiệm, toa thuốc và hóa đơn.
              Theo dõi diễn tiến qua từng năm, biết ngay lần nào đã claim bảo
              hiểm — lần nào chưa, và tải giấy tờ gửi bảo hiểm chỉ trong vài giây.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/80">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              🔒
            </span>
            Dữ liệu bảo mật, phân quyền chặt chẽ ngay ở tầng cơ sở dữ liệu.
          </div>
        </div>
      </div>
    </main>
  );
}
