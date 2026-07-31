"use client";

import { useState } from "react";
import { Mail, UserPlus, Loader2, X, ChevronDown, Lock } from "lucide-react";
import clsx from "clsx";
import {
  useGrantAccess,
  useRevokeAccess,
  type ShareVisit,
} from "@/lib/queries";
import { formatDate } from "@/lib/format";

export function ShareManager({ visits }: { visits: ShareVisit[] }) {
  if (visits.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">
        Chưa có lần khám nào để chia sẻ.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {visits.map((v) => (
        <ShareCard key={v.id} visit={v} />
      ))}
    </ul>
  );
}

function ShareCard({ visit }: { visit: ShareVisit }) {
  const [open, setOpen] = useState(visit.access_grants.length > 0);

  return (
    <li className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">
            {visit.diagnosis || "Chưa có chẩn đoán"}
          </p>
          <p className="truncate text-sm text-gray-500">
            {formatDate(visit.visit_date)}
            {visit.profiles ? ` · ${visit.profiles.full_name}` : ""}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          <Lock className="h-3 w-3" />
          {visit.access_grants.length}
        </span>
        <ChevronDown
          className={clsx(
            "h-5 w-5 shrink-0 text-gray-400 transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4">
          {visit.access_grants.length > 0 ? (
            <ul className="mb-3 space-y-2">
              {visit.access_grants.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="min-w-0 flex-1 truncate text-gray-700">
                    {g.granted_email}
                  </span>
                  <RevokeButton grantId={g.id} visitId={visit.id} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-gray-400">
              Chưa chia sẻ với ai. Chỉ bạn (admin) xem được lần khám này.
            </p>
          )}

          <AddEmailForm visitId={visit.id} />
        </div>
      )}
    </li>
  );
}

function RevokeButton({ grantId, visitId }: { grantId: string; visitId: string }) {
  const revoke = useRevokeAccess();
  return (
    <button
      type="button"
      disabled={revoke.isPending}
      onClick={() => revoke.mutate({ grantId, visitId })}
      className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
      title="Thu hồi quyền"
    >
      {revoke.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </button>
  );
}

function AddEmailForm({ visitId }: { visitId: string }) {
  const grant = useGrantAccess();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await grant.mutateAsync({ visitId, email: email.trim().toLowerCase() });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chia sẻ.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@gmail.com"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={grant.isPending}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {grant.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Chia sẻ
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
