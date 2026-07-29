"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Upload, Loader2 } from "lucide-react";
import type { DocumentCategory } from "@/lib/types";
import { uploadDocument } from "@/app/(app)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Upload className="h-4 w-4" />
      )}
      Tải tệp lên
    </button>
  );
}

export function UploadForm({
  visitId,
  category,
}: {
  visitId: string;
  category: DocumentCategory;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await uploadDocument(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3"
    >
      <input type="hidden" name="visit_id" value={visitId} />
      <input type="hidden" name="category" value={category} />
      <input
        type="file"
        name="file"
        required
        accept="image/*,application/pdf"
        className="max-w-full flex-1 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
      />
      <SubmitButton />
    </form>
  );
}
