"use client";

import { useState } from "react";
import clsx from "clsx";
import { Loader2, Save } from "lucide-react";
import type { Profile } from "@/lib/types";
import { useSaveProfile, type ProfileInput } from "@/lib/queries";
import { GENDERS } from "@/lib/relationships";

// The add/edit member form fields. Shared by the Members page and the
// "add a member first" flow inside Add Visit.
export function ProfileFields({
  profile,
  onSaved,
  onCreated,
  submitLabel = "Lưu thành viên",
}: {
  profile?: Profile;
  onSaved?: () => void;
  // Called with the new profile's id after a successful *create*.
  onCreated?: (id: string) => void;
  submitLabel?: string;
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
      const newId = await saveProfile.mutateAsync({ id: profile?.id, values });
      if (!profile?.id && newId) onCreated?.(newId);
      onSaved?.();
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
        {submitLabel}
      </button>
    </form>
  );
}
