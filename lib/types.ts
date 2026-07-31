export type DocumentCategory =
  | "lab_imaging"
  | "prescription"
  | "exam_form"
  | "invoice"
  | "other";

export interface Profile {
  id: string;
  full_name: string;
  relationship: string | null;
  dob: string | null;
  gender: string | null;
  notes: string | null;
  owner_email: string | null;
  created_at: string;
}

export interface Diagnosis {
  code: string; // ICD-10 code, may be "" for a free-text diagnosis
  name: string;
}

export interface Visit {
  id: string;
  profile_id: string;
  visit_date: string;
  hospital: string | null;
  specialty: string | null;
  diagnosis: string | null; // derived summary of `diagnoses` (display/search)
  icd_code: string | null; // derived summary of `diagnoses`
  diagnoses: Diagnosis[];
  doctor: string | null;
  notes: string | null;
  created_at: string;
}

export interface VisitWithProfile extends Visit {
  profiles: Pick<
    Profile,
    "id" | "full_name" | "relationship" | "owner_email"
  > | null;
}

export interface HealthDocument {
  id: string;
  visit_id: string;
  category: DocumentCategory;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_at: string;
}

export interface AccessGrant {
  id: string;
  visit_id: string;
  granted_email: string;
  created_at: string;
}

export interface ProfileGrant {
  id: string;
  profile_id: string;
  granted_email: string;
  created_at: string;
}

// A document paired with a short-lived signed URL for viewing/downloading.
export interface ClientDoc {
  id: string;
  category: DocumentCategory;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  url: string;
}
