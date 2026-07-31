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

  // Merge managers + guests into one row per email for the overview table.
  const rows = useMemo(() => {
    const map = new Map<
      string,
      {
        email: string;
        isManager: boolean;
        grants: { id: string; profile_id: string; full_name: string | null }[];
      }
    >();
    for (const g of guestsQ.data ?? []) {
      map.set(g.email, { email: g.email, isManager: false, grants: g.grants });
    }
    for (const m of managersQ.data ?? []) {
      const ex = map.get(m.email);
      if (ex) ex.isManager = true;
      else map.set(m.email, { email: m.email, isManager: true, grants: [] });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.email.localeCompare(b.email),
    );
  }, [guestsQ.data, managersQ.data]);

  const listPending = guestsQ.isPending || (isAdmin && managersQ.isPending);

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

      {/* Overview table */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
          <Users className="h-4 w-4" />
          Đang chia sẻ với {rows.length} người
        </h2>

        {listPending ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty text="Chưa chia sẻ cho ai." />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Vai trò</th>
                    <th className="px-4 py-3 font-medium">Xem được hồ sơ của</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.email} className="align-top">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 font-medium text-gray-800">
                          <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                          <span className="min-w-0 break-all">{r.email}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.isManager ? (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                            <ShieldCheck className="h-3 w-3" />
                            Người quản lý
                          </span>
                        ) : (
                          <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            Khách (chỉ xem)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.isManager && r.grants.length === 0 ? (
                          <span className="text-gray-500">Gia đình họ tự quản lý</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {r.isManager && (
                              <span className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-500">
                                Gia đình của họ
                              </span>
                            )}
                            {r.grants.map((g) => (
                              <span
                                key={g.id}
                                className="flex items-center gap-1 rounded-md bg-gray-100 py-1 pl-2 pr-1 text-xs text-gray-700"
                              >
                                {g.full_name ?? "—"}
                                <button
                                  type="button"
                                  disabled={removeGuest.isPending}
                                  onClick={() => removeGuest.mutate(g.id)}
                                  className="flex h-4 w-4 items-center justify-center rounded text-gray-400 hover:bg-white hover:text-red-600"
                                  title="Thu hồi bệnh nhân này"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.isManager && isAdmin && (
                          <button
                            type="button"
                            disabled={removeManager.isPending}
                            onClick={() => removeManager.mutate(r.email)}
                            className="whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            Gỡ quản lý
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
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
