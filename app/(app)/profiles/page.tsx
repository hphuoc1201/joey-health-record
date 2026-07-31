"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfiles } from "@/lib/queries";
import { ProfilesManager } from "@/components/ProfilesManager";

export default function ProfilesPage() {
  const { isAdmin } = useAuth();
  const { data: profiles, isPending } = useProfiles();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Hồ sơ thành viên</h1>
      <p className="mb-5 text-sm text-gray-500">
        {isAdmin
          ? "Quản lý các thành viên trong gia đình."
          : "Những người có hồ sơ được chia sẻ với bạn."}
      </p>
      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <ProfilesManager profiles={profiles ?? []} isAdmin={isAdmin} />
      )}
    </div>
  );
}
