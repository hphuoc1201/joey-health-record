"use client";

import { useState } from "react";
import { UserPlus, Pencil, X, Loader2, Save, User as UserIcon } from "lucide-react";
import type { Profile } from "@/lib/types";
import {
  useSaveProfile,
  useDeleteProfile,
  canEditProfile,
  type ProfileInput,
} from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { DeleteButton } from "./DeleteButton";
import { formatDate } from "@/lib/format";

export function ProfilesManager({ profiles }: { profiles: Profile[] }) {
  const { canManage } = useAuth();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {adding ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Thêm thành viên</h2>
                <button
                  onClick={() => setAdding(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ProfileFields onSaved={() => setAdding(false)} />
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white py-3 text-sm font-medium text-gray-600 transition hover:border-brand-300 hover:text-brand-600"
            >
              <UserPlus className="h-4 w-4" />
              Thêm thành viên
            </button>
          )}
        </div>
      )}

      {profiles.length === 0 && !adding ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">
          {canManage
            ? "Chưa có thành viên nào. Hãy thêm người đầu tiên."
            : "Chưa có hồ sơ nào được chia sẻ với bạn."}
        </p>
      ) : (
        <ul className="space-y-3">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const auth = useAuth();
  const canEdit = canEditProfile(profile, auth);
  // Admin sees whose family each profile belongs to.
  const ownerLabel =
    auth.isAdmin && profile.owner_email && profile.owner_email !== auth.email
      ? profile.owner_email
      : null;
  const [editing, setEditing] = useState(false);
  const deleteProfile = useDeleteProfile();

  if (editing) {
    return (
      <li className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Sửa thông tin</h2>
          <button
            onClick={() => setEditing(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ProfileFields profile={profile} onSaved={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="card card-hover flex items-center gap-3 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <UserIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{profile.full_name}</p>
        <p className="truncate text-sm text-gray-500">
          {[profile.relationship, profile.dob ? formatDate(profile.dob) : null]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
        {ownerLabel && (
          <p className="mt-0.5 truncate text-xs text-gray-400">
            Chủ hộ: {ownerLabel}
          </p>
        )}
      </div>
      {canEdit && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setEditing(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 active:scale-90"
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <DeleteButton
            action={async () => {
              await deleteProfile.mutateAsync(profile.id);
            }}
            confirmText={`Xóa hồ sơ "${profile.full_name}" và tất cả lần khám của người này?`}
          />
        </div>
      )}
    </li>
  );
}

function ProfileFields({
  profile,
  onSaved,
}: {
  profile?: Profile;
  onSaved: () => void;
}) {
  const saveProfile = useSaveProfile();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = String(fd.get(k) ?? "").trim();
      return v.length > 0 ? v : null;
    };
    const values: ProfileInput = {
      full_name: String(fd.get("full_name") ?? "").trim(),
      relationship: str("relationship"),
      dob: str("dob"),
      gender: str("gender"),
      notes: str("notes"),
    };
    if (!values.full_name) return;
    try {
      await saveProfile.mutateAsync({ id: profile?.id, values });
      onSaved();
    } catch {
      setError("Lưu thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="full_name"
        required
        placeholder="Họ và tên *"
        defaultValue={profile?.full_name ?? ""}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="relationship"
          placeholder="Quan hệ (Ba, Mẹ...)"
          defaultValue={profile?.relationship ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <select
          name="gender"
          defaultValue={profile?.gender ?? ""}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Giới tính</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs text-gray-500">Ngày sinh</span>
        <input
          type="date"
          name="dob"
          defaultValue={profile?.dob ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <textarea
        name="notes"
        rows={2}
        placeholder="Ghi chú (tiền sử bệnh, dị ứng...)"
        defaultValue={profile?.notes ?? ""}
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saveProfile.isPending}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {saveProfile.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Lưu
      </button>
    </form>
  );
}
