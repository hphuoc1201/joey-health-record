"use client";

// Money input that auto-formats with thousand separators and shows a "đ"
// suffix. The stored value is the raw digit string (e.g. "120000000").
export function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
}) {
  const digits = value.replace(/\D/g, "");
  const display = digits ? Number(digits).toLocaleString("en-US") : "";

  return (
    <div className="relative">
      <input
        inputMode="numeric"
        value={display}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder={placeholder}
        className="input pr-8"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
        đ
      </span>
    </div>
  );
}
