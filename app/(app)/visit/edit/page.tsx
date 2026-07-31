"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfiles, useVisit, useSaveVisit } from "@/lib/queries";
import { VisitForm } from "@/components/VisitForm";
import { ErrorState } from "@/components/ErrorState";

function EditVisit() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const router = useRouter();
  const { canManage, loading } = useAuth();
  const { data, isPending, error, refetch } = useVisit(id);
  const { data: profiles } = useProfiles();
  const saveVisit = useSaveVisit();

  if (!loading && !canManage) {
    router.replace("/");
    return null;
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
        <p className="font-medium text-gray-700">Không tìm thấy lần khám.</p>
        <Link href="/" className="btn-primary mx-auto mt-4 !px-4 !py-2 text-sm">
          Về dòng thời gian
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/visit?id=${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Link>

      <h1 className="mb-5 text-2xl font-bold">Sửa lần khám</h1>

      <VisitForm
        onSubmit={async (values) => {
          await saveVisit.mutateAsync({ id, values });
          router.replace(`/visit?id=${id}`);
        }}
        profiles={profiles ?? []}
        visit={data.visit}
      />
    </div>
  );
}

export default function EditVisitPage() {
  return (
    <Suspense fallback={null}>
      <EditVisit />
    </Suspense>
  );
}
