import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { ProfilesManager } from "@/components/ProfilesManager";
import type { Profile } from "@/lib/types";

export default async function ProfilesPage() {
  const session = await getSessionContext();
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Hồ sơ thành viên</h1>
      <p className="mb-5 text-sm text-gray-500">
        {session?.isAdmin
          ? "Quản lý các thành viên trong gia đình."
          : "Những người có hồ sơ được chia sẻ với bạn."}
      </p>
      <ProfilesManager
        profiles={(profiles ?? []) as Profile[]}
        isAdmin={session?.isAdmin ?? false}
      />
    </div>
  );
}
