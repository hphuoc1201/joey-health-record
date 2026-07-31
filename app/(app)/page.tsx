"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlusCircle, CalendarClock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfiles, useVisits } from "@/lib/queries";
import { TimelineCard } from "@/components/TimelineCard";
import { MemberFilter } from "@/components/MemberFilter";
import { formatMonthYear } from "@/lib/format";
import type { VisitWithProfile } from "@/lib/types";

function Timeline() {
  const { isAdmin } = useAuth();
  const params = useSearchParams();
  const profileFilter = params.get("profile") ?? undefined;

  const { data: profiles } = useProfiles();
  const { data: visits, isPending } = useVisits(profileFilter);

  const groups = groupByMonth(visits ?? []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dòng thời gian</h1>
        {isAdmin && (
          <Link
            href="/visit/new"
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <PlusCircle className="h-4 w-4" />
            Thêm lần khám
          </Link>
        )}
      </div>

      <MemberFilter profiles={profiles ?? []} />

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState isAdmin={isAdmin} />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.visits.map((v) => (
                  <TimelineCard key={v.id} visit={v} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={null}>
      <Timeline />
    </Suspense>
  );
}

function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <CalendarClock className="mb-3 h-10 w-10 text-gray-300" />
      <p className="font-medium text-gray-700">Chưa có lần khám nào</p>
      <p className="mt-1 text-sm text-gray-500">
        {isAdmin
          ? "Thêm lần khám đầu tiên để bắt đầu lưu hồ sơ."
          : "Chưa có hồ sơ nào được chia sẻ với bạn."}
      </p>
      {isAdmin && (
        <Link
          href="/visit/new"
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Thêm lần khám
        </Link>
      )}
    </div>
  );
}

interface MonthGroup {
  key: string;
  label: string;
  visits: VisitWithProfile[];
}

function groupByMonth(visits: VisitWithProfile[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const v of visits) {
    const key = v.visit_date.slice(0, 7); // yyyy-mm
    if (!map.has(key)) {
      map.set(key, { key, label: formatMonthYear(v.visit_date), visits: [] });
    }
    map.get(key)!.visits.push(v);
  }
  return Array.from(map.values());
}
