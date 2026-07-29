import type { DocumentCategory } from "./types";
import {
  FlaskConical,
  Pill,
  ClipboardList,
  Receipt,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface CategoryConfig {
  key: DocumentCategory;
  label: string; // Vietnamese label shown as a tab
  icon: LucideIcon;
}

// The order here is the order of the tabs on the visit detail page.
export const CATEGORIES: CategoryConfig[] = [
  { key: "lab_imaging", label: "Xét nghiệm & CĐHA", icon: FlaskConical },
  { key: "prescription", label: "Toa thuốc", icon: Pill },
  { key: "exam_form", label: "Phiếu khám bệnh", icon: ClipboardList },
  { key: "invoice", label: "Hóa đơn", icon: Receipt },
  { key: "other", label: "Giấy tờ khác", icon: FileText },
];

export function categoryLabel(key: DocumentCategory): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
