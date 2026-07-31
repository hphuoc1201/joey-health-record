"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  canEditProfile,
  useProfiles,
  useManagers,
  useAddManager,
  useRemoveManager,
  useGuests,
  useAddGuest,
  useRemoveGuestGrant,
} from "@/lib/queries";
import { MultiCombobox, type MultiItem } from "./MultiCombobox";
import { ErrorState } from "./ErrorState";

type Role = "guest" | "manager";

export function ShareCenter() {
  const auth = useAuth();
  const { isAdmin } = auth;
  const profilesQ = useProfiles();
  const managersQ = useManagers();
  const guestsQ = useGuests();

  const addManager = useAddManager();
  const addGuest = useAddGuest();
  const removeManager = useRemoveManager();
  const removeGuest = useRemoveGuestGrant();

  const [role, setRole] = useState<Role>("guest");
  const [email, setEmail] = useState("");
  const [patients, setPatients] = useState<MultiItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Only patients the current user may manage can be shared.
  const patientOptions = useMemo(
    () =>
      (profilesQ.data ?? [])
        .filter((p) => canEditProfile(p, auth))
        .map((p) => ({ value: p.id, label: p.full_name })),
    [profilesQ.data, auth],
  );

  const submitting = addManager.isPending || addGuest.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (role === "manager") {
        await addManager.mutateAsync(cleanEmail);
        setOk(`Đã bổ nhiệm ${cleanEmail} làm người quản lý.`);
      } else {
        if (patients.length === 0) {
          setError("Chọn ít nhất một thành viên để chia sẻ.");
          return;
        }
        await addGuest.mutateAsync({
          email: cleanEmail,
          profileIds: patients.map((p) => p.value),
        });
        setOk(`Đã chia sẻ với ${cleanEmail}.`);
      }
      setEmail("");
      setPatients([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chia sẻ.");
    }
  }

  if (profilesQ.error) {
    return (
      <ErrorState error={profilesQ.error} onRetry={() => profilesQ.refetch()} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Share form */}
      <form onSubmit={handleSubmit} className="card space-y-3 p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email người được chia sẻ
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nguoi-than@gmail.com"
            className="input"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Vai trò
          </label>
          <div className="flex gap-2">
            <RoleButton
              active={role === "guest"}
              onClick={() => setRole("guest")}
              title="Khách (chỉ xem)"
              desc="Chỉ xem hồ sơ của những thành viên được chọn"
            />
            {isAdmin && (
              <RoleButton
                active={role === "manager"}
                onClick={() => setRole("manager")}
                title="Người quản lý"
                desc="Tự thêm & quản lý thành viên gia đình của họ"
              />
            )}
          </div>
        </div>

        {role === "guest" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cho xem hồ sơ của thành viên
            </label>
            <MultiCombobox
              options={patientOptions}
              items={patients}
              onChange={setPatients}
              allowCustom={false}
              showCode={false}
              placeholder="Chọn thành viên..."
              searchPlaceholder="Tìm thành viên..."
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-emerald-600">{ok}</p>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {role === "manager" ? "Bổ nhiệm" : "Chia sẻ"}
        </button>
      </form>

      {/* Guests */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
          <Users className="h-4 w-4" />
          Khách (chỉ xem)
        </h2>
        {guestsQ.isPending ? (
          <Spinner />
        ) : (guestsQ.data ?? []).length === 0 ? (
          <Empty text="Chưa chia sẻ cho khách nào." />
        ) : (
          <ul className="space-y-3">
            {guestsQ.data!.map((g) => (
              <li key={g.email} className="card p-4">
                <p className="mb-2 flex items-center gap-2 font-medium text-gray-900">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {g.email}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {g.grants.map((grant) => (
                    <li
                      key={grant.id}
                      className="flex items-center gap-1.5 rounded-lg bg-gray-100 py-1 pl-2.5 pr-1 text-sm text-gray-700"
                    >
                      {grant.full_name ?? "—"}
                      <button
                        type="button"
                        disabled={removeGuest.isPending}
                        onClick={() => removeGuest.mutate(grant.id)}
                        className="flex h-5 w-5 items-center justify-center rounded text-gray-400 transition-colors hover:bg-white hover:text-red-600"
                        title="Thu hồi"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Managers (admin only) */}
      {isAdmin && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
            <ShieldCheck className="h-4 w-4" />
            Người quản lý
          </h2>
          {managersQ.isPending ? (
            <Spinner />
          ) : (managersQ.data ?? []).length === 0 ? (
            <Empty text="Chưa có người quản lý nào." />
          ) : (
            <ul className="space-y-2">
              {managersQ.data!.map((m) => (
                <li
                  key={m.email}
                  className="card flex items-center gap-2 p-3 text-sm"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gray-400" />
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
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function RoleButton({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 active:scale-[0.98] ${
        active
          ? "border-brand-600 bg-brand-50"
          : "border-gray-300 bg-white hover:border-gray-400"
      }`}
    >
      <span className="block text-sm font-medium text-gray-900">{title}</span>
      <span className="mt-0.5 block text-xs text-gray-500">{desc}</span>
    </button>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
      {text}
    </p>
  );
}
