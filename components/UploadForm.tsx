"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import type { DocumentCategory } from "@/lib/types";
import { useUploadDocument } from "@/lib/queries";

export function UploadForm({
  visitId,
  profileId,
  category,
}: {
  visitId: string;
  profileId: string;
  category: DocumentCategory;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    try {
      await upload.mutateAsync({ visitId, profileId, category, file });
      formRef.current?.reset();
    } catch {
      setError("Tải tệp lên thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          name="file"
          required
          accept="image/*,application/pdf"
          className="max-w-full flex-1 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
        />
        <button
          type="submit"
          disabled={upload.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {upload.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Tải tệp lên
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
