import type { ClaimStatus, VisitType } from "@/lib/types";

export const CLAIM_STATUSES: {
  value: ClaimStatus;
  label: string;
  className: string;
}[] = [
  { value: "none", label: "Chưa claim", className: "bg-gray-100 text-gray-600" },
  {
    value: "pending",
    label: "Đang claim",
    className: "bg-amber-100 text-amber-700",
  },
  {
    value: "rejected",
    label: "Bị từ chối",
    className: "bg-red-100 text-red-700",
  },
  {
    value: "claimed",
    label: "Đã claim",
    className: "bg-emerald-100 text-emerald-700",
  },
];

export function claimLabel(status: ClaimStatus): string {
  return CLAIM_STATUSES.find((s) => s.value === status)?.label ?? "Chưa claim";
}

export function claimClass(status: ClaimStatus): string {
  return (
    CLAIM_STATUSES.find((s) => s.value === status)?.className ??
    "bg-gray-100 text-gray-600"
  );
}

export const VISIT_TYPES: { value: VisitType; label: string }[] = [
  { value: "outpatient", label: "Ngoại trú" },
  { value: "inpatient", label: "Nội trú" },
];

export function visitTypeLabel(t: VisitType | null): string | null {
  if (!t) return null;
  return VISIT_TYPES.find((v) => v.value === t)?.label ?? null;
}

// Format a VND amount (numbers stored as plain numeric).
export function formatVnd(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("vi-VN") + " ₫";
}
