"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Stethoscope,
  User as UserIcon,
  Pencil,
  CalendarDays,
  FileHeart,
  Loader2,
  Download,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useVisit,
  useDeleteVisit,
  useUpdateClaim,
  canEditProfile,
} from "@/lib/queries";
import { VisitTabs } from "@/components/VisitTabs";
import { DeleteButton } from "@/components/DeleteButton";
import { ErrorState } from "@/components/ErrorState";
import { downloadVisitsZip } from "@/lib/download";
import { formatDate } from "@/lib/format";
import {
  claimClass,
  CLAIM_STATUSES,
  visitTypeLabel,
  formatVnd,
} from "@/lib/claims";
import clsx from "clsx";

function VisitDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const router = useRouter();
  const auth = useAuth();
  const { data, isPending, error, refetch } = useVisit(id);
  const deleteVisit = useDeleteVisit();
  const updateClaim = useUpdateClaim();
  const canEdit = canEditProfile(data?.visit.profiles, auth);
  const [downloading, setDownloading] = useState(false);

  async function downloadThis() {
    if (!data || downloading) return;
    setDownloading(true);
    try {
      await downloadVisitsZip(
        auth.supabase,
        [data.visit],
        data.visit.profiles?.full_name ?? "ho-so",
      );
    } catch {
      alert("Tải xuống thất bại. Vui lòng thử lại.");
    } finally {
      setDownloading(false);
    }
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card mt-10 border-dashed px-6 py-12 text-center">
        <p className="font-medium text-gray-700">
          Không tìm thấy lần khám, hoặc bạn không có quyền xem.
        </p>
        <Link href="/" className="btn-primary mx-auto mt-4 !px-4 !py-2 text-sm">
          Về dòng thời gian
        </Link>
      </div>
    );
  }

  const { visit, docs } = data;

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Dòng thời gian
      </Link>

      {/* Header */}
      <div className="card mb-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="h-4 w-4" />
              {formatDate(visit.visit_date)}
            </div>
            <div className="flex items-start gap-2 text-gray-900">
              <FileHeart className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
              {(visit.diagnoses ?? []).length > 0 ? (
                <ul className="space-y-1">
                  {visit.diagnoses.map((d, i) => (
                    <li key={i} className="flex items-baseline gap-2">
                      {d.code && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-medium text-gray-600">
                          {d.code}
                        </span>
                      )}
                      <span className="text-lg font-bold">{d.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <h1 className="text-xl font-bold">
                  {visit.diagnosis || "Chưa có chẩn đoán"}
                </h1>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={downloadThis}
              disabled={downloading}
              className="btn-secondary"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Tải
            </button>
            {canEdit && (
              <Link href={`/visit/edit?id=${visit.id}`} className="btn-secondary">
                <Pencil className="h-4 w-4" />
                Sửa
              </Link>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Detail icon={UserIcon} label="Thành viên" value={visit.profiles?.full_name} />
          <Detail icon={Building2} label="Bệnh viện" value={visit.hospital} />
          <Detail icon={Stethoscope} label="Chuyên khoa" value={visit.specialty} />
          <Detail icon={UserIcon} label="Bác sĩ" value={visit.doctor} />
          <Detail
            icon={Stethoscope}
            label="Loại khám"
            value={
              visitTypeLabel(visit.visit_type) &&
              (visit.visit_type === "inpatient" && visit.discharge_date
                ? `Nội trú (ra viện ${formatDate(visit.discharge_date)})`
                : visitTypeLabel(visit.visit_type))
            }
          />
          <Detail icon={Stethoscope} label="Triệu chứng" value={visit.symptoms} />
        </dl>

        {visit.notes && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p className="mb-1 font-medium text-gray-500">Ghi chú</p>
            {visit.notes}
          </div>
        )}
      </div>

      {/* Insurance claim panel */}
      <div className="card mb-5 p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Bảo hiểm (claim)
        </h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500">Trạng thái: </span>
            {canEdit ? (
              <select
                value={visit.claim_status}
                onChange={(e) =>
                  updateClaim.mutate({
                    id: visit.id,
                    claim_status: e.target.value as (typeof CLAIM_STATUSES)[number]["value"],
                    claim_amount: visit.claim_amount,
                  })
                }
                className={clsx(
                  "rounded-full border-0 px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-brand-200",
                  claimClass(visit.claim_status),
                )}
              >
                {CLAIM_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  claimClass(visit.claim_status),
                )}
              >
                {CLAIM_STATUSES.find((s) => s.value === visit.claim_status)?.label}
              </span>
            )}
          </div>
          <div>
            <span className="text-gray-500">Tổng chi phí: </span>
            <span className="font-semibold">{formatVnd(visit.total_cost)}</span>
          </div>
          {visit.claim_status === "claimed" && (
            <>
              <div>
                <span className="text-gray-500">Claim được: </span>
                <span className="font-semibold text-emerald-600">
                  {formatVnd(visit.claim_amount)}
                </span>
              </div>
              {visit.total_cost != null && visit.claim_amount != null && (
                <div>
                  <span className="text-gray-500">Còn tự trả: </span>
                  <span className="font-semibold">
                    {formatVnd(Math.max(0, visit.total_cost - visit.claim_amount))}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Documents by category */}
      <VisitTabs
        visitId={visit.id}
        profileId={visit.profile_id}
        docs={docs}
        canEdit={canEdit}
      />

      {canEdit && (
        <div className="mt-8 border-t border-gray-100 pt-5">
          <DeleteButton
            action={async () => {
              await deleteVisit.mutateAsync(visit.id);
              router.replace("/");
            }}
            confirmText="Xóa lần khám này và toàn bộ tệp đính kèm? Không thể hoàn tác."
            label="Xóa lần khám"
            variant="button"
          />
        </div>
      )}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div>
        <dt className="text-xs text-gray-400">{label}</dt>
        <dd className="text-gray-800">{value}</dd>
      </div>
    </div>
  );
}

export default function VisitDetailPage() {
  return (
    <Suspense fallback={null}>
      <VisitDetail />
    </Suspense>
  );
}
