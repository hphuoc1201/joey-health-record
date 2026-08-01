"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import clsx from "clsx";
import { ConfirmDialog } from "./ConfirmDialog";

// A delete button that always opens a confirmation modal before running the
// action. `variant="icon"` renders a compact trash icon (cards); `"button"`
// renders a full labelled danger button.
export function DeleteButton({
  action,
  confirmText,
  title = "Xác nhận xóa",
  label,
  variant = "icon",
}: {
  action: () => Promise<void>;
  confirmText: string;
  title?: string;
  label?: string;
  variant?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    try {
      await action();
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {variant === "button" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-danger"
        >
          <Trash2 className="h-4 w-4" />
          {label ?? "Xóa"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={label ?? "Xóa"}
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-600",
          )}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <ConfirmDialog
        open={open}
        title={title}
        message={confirmText}
        confirmLabel={label ?? "Xóa"}
        pending={pending}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
