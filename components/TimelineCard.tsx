import Link from "next/link";
import { Building2, Stethoscope, ChevronRight } from "lucide-react";
import type { VisitWithProfile } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function TimelineCard({ visit }: { visit: VisitWithProfile }) {
  return (
    <Link
      href={`/visit/${visit.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <span className="font-medium text-gray-700">
              {formatDate(visit.visit_date)}
            </span>
            {visit.profiles && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                {visit.profiles.full_name}
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
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-300" />
      </div>
    </Link>
  );
}
