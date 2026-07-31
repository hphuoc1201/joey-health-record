"use client";

import Link from "next/link";
import { Suspense } from "react";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useVisit, useDeleteVisit, canEditProfile } from "@/lib/queries";
import { VisitTabs } from "@/components/VisitTabs";
import { DeleteButton } from "@/components/DeleteButton";
import { ErrorState } from "@/components/ErrorState";
import { formatDate } from "@/lib/format";

function VisitDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const router = useRouter();
  const auth = useAuth();
  const { data, isPending, error, refetch } = useVisit(id);
  const deleteVisit = useDeleteVisit();
  const canEdit = canEditProfile(data?.visit.profiles, auth);

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
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <FileHeart className="h-5 w-5 shrink-0 text-brand-600" />
              <span>
                {visit.diagnosis || "Chưa có chẩn đoán"}
                {visit.icd_code && (
                  <span className="ml-2 align-middle rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-medium text-gray-600">
                    {visit.icd_code}
                  </span>
                )}
              </span>
            </h1>
          </div>
          {canEdit && (
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/visit/edit?id=${visit.id}`} className="btn-secondary">
                <Pencil className="h-4 w-4" />
                Sửa
              </Link>
            </div>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Detail icon={UserIcon} label="Thành viên" value={visit.profiles?.full_name} />
          <Detail icon={Building2} label="Bệnh viện" value={visit.hospital} />
          <Detail icon={Stethoscope} label="Chuyên khoa" value={visit.specialty} />
          <Detail icon={UserIcon} label="Bác sĩ" value={visit.doctor} />
        </dl>

        {visit.notes && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p className="mb-1 font-medium text-gray-500">Ghi chú</p>
            {visit.notes}
          </div>
        )}
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
