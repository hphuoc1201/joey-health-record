"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Save } from "lucide-react";
import type { Profile, Visit } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      Lưu
    </button>
  );
}

export function VisitForm({
  action,
  profiles,
  visit,
  defaultProfileId,
}: {
  action: (formData: FormData) => Promise<void>;
  profiles: Profile[];
  visit?: Visit;
  defaultProfileId?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <Field label="Thành viên" required>
        <select
          name="profile_id"
          required
          defaultValue={visit?.profile_id ?? defaultProfileId ?? ""}
          className="input"
        >
          <option value="" disabled>
            — Chọn thành viên —
          </option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
              {p.relationship ? ` (${p.relationship})` : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Ngày khám" required>
        <input
          type="date"
          name="visit_date"
          required
          defaultValue={visit?.visit_date ?? ""}
          className="input"
        />
      </Field>

      <Field label="Bệnh viện / Phòng khám">
        <input name="hospital" defaultValue={visit?.hospital ?? ""} className="input" />
      </Field>

      <Field label="Chuyên khoa">
        <input name="specialty" defaultValue={visit?.specialty ?? ""} className="input" />
      </Field>

      <Field label="Chẩn đoán">
        <input name="diagnosis" defaultValue={visit?.diagnosis ?? ""} className="input" />
      </Field>

      <Field label="Bác sĩ">
        <input name="doctor" defaultValue={visit?.doctor ?? ""} className="input" />
      </Field>

      <Field label="Ghi chú">
        <textarea
          name="notes"
          rows={3}
          defaultValue={visit?.notes ?? ""}
          className="input resize-none"
        />
      </Field>

      <div className="pt-2">
        <SubmitButton />
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(209 213 219);
          padding: 0.625rem 0.75rem;
          font-size: 1rem;
          outline: none;
          background: white;
        }
        .input:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 2px rgb(219 234 254);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
