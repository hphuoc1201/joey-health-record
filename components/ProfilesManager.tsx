"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Pencil, X, ChevronRight } from "lucide-react";
import type { Profile } from "@/lib/types";
import { useDeleteProfile, canEditProfile } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { DeleteButton } from "./DeleteButton";
import { ProfileFields } from "./ProfileFields";
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

