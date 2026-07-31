"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AccountPage() {
  const router = useRouter();
  const { supabase, email, role } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Tài khoản</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <UserIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-medium text-gray-900">
              <Mail className="h-4 w-4 text-gray-400" />
              {email}
            </p>
            <p className="mt-0.5 text-sm">
              {role === "admin" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  <ShieldCheck className="h-3 w-3" />
                  Quản trị viên
                </span>
              ) : role === "manager" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  Người quản lý
                </span>
              ) : (
                <span className="text-gray-500">Người xem</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
      >
        {signingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        Đăng xuất
      </button>
    </div>
  );
}
