"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfiles, useSaveVisit } from "@/lib/queries";
import { VisitForm } from "@/components/VisitForm";
import { ProfileFields } from "@/components/ProfileFields";

function NewVisit() {
  const router = useRouter();
  const { canManage, loading } = useAuth();
  const params = useSearchParams();
  const defaultProfileId = params.get("profile") ?? undefined;
  const { data: profiles, isPending } = useProfiles();
  const saveVisit = useSaveVisit();
  // When the user has no members yet, they add one inline here; we remember its
  // id so the visit form below opens with that new member preselected.
  const [createdId, setCreatedId] = useState<string | undefined>();

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
        <div className="card border-dashed p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-800">
                Thêm thành viên trước đã
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                Mỗi lần khám thuộc về một thành viên. Thêm người này xong, form
                ghi lần khám sẽ hiện ra ngay bên dưới.
              </p>
            </div>
          </div>
          <ProfileFields
            submitLabel="Thêm thành viên & tiếp tục"
            onCreated={(id) => setCreatedId(id)}
          />
        </div>
      ) : (
        <VisitForm
          onSubmit={async (values) => {
            const id = await saveVisit.mutateAsync({ values });
            router.replace(`/visit?id=${id}`);
          }}
          profiles={list}
          defaultProfileId={createdId ?? defaultProfileId}
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
