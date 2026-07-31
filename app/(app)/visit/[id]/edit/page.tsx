"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfiles, useVisit, useSaveVisit } from "@/lib/queries";
import { VisitForm } from "@/components/VisitForm";

export default function EditVisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { canManage, loading } = useAuth();
  const { data, isPending } = useVisit(id);
  const { data: profiles } = useProfiles();
  const saveVisit = useSaveVisit();

  if (!loading && !canManage) {
    router.replace("/");
    return null;
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
      <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <p className="font-medium text-gray-700">Không tìm thấy lần khám.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/visit/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Link>

      <h1 className="mb-5 text-2xl font-bold">Sửa lần khám</h1>

      <VisitForm
        onSubmit={async (values) => {
          await saveVisit.mutateAsync({ id, values });
          router.replace(`/visit/${id}`);
        }}
        profiles={profiles ?? []}
        visit={data.visit}
      />
    </div>
  );
}
