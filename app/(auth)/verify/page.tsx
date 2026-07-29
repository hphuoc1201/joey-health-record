"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Loader2 } from "lucide-react";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: "email",
    });

    setLoading(false);

    if (error) {
      setError("Mã không đúng hoặc đã hết hạn. Vui lòng thử lại.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">Nhập mã xác thực</h1>
          <p className="mt-1 text-sm text-gray-500">
            Chúng tôi đã gửi mã 6 số đến
            <br />
            <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            maxLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || token.length < 6}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận
          </button>
        </form>

        <button
          onClick={() => router.push("/login")}
          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          Đổi email khác
        </button>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
