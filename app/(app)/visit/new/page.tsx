import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { VisitForm } from "@/components/VisitForm";
import { createVisit } from "@/app/(app)/actions";
import type { Profile } from "@/lib/types";

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string }>;
}) {
  const session = await getSessionContext();
  if (!session?.isAdmin) redirect("/");

  const { profile } = await searchParams;
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const list = (profiles ?? []) as Profile[];

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
        <VisitForm action={createVisit} profiles={list} defaultProfileId={profile} />
      )}
    </div>
  );
}
