"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { UserPlus, Pencil, X, Loader2, Save, ChevronRight } from "lucide-react";
import type { Profile } from "@/lib/types";
import {
  useSaveProfile,
  useDeleteProfile,
  canEditProfile,
  type ProfileInput,
} from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { DeleteButton } from "./DeleteButton";
import { GENDERS } from "@/lib/relationships";
import { formatDate } from "@/lib/format";

function genderLabel(value: string | null): string | null {
  return GENDERS.find((g) => g.value === value)?.label ?? null;
}

export function ProfilesManager({ profiles }: { profiles: Profile[] }) {
  const { canManage } = useAuth();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {adding ? (
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Thêm thành viên</h2>
                <button
                  onClick={() => setAdding(false)}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ProfileFields onSaved={() => setAdding(false)} />
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white py-3 text-sm font-medium text-gray-600 transition-all duration-150 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 active:scale-[0.99]"
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
            ? "Chưa có thành viên nào. Bấm “Thêm thành viên” để bắt đầu."
            : "Chưa có thành viên nào được chia sẻ với bạn."}
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
      <li className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Sửa thông tin thành viên</h2>
          <button
            onClick={() => setEditing(false)}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ProfileFields profile={profile} onSaved={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="card card-hover group flex items-center gap-3 p-4">
      <Link
        href={`/member?id=${profile.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">
            {profile.full_name}
          </p>
          <p className="truncate text-sm text-gray-500">
            {[
              genderLabel(profile.gender),
              profile.dob ? formatDate(profile.dob) : null,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
          {ownerLabel && (
            <p className="mt-0.5 truncate text-xs text-gray-400">
              Chủ hộ: {ownerLabel}
            </p>
          )}
        </div>
      </Link>
      <ChevronRight className="hidden h-5 w-5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400 sm:block" />
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
            confirmText={`Xóa thành viên "${profile.full_name}" và toàn bộ lần khám của người này?`}
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
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [dob, setDob] = useState(profile?.dob ?? "");
  const [notes, setNotes] = useState(profile?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function trimmed(v: string): string | null {
    const t = v.trim();
    return t.length > 0 ? t : null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const values: ProfileInput = {
      full_name: fullName.trim(),
      relationship: null,
      dob: trimmed(dob),
      gender: trimmed(gender),
      notes: trimmed(notes),
    };
    if (!values.full_name) return;
    try {
      await saveProfile.mutateAsync({ id: profile?.id, values });
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Lưu thất bại: ${err.message}`
          : "Lưu thất bại. Vui lòng thử lại.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Họ và tên <span className="text-red-500">*</span>
        </span>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="VD: Nguyễn Văn An"
          className="input"
        />
      </label>

      <div>
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Giới tính
        </span>
        <div className="flex gap-2">
          {GENDERS.map((g) => {
            const selected = gender === g.value;
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setGender(selected ? "" : g.value)}
                className={clsx(
                  "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.97]",
                  selected
                    ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50",
                )}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Ngày sinh
        </span>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="input"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Ghi chú
        </span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tiền sử bệnh, dị ứng thuốc, nhóm máu..."
          className="input resize-none"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saveProfile.isPending}
        className="btn-primary !py-2 text-sm"
      >
        {saveProfile.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Lưu thành viên
      </button>
    </form>
  );
}
