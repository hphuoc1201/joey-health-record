import type { VisitWithProfile } from "@/lib/types";

export interface Counted {
  key: string;
  label: string;
  count: number;
}

export interface DiagnosisProgression {
  code: string;
  label: string;
  dates: string[]; // visit dates (ascending) where this diagnosis appears
}

export interface MemberStats {
  total: number;
  lastVisit: string | null;
  firstVisit: string | null;
  hospitalsCount: number;
  avgIntervalDays: number | null; // average days between consecutive visits
  byYear: { year: string; count: number }[];
  topSpecialties: Counted[];
  topDiagnoses: Counted[];
  recurring: DiagnosisProgression[]; // diagnoses seen in 2+ visits
  // Insurance / spending
  totalCost: number; // sum of every visit's total cost
  totalClaimed: number; // sum recovered from insurance (claimed visits)
  outOfPocket: number; // totalCost - totalClaimed (never below 0)
  claimedCount: number; // number of visits marked as claimed
}

// Everything derivable from a member's visit list (already sorted newest-first).
export function computeMemberStats(visits: VisitWithProfile[]): MemberStats {
  const years = new Map<string, number>();
  const hospitals = new Set<string>();
  const specialties = new Map<string, number>();
  const diagnoses = new Map<string, Counted>();
  const progression = new Map<string, DiagnosisProgression>();

  let totalCost = 0;
  let totalClaimed = 0;
  let claimedCount = 0;

  for (const v of visits) {
    const year = v.visit_date.slice(0, 4);
    years.set(year, (years.get(year) ?? 0) + 1);

    if (v.total_cost != null) totalCost += v.total_cost;
    if (v.claim_status === "claimed") {
      claimedCount += 1;
      if (v.claim_amount != null) totalClaimed += v.claim_amount;
    }

    if (v.hospital) hospitals.add(v.hospital);
    if (v.specialty)
      specialties.set(v.specialty, (specialties.get(v.specialty) ?? 0) + 1);

    for (const d of v.diagnoses ?? []) {
      const key = `${d.code}|${d.name}`;
      const existing = diagnoses.get(key);
      const label = d.code ? `${d.code} · ${d.name}` : d.name;
      diagnoses.set(key, { key, label, count: (existing?.count ?? 0) + 1 });

      const prog =
        progression.get(key) ??
        ({ code: d.code, label, dates: [] } as DiagnosisProgression);
      prog.dates.push(v.visit_date);
      progression.set(key, prog);
    }
  }

  // Average number of days between consecutive visits.
  const sortedDates = visits
    .map((v) => v.visit_date)
    .sort((a, b) => a.localeCompare(b));
  let avgIntervalDays: number | null = null;
  if (sortedDates.length >= 2) {
    let totalDays = 0;
    for (let i = 1; i < sortedDates.length; i++) {
      totalDays +=
        (new Date(sortedDates[i]).getTime() -
          new Date(sortedDates[i - 1]).getTime()) /
        86_400_000;
    }
    avgIntervalDays = Math.round(totalDays / (sortedDates.length - 1));
  }

  const recurring = Array.from(progression.values())
    .filter((p) => p.dates.length >= 2)
    .map((p) => ({
      ...p,
      dates: p.dates.slice().sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => b.dates.length - a.dates.length);

  const byYear = Array.from(years.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year.localeCompare(a.year));

  const topSpecialties = Array.from(specialties.entries())
    .map(([label, count]) => ({ key: label, label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topDiagnoses = Array.from(diagnoses.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total: visits.length,
    lastVisit: visits[0]?.visit_date ?? null,
    firstVisit: visits[visits.length - 1]?.visit_date ?? null,
    hospitalsCount: hospitals.size,
    avgIntervalDays,
    byYear,
    topSpecialties,
    topDiagnoses,
    recurring,
    totalCost,
    totalClaimed,
    outOfPocket: Math.max(0, totalCost - totalClaimed),
    claimedCount,
  };
}

export function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const [y, m, d] = dob.split("-").map(Number);
  if (!y) return null;
  // Compute against the visit data era without Date.now dependence issues:
  // use the browser's current date only on the client.
  const now = new Date();
  let age = now.getFullYear() - y;
  const beforeBirthday =
    now.getMonth() + 1 < (m || 1) ||
    (now.getMonth() + 1 === (m || 1) && now.getDate() < (d || 1));
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}
