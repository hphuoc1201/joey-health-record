"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronsUpDown, PlusCircle, Search } from "lucide-react";

export interface ComboOption {
  value: string;
  label: string;
  /** Extra text shown to the right (e.g. an ICD code) and matched in search. */
  hint?: string;
}

// Strip Vietnamese diacritics for accent-insensitive matching.
export function normalizeVi(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "— Chọn —",
  searchPlaceholder = "Tìm kiếm...",
  allowCustom = false,
  customLabel = "Dùng giá trị",
  disabled = false,
}: {
  options: ComboOption[];
  value: string;
  onChange: (value: string, option?: ComboOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Allow picking the typed text itself when nothing matches. */
  allowCustom?: boolean;
  customLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);
  const display = selected?.label ?? (value || "");

  const filtered = useMemo(() => {
    const q = normalizeVi(query.trim());
    if (!q) return options;
    return options.filter(
      (o) =>
        normalizeVi(o.label).includes(q) ||
        normalizeVi(o.value).includes(q) ||
        (o.hint ? normalizeVi(o.hint).includes(q) : false),
    );
  }, [options, query]);

  const showCustom =
    allowCustom &&
    query.trim().length > 0 &&
    !filtered.some((o) => normalizeVi(o.label) === normalizeVi(query.trim()));

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      // Focus the search box as soon as the dropdown opens.
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  function choose(opt: ComboOption) {
    onChange(opt.value, opt);
    setOpen(false);
  }

  function chooseCustom() {
    const v = query.trim();
    if (!v) return;
    onChange(v);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const total = filtered.length + (showCustom ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight < filtered.length) {
        const opt = filtered[highlight];
        if (opt) choose(opt);
      } else if (showCustom) {
        chooseCustom();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Keep the highlighted row visible.
  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-base transition-all duration-150",
          "hover:border-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 active:scale-[0.995]",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className={clsx("truncate", !display && "text-gray-400")}>
          {display || placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="w-full border-0 p-0 text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <ul ref={listRef} className="max-h-56 overflow-y-auto py-1">
            {filtered.map((opt, i) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(opt)}
                  className={clsx(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    i === highlight ? "bg-brand-50 text-brand-700" : "text-gray-700",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {opt.hint && (
                    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                      {opt.hint}
                    </span>
                  )}
                  {opt.value === value && (
                    <Check className="h-4 w-4 shrink-0 text-brand-600" />
                  )}
                </button>
              </li>
            ))}
            {showCustom && (
              <li>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(filtered.length)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={chooseCustom}
                  className={clsx(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    highlight === filtered.length
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-700",
                  )}
                >
                  <PlusCircle className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="truncate">
                    {customLabel}: “{query.trim()}”
                  </span>
                </button>
              </li>
            )}
            {filtered.length === 0 && !showCustom && (
              <li className="px-3 py-3 text-center text-sm text-gray-400">
                Không tìm thấy kết quả.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
