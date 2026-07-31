"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfiles, canEditProfile } from "@/lib/queries";
import { ProfilesManager } from "@/components/ProfilesManager";
import { ErrorState } from "@/components/ErrorState";

export default function ProfilesPage() {
  const auth = useAuth();
  const { data: profiles, isPending, error, refetch } = useProfiles();

  // This page manages the family you own; patients merely shared with you
  // (guest grants) belong on the timeline, not here.
  const owned = useMemo(
    () => (profiles ?? []).filter((p) => canEditProfile(p, auth)),
    [profiles, auth],
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Thành viên gia đình</h1>
      <p className="mb-5 text-sm text-gray-500">
        Mỗi người bạn muốn lưu hồ sơ khám bệnh là một thành viên. Thêm thành viên
        trước, rồi ghi lại các lần khám của họ.
      </p>
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <ProfilesManager profiles={owned} />
      )}
    </div>
  );
}
