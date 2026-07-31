import type { SupabaseClient } from "@supabase/supabase-js";
import type { HealthDocument, VisitWithProfile } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { claimLabel, visitTypeLabel, formatVnd } from "@/lib/claims";

const BUCKET = "health-docs";

// Strip characters that are invalid in file/folder names across OSes.
function safe(s: string): string {
  return s.replace(/[\/\\?%*:|"<>]/g, " ").replace(/\s+/g, " ").trim();
}

function visitCodes(v: VisitWithProfile): string {
  const codes = (v.diagnoses ?? []).map((d) => d.code).filter(Boolean);
  if (codes.length) return codes.join(", ");
  return v.icd_code ?? "";
}

function folderName(v: VisitWithProfile, index: number): string {
  const parts = [v.visit_date, v.hospital ?? "Khong ro noi kham", visitCodes(v)]
    .map((p) => safe(String(p ?? "")))
    .filter(Boolean);
  // Prefix with an index so two visits with the same summary never collide.
  return `${String(index + 1).padStart(2, "0")} - ${parts.join(" - ")}`;
}

function infoText(v: VisitWithProfile): string {
  const diag =
    (v.diagnoses ?? []).length > 0
      ? v.diagnoses.map((d) => (d.code ? `${d.code} - ${d.name}` : d.name)).join("\n  ")
      : v.diagnosis || "—";
  return [
    `Ngày khám: ${formatDate(v.visit_date)} (${v.visit_date})`,
    `Thành viên: ${v.profiles?.full_name ?? "—"}`,
    `Loại khám: ${visitTypeLabel(v.visit_type) ?? "—"}${
      v.visit_type === "inpatient" && v.discharge_date
        ? ` (ra viện ${formatDate(v.discharge_date)})`
        : ""
    }`,
    `Bệnh viện / Phòng khám: ${v.hospital ?? "—"}`,
    `Chuyên khoa: ${v.specialty ?? "—"}`,
    `Bác sĩ: ${v.doctor ?? "—"}`,
    `Triệu chứng: ${v.symptoms ?? "—"}`,
    `Chẩn đoán:\n  ${diag}`,
    `Tổng chi phí: ${formatVnd(v.total_cost)}`,
    `Trạng thái bảo hiểm: ${claimLabel(v.claim_status)}`,
    `Số tiền claim được: ${v.claim_status === "claimed" ? formatVnd(v.claim_amount) : "—"}`,
    `Ghi chú: ${v.notes ?? "—"}`,
  ].join("\n");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Builds a zip with one folder per visit (named by date + hospital + ICD code),
// each holding that visit's files plus a thong-tin.txt summary. Intended for
// handing a patient's records to an insurer.
export async function downloadVisitsZip(
  supabase: SupabaseClient,
  visits: VisitWithProfile[],
  patientName: string,
): Promise<void> {
  // Loaded on demand so the ~90KB zip library stays out of the timeline's
  // initial bundle.
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  for (let i = 0; i < visits.length; i++) {
    const v = visits[i];
    const folder = zip.folder(folderName(v, i))!;
    folder.file("thong-tin.txt", infoText(v));

    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("visit_id", v.id)
      .order("uploaded_at", { ascending: true });

    const docs = (documents ?? []) as HealthDocument[];
    if (docs.length === 0) continue;

    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(
        docs.map((d) => d.storage_path),
        60 * 60,
      );

    for (let j = 0; j < docs.length; j++) {
      const url = signed?.[j]?.signedUrl;
      if (!url) continue;
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const blob = await res.blob();
        folder.file(`${String(j + 1).padStart(2, "0")}-${safe(docs[j].file_name)}`, blob);
      } catch {
        // Skip a file that fails to download rather than aborting the whole zip.
      }
    }
  }

  const out = await zip.generateAsync({ type: "blob" });
  triggerDownload(out, `${safe(patientName) || "ho-so"}-ho-so-kham-benh.zip`);
}
