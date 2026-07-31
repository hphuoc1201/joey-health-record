import type { VisitWithProfile } from "@/lib/types";

export interface Counted {
  key: string;
  label: string;
  count: number;
}

export interface MemberStats {
  total: number;
  lastVisit: string | null;
  firstVisit: string | null;
  hospitalsCount: number;
  byYear: { year: string; count: number }[];
  topSpecialties: Counted[];
  topDiagnoses: Counted[];
}

// Everything derivable from a member's visit list (already sorted newest-first).
export function computeMemberStats(visits: VisitWithProfile[]): MemberStats {
  const years = new Map<string, number>();
  const hospitals = new Set<string>();
  const specialties = new Map<string, number>();
  const diagnoses = new Map<string, Counted>();

  for (const v of visits) {
    const year = v.visit_date.slice(0, 4);
    years.set(year, (years.get(year) ?? 0) + 1);

    if (v.hospital) hospitals.add(v.hospital);
    if (v.specialty)
      specialties.set(v.specialty, (specialties.get(v.specialty) ?? 0) + 1);

    for (const d of v.diagnoses ?? []) {
      const key = `${d.code}|${d.name}`;
      const existing = diagnoses.get(key);
      const label = d.code ? `${d.code} · ${d.name}` : d.name;
      diagnoses.set(key, { key, label, count: (existing?.count ?? 0) + 1 });
    }
  }

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
    byYear,
    topSpecialties,
    topDiagnoses,
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
