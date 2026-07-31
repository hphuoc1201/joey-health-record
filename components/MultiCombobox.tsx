"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Plus, Search, X } from "lucide-react";
import { normalizeVi, type ComboOption } from "./Combobox";

export interface MultiItem {
  value: string; // code (may be "" for free text)
  label: string; // name
}

// Searchable multi-select with chips. Picking an option or a typed free value
// appends it; each chip has a remove button. Used for a visit's diagnoses.
export function MultiCombobox({
  options,
  items,
  onChange,
  placeholder = "Thêm...",
  searchPlaceholder = "Tìm kiếm...",
  customLabel = "Thêm",
  allowCustom = true,
  showCode = true,
}: {
  options: ComboOption[];
  items: MultiItem[];
  onChange: (items: MultiItem[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  customLabel?: string;
  allowCustom?: boolean;
  /** Show each chip's value as a code badge (e.g. an ICD code). Off for
   *  things like patient ids where the value is just an internal id. */
  showCode?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chosen = new Set(items.map((i) => `${i.value}|${i.label}`));

  const filtered = useMemo(() => {
    const q = normalizeVi(query.trim());
    const base = options.filter((o) => !chosen.has(`${o.value}|${o.label}`));
    if (!q) return base;
    return base.filter(
      (o) =>
        normalizeVi(o.label).includes(q) ||
        normalizeVi(o.value).includes(q) ||
        (o.hint ? normalizeVi(o.hint).includes(q) : false),
    );
  }, [options, query, items]);

  const showCustom =
    allowCustom &&
    query.trim().length > 0 &&
    !options.some((o) => normalizeVi(o.label) === normalizeVi(query.trim()));

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function add(item: MultiItem) {
    if (chosen.has(`${item.value}|${item.label}`)) return;
    onChange([...items, item]);
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div ref={rootRef} className="relative">
      {items.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {items.map((it, idx) => (
            <li
              key={`${it.value}|${it.label}|${idx}`}
              className="flex items-center gap-1.5 rounded-lg bg-brand-50 py-1 pl-2 pr-1 text-sm text-brand-700"
            >
              {showCode && it.value && (
                <span className="rounded bg-white/70 px-1 font-mono text-[11px]">
                  {it.value}
                </span>
              )}
              <span className="max-w-[16rem] truncate">{it.label}</span>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="flex h-5 w-5 items-center justify-center rounded text-brand-500 transition-colors hover:bg-white/60 hover:text-red-600"
                aria-label="Xóa"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2.5 text-left text-sm text-gray-500 transition-all duration-150 hover:border-brand-300 hover:text-brand-600 active:scale-[0.995]"
      >
        <Plus className="h-4 w-4" />
        {placeholder}
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered[0]) add({ value: filtered[0].value, label: filtered[0].label });
                  else if (showCustom) add({ value: "", label: query.trim() });
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full border-0 p-0 text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.map((opt) => (
              <li key={`${opt.value}|${opt.label}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add({ value: opt.value, label: opt.label })}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {opt.hint && (
                    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                      {opt.hint}
                    </span>
                  )}
                </button>
              </li>
            ))}
            {showCustom && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add({ value: "", label: query.trim() })}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <Plus className="h-4 w-4 shrink-0 text-brand-600" />
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
