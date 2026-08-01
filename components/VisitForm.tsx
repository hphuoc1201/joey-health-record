"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { Profile, Visit, VisitType, ClaimStatus } from "@/lib/types";
import type { VisitInput } from "@/lib/queries";
import { useVisits } from "@/lib/queries";
import { Combobox, type ComboOption } from "./Combobox";
import { MultiCombobox, type MultiItem } from "./MultiCombobox";
import { MoneyInput } from "./MoneyInput";
import { HOSPITALS } from "@/lib/hospitals";
import { SPECIALTIES } from "@/lib/specialties";
import { ICD10 } from "@/lib/icd10";
import { VISIT_TYPES } from "@/lib/claims";

function toNum(s: string): number | null {
  const n = Number(s.replace(/[^\d.]/g, ""));
  return s.trim() && !Number.isNaN(n) ? n : null;
}

function toNull(s: string): string | null {
  const t = s.trim();
  return t.length > 0 ? t : null;
}

// Seed the diagnosis chips from a visit being edited, falling back to the
// legacy single diagnosis/icd_code for rows created before multi-diagnosis.
function initialDiagnoses(visit?: Visit): MultiItem[] {
  if (visit?.diagnoses && visit.diagnoses.length > 0) {
    return visit.diagnoses.map((d) => ({ value: d.code, label: d.name }));
  }
  if (visit?.diagnosis) {
    return [{ value: visit.icd_code ?? "", label: visit.diagnosis }];
  }
  return [];
}

export function VisitForm({
  onSubmit,
  profiles,
  visit,
  defaultProfileId,
}: {
  onSubmit: (values: VisitInput) => Promise<void>;
  profiles: Profile[];
  visit?: Visit;
  defaultProfileId?: string;
}) {
  const isEdit = Boolean(visit);
  const { data: allVisits } = useVisits();

  const [profileId, setProfileId] = useState(
    visit?.profile_id ?? defaultProfileId ?? "",
  );
  const [visitDate, setVisitDate] = useState(visit?.visit_date ?? "");
  const [hospital, setHospital] = useState(visit?.hospital ?? "");
  const [specialty, setSpecialty] = useState(visit?.specialty ?? "");
  const [diagnoses, setDiagnoses] = useState<MultiItem[]>(
    () => initialDiagnoses(visit),
  );
  const [doctor, setDoctor] = useState(visit?.doctor ?? "");
  const [symptoms, setSymptoms] = useState(visit?.symptoms ?? "");
  const [visitType, setVisitType] = useState<VisitType | "">(
    visit?.visit_type ?? "",
  );
  const [dischargeDate, setDischargeDate] = useState(visit?.discharge_date ?? "");
  const [notes, setNotes] = useState(visit?.notes ?? "");
  const [totalCost, setTotalCost] = useState(
    visit?.total_cost != null ? String(visit.total_cost) : "",
  );
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>(
    visit?.claim_status ?? "none",
  );
  const [claimAmount, setClaimAmount] = useState(
    visit?.claim_amount != null ? String(visit.claim_amount) : "",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hospital options: curated list + any name already used in visits.
  const hospitalOptions = useMemo<ComboOption[]>(() => {
    const seen = new Set(HOSPITALS);
    const extras: string[] = [];
    for (const v of allVisits ?? []) {
      if (v.hospital && !seen.has(v.hospital)) {
        seen.add(v.hospital);
        extras.push(v.hospital);
      }
    }
    return [...extras.sort(), ...HOSPITALS].map((h) => ({ value: h, label: h }));
  }, [allVisits]);

  const specialtyOptions = useMemo<ComboOption[]>(
    () => SPECIALTIES.map((s) => ({ value: s, label: s })),
    [],
  );

  const icdOptions = useMemo<ComboOption[]>(
    () => ICD10.map((e) => ({ value: e.code, label: e.label, hint: e.code })),
    [],
  );

  // Prefill hospital/specialty from the patient's most recent visit when the
  // patient changes (create mode only). Skips the very first render in edit
  // mode so existing values are never overwritten.
  const prefillFor = useRef<string | null>(isEdit ? visit!.profile_id : null);
  useEffect(() => {
    if (!profileId || prefillFor.current === profileId) return;
    prefillFor.current = profileId;
    const latest = (allVisits ?? []).find((v) => v.profile_id === profileId);
    if (latest) {
      if (latest.hospital) setHospital(latest.hospital);
      if (latest.specialty) setSpecialty(latest.specialty);
    }
  }, [profileId, allVisits]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profileId || !visitDate) return;
    setError(null);
    setPending(true);
    try {
      await onSubmit({
        profile_id: profileId,
        visit_date: visitDate,
        hospital: toNull(hospital),
        specialty: toNull(specialty),
        diagnoses: diagnoses.map((d) => ({ code: d.value, name: d.label })),
        doctor: toNull(doctor),
        notes: toNull(notes),
        symptoms: toNull(symptoms),
        visit_type: visitType || null,
        discharge_date: visitType === "inpatient" ? toNull(dischargeDate) : null,
        total_cost: toNum(totalCost),
        claim_status: claimStatus,
        claim_amount: claimStatus === "claimed" ? toNum(claimAmount) : null,
      });
    } catch {
      setError("Lưu thất bại. Vui lòng thử lại.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Two columns on desktop; single column on mobile. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Thành viên" required>
          <select
            required
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            className="input"
          >
            <option value="" disabled>
              — Chọn thành viên —
            </option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ngày khám" required>
          <input
            type="date"
            required
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Bệnh viện / Phòng khám">
          <Combobox
            options={hospitalOptions}
            value={hospital}
            onChange={setHospital}
            placeholder="— Chọn bệnh viện —"
            searchPlaceholder="Tìm bệnh viện..."
            allowCustom
            customLabel="Nơi khám khác"
          />
        </Field>

        <Field label="Chuyên khoa">
          <Combobox
            options={specialtyOptions}
            value={specialty}
            onChange={setSpecialty}
            placeholder="— Chọn chuyên khoa —"
            searchPlaceholder="Tìm chuyên khoa..."
            allowCustom
            customLabel="Chuyên khoa khác"
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Chẩn đoán (có thể thêm nhiều)">
            <MultiCombobox
              options={icdOptions}
              items={diagnoses}
              onChange={setDiagnoses}
              placeholder="Thêm chẩn đoán..."
              searchPlaceholder="VD: F32, trầm cảm, viêm họng..."
              customLabel="Chẩn đoán khác"
            />
          </Field>
        </div>

        <Field label="Bác sĩ">
          <input
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Loại khám">
          <div className="flex gap-2">
            {VISIT_TYPES.map((t) => {
              const selected = visitType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setVisitType(selected ? "" : t.value)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                    selected
                      ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </Field>

        {visitType === "inpatient" && (
          <Field label="Ngày ra viện">
            <input
              type="date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
              className="input"
            />
          </Field>
        )}

        <div className="sm:col-span-2">
          <Field label="Triệu chứng">
            <textarea
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="VD: sốt, ho, đau bụng..."
              className="input resize-none"
            />
          </Field>
        </div>

        <Field label="Tổng chi phí (khám + thuốc)">
          <MoneyInput
            value={totalCost}
            onChange={setTotalCost}
            placeholder="VD: 1,500,000"
          />
        </Field>

        <div className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Bảo hiểm
          </span>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-300 bg-white px-3 py-2.5 transition-colors hover:border-gray-400">
            <input
              type="checkbox"
              checked={claimStatus === "claimed"}
              onChange={(e) =>
                setClaimStatus(e.target.checked ? "claimed" : "none")
              }
              className="h-5 w-5 shrink-0 accent-brand-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Đã claim được bảo hiểm cho lần khám này
            </span>
          </label>

          {claimStatus === "claimed" && (
            <div className="mt-3">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Số tiền claim được
              </span>
              <MoneyInput
                value={claimAmount}
                onChange={setClaimAmount}
                placeholder="VD: 1,200,000"
              />
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <Field label="Ghi chú">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input resize-none"
            />
          </Field>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="pt-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Lưu
        </button>
      </div>
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
