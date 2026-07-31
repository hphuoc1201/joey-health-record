import Link from "next/link";
import clsx from "clsx";
import { Building2, Stethoscope, ChevronRight, Check } from "lucide-react";
import type { VisitWithProfile } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function TimelineCard({
  visit,
  selectMode = false,
  selected = false,
  onToggle,
}: {
  visit: VisitWithProfile;
  selectMode?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
}) {
  const diagnoses = visit.diagnoses ?? [];
  const codes = diagnoses.map((d) => d.code).filter(Boolean);
  const title =
    diagnoses.length > 0
      ? diagnoses.map((d) => d.name).filter(Boolean).join(", ")
      : visit.diagnosis || "Chưa có chẩn đoán";

  const inner = (
    <div className="flex items-start justify-between gap-3">
      {selectMode && (
        <div
          className={clsx(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
            selected
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-gray-300 bg-white",
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span className="font-medium text-gray-700">
            {formatDate(visit.visit_date)}
          </span>
          {codes.slice(0, 3).map((code) => (
            <span
              key={code}
              className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-600"
            >
              {code}
            </span>
          ))}
          {codes.length > 3 && (
            <span className="text-[11px] text-gray-400">+{codes.length - 3}</span>
          )}
        </div>

        <h3 className="truncate text-base font-semibold text-gray-900">{title}</h3>

        <div className="mt-1.5 space-y-1 text-sm text-gray-600">
          {visit.hospital && (
            <p className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="truncate">{visit.hospital}</span>
            </p>
          )}
          {visit.specialty && (
            <p className="flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="truncate">{visit.specialty}</span>
            </p>
          )}
        </div>
      </div>
      {!selectMode && (
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition-transform duration-150 group-hover:translate-x-0.5" />
      )}
    </div>
  );

  if (selectMode) {
    return (
      <button
        type="button"
        onClick={() => onToggle?.(visit.id)}
        className={clsx(
          "card block w-full p-4 text-left transition-all duration-150 active:scale-[0.99]",
          selected && "border-brand-400 ring-2 ring-brand-100",
        )}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link href={`/visit?id=${visit.id}`} className="card card-hover block p-4">
      {inner}
    </Link>
  );
}
