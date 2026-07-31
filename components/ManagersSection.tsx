"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, UserPlus, X } from "lucide-react";
import { useManagers, useAddManager, useRemoveManager } from "@/lib/queries";

// Admin-only: appoint/remove family managers. Each manager runs their own
// family: they create their own patients and only see what they created.
export function ManagersSection() {
  const { data: managers, isPending } = useManagers();
  const addManager = useAddManager();
  const removeManager = useRemoveManager();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addManager.mutateAsync(email.trim().toLowerCase());
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm.");
    }
  }

  return (
    <section className="card mb-6 p-4">
      <h2 className="mb-1 flex items-center gap-2 font-semibold">
        <ShieldCheck className="h-4 w-4 text-brand-600" />
        Người quản lý
      </h2>
      <p className="mb-3 text-sm text-gray-500">
        Mỗi người quản lý tự thêm và quản lý thành viên gia đình của riêng họ. Họ
        chỉ thấy thành viên do chính họ tạo; bạn (admin) thấy tất cả.
      </p>

      {isPending ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {(managers ?? []).length > 0 && (
            <ul className="mb-3 space-y-2">
              {(managers ?? []).map((m) => (
                <li
                  key={m.email}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-gray-700">
                    {m.email}
                  </span>
                  <button
                    type="button"
                    disabled={removeManager.isPending}
                    onClick={() => removeManager.mutate(m.email)}
                    className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Gỡ quyền quản lý"
                  >
                    {removeManager.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email-nguoi-quan-ly@gmail.com"
              className="input min-w-0 flex-1 !py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addManager.isPending}
              className="btn-primary !px-3 !py-2 text-sm"
            >
              {addManager.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Bổ nhiệm
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </>
      )}
    </section>
  );
}
