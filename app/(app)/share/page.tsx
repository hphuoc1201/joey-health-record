"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useShareVisits } from "@/lib/queries";
import { ShareManager } from "@/components/ShareManager";
import { ManagersSection } from "@/components/ManagersSection";
import { ErrorState } from "@/components/ErrorState";

export default function SharePage() {
  const router = useRouter();
  const { canManage, isAdmin, loading } = useAuth();
  const { data: visits, isPending, error, refetch } = useShareVisits();

  if (!loading && !canManage) {
    router.replace("/");
    return null;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Chia sẻ hồ sơ</h1>
      <p className="mb-5 text-sm text-gray-500">
        Thêm email để cho phép người khác xem (chỉ đọc) một lần khám. Người được
        thêm sẽ đăng nhập bằng chính email đó và nhận mã xác thực.
      </p>

      {isAdmin && <ManagersSection />}

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <ShareManager visits={visits ?? []} />
      )}
    </div>
  );
}
