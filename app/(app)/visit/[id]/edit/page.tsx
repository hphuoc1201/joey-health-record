import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { VisitForm } from "@/components/VisitForm";
import { updateVisit } from "@/app/(app)/actions";
import type { Profile, Visit } from "@/lib/types";

export default async function EditVisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionContext();
  if (!session?.isAdmin) redirect("/");

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: visit }, { data: profiles }] = await Promise.all([
    supabase.from("visits").select("*").eq("id", id).maybeSingle<Visit>(),
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
  ]);

  if (!visit) notFound();

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
        action={updateVisit.bind(null, id)}
        profiles={(profiles ?? []) as Profile[]}
        visit={visit}
      />
    </div>
  );
}
