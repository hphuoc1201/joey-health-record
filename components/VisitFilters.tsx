"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import clsx from "clsx";
import type { VisitWithProfile } from "@/lib/types";

export interface Filters {
  hospital: string;
  specialty: string;
  code: string;
  from: string; // yyyy-mm-dd
  to: string;
}

export const EMPTY_FILTERS: Filters = {
  hospital: "",
  specialty: "",
  code: "",
  from: "",
  to: "",
};

export function activeFilterCount(f: Filters): number {
  return Object.values(f).filter((v) => v).length;
}

// Narrow a visit list by the active filters.
export function applyFilters(
  visits: VisitWithProfile[],
  f: Filters,
): VisitWithProfile[] {
  return visits.filter((v) => {
    if (f.hospital && v.hospital !== f.hospital) return false;
    if (f.specialty && v.specialty !== f.specialty) return false;
    if (f.code && !(v.diagnoses ?? []).some((d) => d.code === f.code))
      return false;
    if (f.from && v.visit_date < f.from) return false;
    if (f.to && v.visit_date > f.to) return false;
    return true;
  });
}

export function VisitFilters({
  visits,
  filters,
  onChange,
}: {
  visits: VisitWithProfile[];
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters);

  // Distinct option lists derived from the patient's visits.
  const hospitals = useMemo(
    () => distinct(visits.map((v) => v.hospital)),
    [visits],
  );
  const specialties = useMemo(
    () => distinct(visits.map((v) => v.specialty)),
    [visits],
  );
  const codes = useMemo(
    () =>
      distinct(visits.flatMap((v) => (v.diagnoses ?? []).map((d) => d.code))),
    [visits],
  );

  function set<K extends keyof Filters>(key: K, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "btn-secondary",
          count > 0 && "border-brand-300 text-brand-700",
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Lọc
        {count > 0 && (
          <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="card mt-2 space-y-3 p-4">
          <Row label="Bệnh viện">
            <Select
              value={filters.hospital}
              onChange={(v) => set("hospital", v)}
              options={hospitals}
              anyLabel="Tất cả bệnh viện"
            />
          </Row>
          <Row label="Chuyên khoa">
            <Select
              value={filters.specialty}
              onChange={(v) => set("specialty", v)}
              options={specialties}
              anyLabel="Tất cả chuyên khoa"
            />
          </Row>
          <Row label="Mã bệnh (ICD-10)">
            <Select
              value={filters.code}
              onChange={(v) => set("code", v)}
              options={codes}
              anyLabel="Tất cả mã bệnh"
            />
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Từ ngày">
              <input
                type="date"
                value={filters.from}
                onChange={(e) => set("from", e.target.value)}
                className="input !py-2 text-sm"
              />
            </Row>
            <Row label="Đến ngày">
              <input
                type="date"
                value={filters.to}
                onChange={(e) => set("to", e.target.value)}
                className="input !py-2 text-sm"
              />
            </Row>
          </div>

          {count > 0 && (
            <button
              onClick={() => onChange(EMPTY_FILTERS)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
            >
              <X className="h-4 w-4" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function distinct(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort(
    (a, b) => a.localeCompare(b, "vi"),
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
  anyLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  anyLabel: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input !py-2 text-sm"
    >
      <option value="">{anyLabel}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
