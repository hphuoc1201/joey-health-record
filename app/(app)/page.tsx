"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  PlusCircle,
  CalendarClock,
  Loader2,
  UserPlus,
  Download,
  CheckSquare,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfiles, useVisits } from "@/lib/queries";
import { TimelineCard } from "@/components/TimelineCard";
import { PatientSelect, lastPatientKey } from "@/components/PatientSelect";
import { ErrorState } from "@/components/ErrorState";
import { downloadVisitsZip } from "@/lib/download";
import { formatMonthYear } from "@/lib/format";
import type { VisitWithProfile } from "@/lib/types";

export default function TimelinePage() {
  const { email, canManage, supabase } = useAuth();
  const {
    data: profiles,
    isPending: profilesPending,
    error: profilesError,
    refetch: refetchProfiles,
  } = useProfiles();
  const [patientId, setPatientId] = useState<string>("");

  // Pick the remembered patient (or the first one) once profiles load.
  useEffect(() => {
    if (!profiles || profiles.length === 0) return;
    setPatientId((current) => {
      if (current && profiles.some((p) => p.id === current)) return current;
      const remembered = localStorage.getItem(lastPatientKey(email));
      if (remembered && profiles.some((p) => p.id === remembered)) {
        return remembered;
      }
      return profiles[0].id;
    });
  }, [profiles, email]);

  function selectPatient(id: string) {
    setPatientId(id);
    localStorage.setItem(lastPatientKey(email), id);
  }

  const {
    data: visits,
    isPending: visitsPending,
    error: visitsError,
    refetch: refetchVisits,
  } = useVisits(patientId || undefined);

  const visitList = patientId ? (visits ?? []) : [];
  const groups = groupByMonth(visitList);

  // Selection + download state.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const patientName = useMemo(
    () => profiles?.find((p) => p.id === patientId)?.full_name ?? "ho-so",
    [profiles, patientId],
  );

  // Reset selection when the patient changes or select mode is exited.
  useEffect(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, [patientId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function download(which: VisitWithProfile[]) {
    if (which.length === 0 || downloading) return;
    setDownloading(true);
    try {
      await downloadVisitsZip(supabase, which, patientName);
      setSelectMode(false);
      setSelected(new Set());
    } catch {
      alert("Tải xuống thất bại. Vui lòng thử lại.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lịch sử khám</h1>
        {canManage && (
          <Link
            href={patientId ? `/visit/new?profile=${patientId}` : "/visit/new"}
            className="btn-primary !px-3 !py-2 text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Thêm lần khám
          </Link>
        )}
      </div>

      {profilesError ? (
        <ErrorState error={profilesError} onRetry={() => refetchProfiles()} />
      ) : profilesPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (profiles ?? []).length === 0 ? (
        <NoPatients canManage={canManage} />
      ) : (
        <>
          <PatientSelect
            profiles={profiles ?? []}
            value={patientId}
            onChange={selectPatient}
          />

          {visitsError ? (
            <ErrorState error={visitsError} onRetry={() => refetchVisits()} />
          ) : visitsPending ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : groups.length === 0 ? (
            <EmptyTimeline canManage={canManage} patientId={patientId} />
          ) : (
            <>
              {/* Download toolbar */}
              <div className="mb-4 flex items-center gap-2">
                {selectMode ? (
                  <>
                    <button
                      onClick={() =>
                        download(visitList.filter((v) => selected.has(v.id)))
                      }
                      disabled={selected.size === 0 || downloading}
                      className="btn-primary !px-3 !py-2 text-sm"
                    >
                      {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Tải {selected.size > 0 ? `${selected.size} mục` : "đã chọn"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectMode(false);
                        setSelected(new Set());
                      }}
                      className="btn-secondary"
                    >
                      <X className="h-4 w-4" />
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => download(visitList)}
                      disabled={downloading}
                      className="btn-primary !px-3 !py-2 text-sm"
                    >
                      {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Tải tất cả
                    </button>
                    <button
                      onClick={() => setSelectMode(true)}
                      className="btn-secondary"
                    >
                      <CheckSquare className="h-4 w-4" />
                      Chọn
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-6">
                {groups.map((group) => (
                  <section key={group.key}>
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                      {group.label}
                    </h2>
                    <div className="space-y-3">
                      {group.visits.map((v) => (
                        <TimelineCard
                          key={v.id}
                          visit={v}
                          selectMode={selectMode}
                          selected={selected.has(v.id)}
                          onToggle={toggle}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function NoPatients({ canManage }: { canManage: boolean }) {
  return (
    <div className="card mt-10 flex flex-col items-center border-dashed px-6 py-12 text-center">
      <UserPlus className="mb-3 h-10 w-10 text-gray-300" />
      <p className="font-medium text-gray-700">Chưa có thành viên nào</p>
      <p className="mt-1 text-sm text-gray-500">
        {canManage
          ? "Thêm người đầu tiên trong gia đình để bắt đầu lưu hồ sơ khám bệnh."
          : "Chưa có hồ sơ nào được chia sẻ với bạn."}
      </p>
      {canManage && (
        <Link href="/profiles" className="btn-primary mt-4 !px-4 !py-2 text-sm">
          <UserPlus className="h-4 w-4" />
          Thêm thành viên
        </Link>
      )}
    </div>
  );
}

function EmptyTimeline({
  canManage,
  patientId,
}: {
  canManage: boolean;
  patientId: string;
}) {
  return (
    <div className="card mt-6 flex flex-col items-center border-dashed px-6 py-12 text-center">
      <CalendarClock className="mb-3 h-10 w-10 text-gray-300" />
      <p className="font-medium text-gray-700">
        Thành viên này chưa có lần khám nào
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Ghi lại lần khám để lưu kết quả xét nghiệm, toa thuốc và hóa đơn.
      </p>
      {canManage && (
        <Link
          href={`/visit/new?profile=${patientId}`}
          className="btn-primary mt-4 !px-4 !py-2 text-sm"
        >
          <PlusCircle className="h-4 w-4" />
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
