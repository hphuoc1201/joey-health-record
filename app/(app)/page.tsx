import Link from "next/link";
import { Suspense } from "react";
import { PlusCircle, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { TimelineCard } from "@/components/TimelineCard";
import { MemberFilter } from "@/components/MemberFilter";
import { formatMonthYear } from "@/lib/format";
import type { Profile, VisitWithProfile } from "@/lib/types";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string }>;
}) {
  const { profile: profileFilter } = await searchParams;
  const session = await getSessionContext();
  const supabase = await createClient();

  // RLS ensures only accessible profiles/visits come back.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  let query = supabase
    .from("visits")
    .select("*, profiles(id, full_name, relationship)")
    .order("visit_date", { ascending: false });

  if (profileFilter) query = query.eq("profile_id", profileFilter);

  const { data: visits } = await query;

  const groups = groupByMonth((visits ?? []) as VisitWithProfile[]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dòng thời gian</h1>
        {session?.isAdmin && (
          <Link
            href="/visit/new"
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <PlusCircle className="h-4 w-4" />
            Thêm lần khám
          </Link>
        )}
      </div>

      <Suspense fallback={null}>
        <MemberFilter profiles={(profiles ?? []) as Profile[]} />
      </Suspense>

      {groups.length === 0 ? (
        <EmptyState isAdmin={session?.isAdmin ?? false} />
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
