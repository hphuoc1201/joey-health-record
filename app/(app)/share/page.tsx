"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ShareCenter } from "@/components/ShareCenter";

export default function SharePage() {
  const router = useRouter();
  const { canManage, loading } = useAuth();

  if (!loading && !canManage) {
    router.replace("/");
    return null;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Chia sẻ hồ sơ</h1>
      <p className="mb-5 text-sm text-gray-500">
        Chia sẻ hồ sơ cho người khác qua email. <b>Khách</b> chỉ xem được hồ sơ
        của những thành viên bạn chọn; <b>người quản lý</b> tự thêm và quản lý
        thành viên gia đình của riêng họ. Người được thêm đăng nhập bằng chính
        email đó và nhận mã xác thực.
      </p>
      <ShareCenter />
    </div>
  );
}
