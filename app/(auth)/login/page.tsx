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

    setLoading(false);

    if (error) {
      setError(
        "Không gửi được mã. Email này chưa được cấp quyền truy cập, hoặc vui lòng thử lại sau.",
      );
      return;
    }

    router.push(`/verify?email=${encodeURIComponent(cleanEmail)}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 md:grid md:grid-cols-2 md:bg-none">
      {/* Form side */}
      <div className="flex min-h-screen items-center justify-center p-4 md:bg-white">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl md:rounded-none md:p-0 md:shadow-none">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-fab">
              <HeartPulse className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Đăng nhập</h1>
            <p className="mt-1 text-sm text-gray-500">
              {DEV_LOGIN
                ? "Chế độ thử nghiệm — nhập email để vào."
                : "Nhập email để nhận mã xác thực."}
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

      {/* Brand side (desktop) */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 md:flex md:flex-col md:justify-between md:p-10 md:text-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-2 font-semibold">
          <HeartPulse className="h-5 w-5" />
          Hồ sơ sức khỏe
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-snug">
            Lưu giữ hồ sơ khám bệnh
            <br />
            của cả gia đình, an toàn.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Ghi lại từng lần khám, đính kèm kết quả xét nghiệm, toa thuốc và hóa
            đơn. Chia sẻ an toàn cho người thân, tải nhanh khi cần đi bảo hiểm.
          </p>
        </div>
        <div className="relative flex items-center gap-3 text-sm text-white/70">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            🔒
          </span>
          Dữ liệu được bảo vệ bằng phân quyền chặt chẽ ở tầng cơ sở dữ liệu.
        </div>
      </div>
    </main>
  );
}
