"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import clsx from "clsx";

// A generic confirm-then-run delete button for a server action.
export function DeleteButton({
  action,
  confirmText,
  label,
  variant = "icon",
}: {
  action: () => Promise<void>;
  confirmText: string;
  label?: string;
  variant?: "icon" | "button";
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function run() {
    startTransition(async () => {
      await action();
    });
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (window.confirm(confirmText)) run();
        }}
        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {label ?? "Xóa"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirming) {
          run();
        } else {
          setConfirming(true);
          window.setTimeout(() => setConfirming(false), 3000);
        }
      }}
      title={confirmText}
      className={clsx(
        "flex h-8 w-8 items-center justify-center rounded-md transition",
        confirming
          ? "bg-red-600 text-white"
          : "text-gray-400 hover:bg-red-50 hover:text-red-600",
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
