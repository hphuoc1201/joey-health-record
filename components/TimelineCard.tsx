import Link from "next/link";
import { Building2, Stethoscope, ChevronRight } from "lucide-react";
import type { VisitWithProfile } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function TimelineCard({ visit }: { visit: VisitWithProfile }) {
  return (
    <Link href={`/visit?id=${visit.id}`} className="card card-hover block p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <span className="font-medium text-gray-700">
              {formatDate(visit.visit_date)}
            </span>
            {visit.icd_code && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-600">
                {visit.icd_code}
              </span>
            )}
          </div>

          <h3 className="truncate text-base font-semibold text-gray-900">
            {visit.diagnosis || "Chưa có chẩn đoán"}
          </h3>

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
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition-transform duration-150 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
