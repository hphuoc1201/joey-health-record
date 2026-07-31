"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Pencil,
  CalendarClock,
  Building2,
  Stethoscope,
  FileText,
  Activity,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfiles, useVisits, canEditProfile } from "@/lib/queries";
import { ErrorState } from "@/components/ErrorState";
import { lastPatientKey } from "@/components/PatientSelect";
import { computeMemberStats, ageFromDob } from "@/lib/member-stats";
import { formatDate } from "@/lib/format";
import { GENDERS } from "@/lib/relationships";

function MemberDetail() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const router = useRouter();
  const auth = useAuth();

  const { data: profiles, isPending: pPending, error: pError, refetch } =
    useProfiles();
  const profile = profiles?.find((p) => p.id === id);

  const { data: visits, isPending: vPending } = useVisits(id || undefined);
  const stats = useMemo(() => computeMemberStats(visits ?? []), [visits]);

  // Total documents across this member's visits.
  const { data: docCount } = useQuery({
    queryKey: ["member-doc-count", id],
    enabled: Boolean(id) && Boolean(visits),
    queryFn: async () => {
      const ids = (visits ?? []).map((v) => v.id);
      if (ids.length === 0) return 0;
      const { count } = await auth.supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .in("visit_id", ids);
      return count ?? 0;
    },
  });

  function openTimeline() {
    if (id) localStorage.setItem(lastPatientKey(auth.email), id);
    router.push("/");
  }

  if (pError) return <ErrorState error={pError} onRetry={() => refetch()} />;
  if (pPending) return <Spinner />;

  if (!profile) {
    return (
      <div className="card mt-10 border-dashed px-6 py-12 text-center">
        <p className="font-medium text-gray-700">Không tìm thấy thành viên.</p>
        <Link href="/profiles" className="btn-primary mx-auto mt-4 !px-4 !py-2 text-sm">
          Về danh sách thành viên
        </Link>
      </div>
    );
  }

  const canEdit = canEditProfile(profile, auth);
  const age = ageFromDob(profile.dob);
  const gender = GENDERS.find((g) => g.value === profile.gender)?.label;

  return (
    <div>
      <Link
        href="/profiles"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Thành viên
      </Link>

      {/* Header */}
      <div className="card mb-5 flex items-center gap-4 p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white">
          {profile.full_name.trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-gray-900">
            {profile.full_name}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {[gender, age != null ? `${age} tuổi` : null, profile.dob ? formatDate(profile.dob) : null]
              .filter(Boolean)
              .join(" · ") || "Chưa có thông tin"}
          </p>
        </div>
        {canEdit && (
          <Link href="/profiles" className="btn-secondary shrink-0">
            <Pencil className="h-4 w-4" />
            Sửa
          </Link>
        )}
      </div>

      {vPending ? (
        <Spinner />
      ) : (
        <>
          {/* Stat cards */}
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={Activity} label="Tổng lần khám" value={stats.total} />
            <Stat icon={FileText} label="Tài liệu" value={docCount ?? "…"} />
            <Stat
              icon={CalendarClock}
              label="Trung bình giữa 2 lần khám"
              value={
                stats.avgIntervalDays != null
                  ? `${stats.avgIntervalDays} ngày`
                  : "—"
              }
              small
            />
            <Stat
              icon={CalendarClock}
              label="Lần khám gần nhất"
              value={stats.lastVisit ? formatDate(stats.lastVisit) : "—"}
              small
            />
          </div>

          {stats.total === 0 ? (
            <div className="card border-dashed px-6 py-12 text-center">
              <CalendarClock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium text-gray-700">
                Thành viên này chưa có lần khám nào
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Visits per year */}
              <Panel title="Số lần khám theo năm">
                <YearBars data={stats.byYear} />
              </Panel>

              {/* Top specialties */}
              <Panel title="Chuyên khoa thường khám" icon={Stethoscope}>
                <CountList items={stats.topSpecialties} empty="Chưa có dữ liệu" />
              </Panel>

              {/* Top diagnoses */}
              <Panel title="Chẩn đoán thường gặp" icon={Activity}>
                <CountList items={stats.topDiagnoses} empty="Chưa có dữ liệu" />
              </Panel>

              {/* Quick link */}
              <Panel title="Lịch sử khám">
                <button
                  onClick={openTimeline}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-[0.99]"
                >
                  Xem toàn bộ {stats.total} lần khám
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Panel>

              {/* Diagnosis progression */}
              {stats.recurring.length > 0 && (
                <div className="lg:col-span-2">
                  <Panel title="Diễn tiến theo mã bệnh (bệnh tái diễn)" icon={Activity}>
                    <ul className="space-y-4">
                      {stats.recurring.slice(0, 6).map((r) => (
                        <li key={r.label}>
                          <p className="mb-1.5 text-sm font-medium text-gray-800">
                            {r.label}{" "}
                            <span className="text-gray-400">
                              ({r.dates.length} lần)
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
                            {r.dates.map((d, i) => (
                              <span key={i} className="flex items-center">
                                {i > 0 && (
                                  <span className="mx-1 h-px w-4 bg-gray-200" />
                                )}
                                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                                  {formatDate(d)}
                                </span>
                              </span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: typeof Activity;
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </div>
      <p className={small ? "text-base font-semibold" : "text-2xl font-bold"}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof Activity;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
        {Icon && <Icon className="h-4 w-4 text-brand-500" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function YearBars({ data }: { data: { year: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.year} className="flex items-center gap-3 text-sm">
          <span className="w-10 shrink-0 font-medium text-gray-600">{d.year}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right font-semibold text-gray-700">
            {d.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CountList({
  items,
  empty,
}: {
  items: { key: string; label: string; count: number }[];
  empty: string;
}) {
  if (items.length === 0)
    return <p className="text-sm text-gray-400">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li
          key={it.key}
          className="flex items-center justify-between gap-2 text-sm"
        >
          <span className="min-w-0 flex-1 truncate text-gray-700">{it.label}</span>
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
            {it.count} lần
          </span>
        </li>
      ))}
    </ul>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
    </div>
  );
}

export default function MemberDetailPage() {
  return (
    <Suspense fallback={null}>
      <MemberDetail />
    </Suspense>
  );
}
