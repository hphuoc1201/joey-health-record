"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfiles, useSaveVisit } from "@/lib/queries";
import { VisitForm } from "@/components/VisitForm";

function NewVisit() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const params = useSearchParams();
  const defaultProfileId = params.get("profile") ?? undefined;
  const { data: profiles, isPending } = useProfiles();
  const saveVisit = useSaveVisit();

  if (!loading && !isAdmin) {
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

  const list = profiles ?? [];

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Dòng thời gian
      </Link>

      <h1 className="mb-5 text-2xl font-bold">Thêm lần khám</h1>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <UserPlus className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-700">Chưa có thành viên nào</p>
          <p className="mt-1 text-sm text-gray-500">
            Hãy tạo hồ sơ thành viên trước khi thêm lần khám.
          </p>
          <Link
            href="/profiles"
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Tạo hồ sơ thành viên
          </Link>
        </div>
      ) : (
        <VisitForm
          onSubmit={async (values) => {
            const id = await saveVisit.mutateAsync({ values });
            router.replace(`/visit/${id}`);
          }}
          profiles={list}
          defaultProfileId={defaultProfileId}
        />
      )}
    </div>
  );
}

export default function NewVisitPage() {
  return (
    <Suspense fallback={null}>
      <NewVisit />
    </Suspense>
  );
}
