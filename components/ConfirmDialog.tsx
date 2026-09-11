"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

// A centered confirmation modal with a dimmed backdrop. Used for every
// destructive action (delete member, delete visit, delete document) so the
// user always gets an explicit "are you sure?" step.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xóa",
  cancelLabel = "Hủy",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onCancel();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !pending && onCancel()}
      />
      <div className="relative w-full max-w-sm rounded-md-xl bg-surface-high p-6 shadow-md-3">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-error-container text-on-error-container">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-medium text-on-surface">{title}</h2>
        <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full px-4 text-sm font-medium tracking-[.1px] text-primary transition-colors hover:bg-surface-container active:scale-[0.98] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-error px-5 text-sm font-medium tracking-[.1px] text-on-error transition-all hover:shadow-md-1 active:scale-[0.98] disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
