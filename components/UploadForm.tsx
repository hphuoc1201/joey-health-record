"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { UploadCloud, Loader2 } from "lucide-react";
import type { DocumentCategory } from "@/lib/types";
import { useUploadDocument } from "@/lib/queries";
import { compressImage } from "@/lib/compress";

// Pull the extension (incl. dot) off a filename, or "" if none.
function extOf(name: string): string {
  const m = name.match(/\.[^.]+$/);
  return m ? m[0] : "";
}

function accepted(f: File): boolean {
  return f.type.startsWith("image/") || f.type === "application/pdf";
}

export function UploadForm({
  visitId,
  profileId,
  category,
  categoryLabel,
  existingCount,
}: {
  visitId: string;
  profileId: string;
  category: DocumentCategory;
  // Tab name + how many files are already in this tab, so new uploads are
  // named "<tab> - 01", "<tab> - 02", ... continuing the sequence.
  categoryLabel: string;
  existingCount: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFiles(fileList: File[]) {
    const picked = fileList.filter(accepted);
    if (picked.length === 0) {
      if (fileList.length > 0) setError("Chỉ hỗ trợ tệp ảnh hoặc PDF.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // Upload sequentially so the numbering stays stable and ordered.
      for (let i = 0; i < picked.length; i++) {
        // Shrink photos before upload; PDFs pass through untouched.
        const file = await compressImage(picked[i]);
        const seq = String(existingCount + i + 1).padStart(2, "0");
        const fileName = `${categoryLabel} - ${seq}${extOf(file.name)}`;
        await upload.mutateAsync({ visitId, profileId, category, file, fileName });
      }
    } catch {
      setError("Tải tệp lên thất bại. Vui lòng thử lại.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const pending = busy || upload.isPending;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !pending && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !pending) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!pending) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!pending) handleFiles(Array.from(e.dataTransfer.files));
        }}
        className={clsx(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
          dragOver
            ? "border-brand-500 bg-brand-50"
            : "border-gray-300 bg-gray-50 hover:border-brand-400 hover:bg-brand-50/50",
          pending && "pointer-events-none opacity-70",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
        />

        {pending ? (
          <>
            <Loader2 className="mb-3 h-9 w-9 animate-spin text-brand-500" />
            <p className="text-sm font-medium text-gray-700">Đang tải lên…</p>
            <p className="mt-1 text-xs text-gray-400">
              Đang nén và tải tệp, vui lòng đợi một chút.
            </p>
          </>
        ) : (
          <>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Kéo &amp; thả ảnh hoặc PDF vào đây
            </p>
            <p className="mt-1 text-xs text-gray-500">
              hoặc bấm để chọn tệp · chọn nhiều tệp cùng lúc · ảnh tự động nén
            </p>
          </>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Tệp sẽ được đặt tên theo tab (VD: “{categoryLabel} - 01”).
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
