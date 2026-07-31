"use client";

import { useMemo } from "react";
import { User as UserIcon } from "lucide-react";
import type { Profile } from "@/lib/types";
import { Combobox, type ComboOption } from "./Combobox";

// Searchable patient picker for the timeline. Scales to any number of
// patients (no horizontal tab scrolling) and supports typing to search.
export function PatientSelect({
  profiles,
  value,
  onChange,
}: {
  profiles: Profile[];
  value: string;
  onChange: (profileId: string) => void;
}) {
  const options = useMemo<ComboOption[]>(
    () =>
      profiles.map((p) => ({
        value: p.id,
        label: p.relationship
          ? `${p.full_name} (${p.relationship})`
          : p.full_name,
      })),
    [profiles],
  );

  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <UserIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <Combobox
          options={options}
          value={value}
          onChange={onChange}
          placeholder="— Chọn bệnh nhân —"
          searchPlaceholder="Tìm theo tên bệnh nhân..."
        />
      </div>
    </div>
  );
}

// Remember the last-viewed patient per signed-in user.
export function lastPatientKey(email: string): string {
  return `health-record:last-patient:${email}`;
}
