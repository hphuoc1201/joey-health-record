"use client";

import { useMemo } from "react";
import type { Profile } from "@/lib/types";
import { Combobox, type ComboOption } from "./Combobox";

// Searchable member picker for the timeline. Scales to any number of members
// (no horizontal tab scrolling) and supports typing to search.
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
    () => profiles.map((p) => ({ value: p.id, label: p.full_name })),
    [profiles],
  );

  return (
    <div className="mb-4">
      <p className="mb-1.5 text-sm text-gray-500">
        Đang xem lịch sử khám bệnh của
      </p>
      <Combobox
        options={options}
        value={value}
        onChange={onChange}
        placeholder="— Chọn thành viên —"
        searchPlaceholder="Tìm theo tên..."
      />
    </div>
  );
}

// Remember the last-viewed patient per signed-in user.
export function lastPatientKey(email: string): string {
  return `health-record:last-patient:${email}`;
}
