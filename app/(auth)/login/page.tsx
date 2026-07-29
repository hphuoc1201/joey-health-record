"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HeartPulse, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const cleanEmail = email.trim().toLowerCase();

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
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <HeartPulse className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">Hồ sơ sức khỏe</h1>
          <p className="mt-1 text-sm text-gray-500">
            Đăng nhập bằng email để nhận mã xác thực
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Gửi mã xác thực
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Chỉ những email đã được cấp quyền mới đăng nhập được.
        </p>
      </div>
    </main>
  );
}
