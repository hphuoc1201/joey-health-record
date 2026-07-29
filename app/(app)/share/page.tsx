import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { ShareManager, type ShareVisit } from "@/components/ShareManager";

export default async function SharePage() {
  const session = await getSessionContext();
  if (!session?.isAdmin) redirect("/");

  const supabase = await createClient();
  const { data: visits } = await supabase
    .from("visits")
    .select("id, visit_date, diagnosis, hospital, profiles(full_name), access_grants(*)")
    .order("visit_date", { ascending: false });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Chia sẻ hồ sơ</h1>
      <p className="mb-5 text-sm text-gray-500">
        Thêm email để cho phép người khác xem (chỉ đọc) một lần khám. Người được
        thêm sẽ đăng nhập bằng chính email đó và nhận mã xác thực.
      </p>
      <ShareManager visits={(visits ?? []) as unknown as ShareVisit[]} />
    </div>
  );
}
