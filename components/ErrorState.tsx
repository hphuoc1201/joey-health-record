"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

// Shown when a data query fails. Without this, a failed read renders the same
// "nothing here yet" message as genuinely empty data, which hides real errors.
export function ErrorState({
  error,
  onRetry,
  title = "Không tải được dữ liệu",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : "Lỗi không xác định.";

  return (
    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-center">
      <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-red-400" />
      <p className="font-medium text-red-800">{title}</p>
      <p className="mx-auto mt-1 max-w-md break-words text-sm text-red-600">
        {message}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mx-auto mt-4">
          <RotateCw className="h-4 w-4" />
          Thử lại
        </button>
      )}
    </div>
  );
}
