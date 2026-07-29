import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Stethoscope,
  User as UserIcon,
  Pencil,
  CalendarDays,
  FileHeart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth";
import { VisitTabs, type ClientDoc } from "@/components/VisitTabs";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteVisit } from "@/app/(app)/actions";
import { formatDate } from "@/lib/format";
import type { HealthDocument, VisitWithProfile } from "@/lib/types";

const SIGNED_URL_TTL = 60 * 60; // 1 hour

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionContext();
  const supabase = await createClient();

  // RLS returns the visit only if the user is admin or has been granted it.
  const { data: visit } = await supabase
    .from("visits")
    .select("*, profiles(id, full_name, relationship)")
    .eq("id", id)
    .maybeSingle<VisitWithProfile>();

  if (!visit) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("visit_id", id)
    .order("uploaded_at", { ascending: true });

  // Generate short-lived signed URLs. RLS already filtered `documents` to what
  // this user may see, so signing them here is safe.
  const docs = await signDocuments((documents ?? []) as HealthDocument[]);

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Dòng thời gian
      </Link>

      {/* Header */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="h-4 w-4" />
              {formatDate(visit.visit_date)}
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <FileHeart className="h-5 w-5 shrink-0 text-brand-600" />
              {visit.diagnosis || "Chưa có chẩn đoán"}
            </h1>
          </div>
          {session?.isAdmin && (
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/visit/${visit.id}/edit`}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
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
      <VisitTabs visitId={visit.id} docs={docs} isAdmin={session?.isAdmin ?? false} />

      {session?.isAdmin && (
        <div className="mt-8 border-t border-gray-100 pt-5">
          <DeleteButton
            action={deleteVisit.bind(null, visit.id)}
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

async function signDocuments(documents: HealthDocument[]): Promise<ClientDoc[]> {
  if (documents.length === 0) return [];
  const admin = createAdminClient();
  const { data: signed } = await admin.storage
    .from("health-docs")
    .createSignedUrls(
      documents.map((d) => d.storage_path),
      SIGNED_URL_TTL,
    );

  return documents.map((doc, i) => ({
    id: doc.id,
    category: doc.category,
    file_name: doc.file_name,
    mime_type: doc.mime_type,
    size_bytes: doc.size_bytes,
    url: signed?.[i]?.signedUrl ?? "#",
  }));
}
