"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/lib/auth-context";
import type {
  ClientDoc,
  Diagnosis,
  DocumentCategory,
  HealthDocument,
  Profile,
  ProfileGrant,
  Visit,
  VisitWithProfile,
} from "@/lib/types";

const BUCKET = "health-docs";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

// Call an API route with the current user's access token, since the session
// lives in localStorage (not cookies) and isn't sent automatically.
async function authFetch(
  supabase: SupabaseClient,
  url: string,
  body: unknown,
  method = "POST",
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(b.error ?? "Thao tác thất bại. Vui lòng thử lại.");
  }
}

// --- Reads --------------------------------------------------------------

export function useProfiles() {
  const { supabase, session } = useAuth();
  return useQuery({
    queryKey: ["profiles"],
    enabled: Boolean(session),
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

export function useVisits(profileId?: string) {
  const { supabase, session } = useAuth();
  return useQuery({
    queryKey: ["visits", profileId ?? "all"],
    enabled: Boolean(session),
    queryFn: async (): Promise<VisitWithProfile[]> => {
      let query = supabase
        .from("visits")
        .select("*, profiles(id, full_name, relationship, owner_email)")
        .order("visit_date", { ascending: false });
      if (profileId) query = query.eq("profile_id", profileId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as VisitWithProfile[];
    },
  });
}

async function signDocuments(
  supabase: SupabaseClient,
  documents: HealthDocument[],
): Promise<ClientDoc[]> {
  if (documents.length === 0) return [];
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(
      documents.map((d) => d.storage_path),
      SIGNED_URL_TTL,
    );
  return documents.map((doc, i) => ({
    id: doc.id,
    category: doc.category,
    file_name: doc.file_name,
    mime_type: doc.mime_type,
    size_bytes: doc.size_bytes,
    storage_path: doc.storage_path,
    url: signed?.[i]?.signedUrl ?? "#",
  }));
}

export interface VisitDetail {
  visit: VisitWithProfile;
  docs: ClientDoc[];
}

export function useVisit(id: string) {
  const { supabase, session } = useAuth();
  return useQuery({
    queryKey: ["visit", id],
    enabled: Boolean(session) && Boolean(id),
    queryFn: async (): Promise<VisitDetail | null> => {
      const { data: visit, error } = await supabase
        .from("visits")
        .select("*, profiles(id, full_name, relationship, owner_email)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!visit) return null;

      const { data: documents } = await supabase
        .from("documents")
        .select("*")
        .eq("visit_id", id)
        .order("uploaded_at", { ascending: true });

      const docs = await signDocuments(
        supabase,
        (documents ?? []) as HealthDocument[],
      );
      return { visit: visit as VisitWithProfile, docs };
    },
  });
}

// --- Profile mutations --------------------------------------------------

export interface ProfileInput {
  full_name: string;
  relationship: string | null;
  dob: string | null;
  gender: string | null;
  notes: string | null;
}

export function useSaveProfile() {
  const { supabase, email } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: ProfileInput }) => {
      if (id) {
        const { error } = await supabase.from("profiles").update(values).eq("id", id);
        if (error) throw error;
        return;
      }
      // Set the owner explicitly rather than relying on the database trigger,
      // and read the row back: if RLS would hide the new profile, that surfaces
      // as an error here instead of a save that silently vanishes.
      const { error } = await supabase
        .from("profiles")
        .insert({ ...values, owner_email: email })
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profiles"] }),
  });
}

export function useDeleteProfile() {
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}

// --- Visit mutations ----------------------------------------------------

export interface VisitInput {
  profile_id: string;
  visit_date: string;
  hospital: string | null;
  specialty: string | null;
  diagnoses: Diagnosis[];
  doctor: string | null;
  notes: string | null;
}

// Fold the diagnoses array into the row we persist: the array is the source of
// truth, plus derived scalar summaries kept for display and search.
function visitRow(values: VisitInput) {
  const names = values.diagnoses.map((d) => d.name).filter(Boolean);
  const codes = values.diagnoses.map((d) => d.code).filter(Boolean);
  return {
    profile_id: values.profile_id,
    visit_date: values.visit_date,
    hospital: values.hospital,
    specialty: values.specialty,
    doctor: values.doctor,
    notes: values.notes,
    diagnoses: values.diagnoses,
    diagnosis: names.length > 0 ? names.join("; ") : null,
    icd_code: codes.length > 0 ? codes.join(", ") : null,
  };
}

export function useSaveVisit() {
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: VisitInput;
    }): Promise<string> => {
      const row = visitRow(values);
      if (id) {
        const { error } = await supabase.from("visits").update(row).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from("visits")
        .insert(row)
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      if (vars.id) qc.invalidateQueries({ queryKey: ["visit", vars.id] });
    },
  });
}

export function useDeleteVisit() {
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: docs } = await supabase
        .from("documents")
        .select("storage_path")
        .eq("visit_id", id);
      if (docs && docs.length > 0) {
        await supabase.storage
          .from(BUCKET)
          .remove(docs.map((d) => (d as { storage_path: string }).storage_path));
      }
      const { error } = await supabase.from("visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visits"] }),
  });
}

// --- Document mutations -------------------------------------------------

export function useUploadDocument() {
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      visitId,
      profileId,
      category,
      file,
    }: {
      visitId: string;
      profileId: string;
      category: DocumentCategory;
      file: File;
    }) => {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${profileId}/${visitId}/${category}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (uploadErr) throw uploadErr;

      const { error: docErr } = await supabase.from("documents").insert({
        visit_id: visitId,
        category,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
      });
      if (docErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw docErr;
      }
    },
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: ["visit", vars.visitId] }),
  });
}

export function useDeleteDocument() {
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentId,
      storagePath,
    }: {
      documentId: string;
      storagePath: string;
      visitId: string;
    }) => {
      const { error } = await supabase.from("documents").delete().eq("id", documentId);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([storagePath]);
    },
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: ["visit", vars.visitId] }),
  });
}

// --- Permissions helper -------------------------------------------------

// Can the given user edit this profile (and its visits/documents)?
export function canEditProfile(
  profile: { owner_email: string | null } | null | undefined,
  auth: { isAdmin: boolean; email: string },
): boolean {
  if (auth.isAdmin) return true;
  return Boolean(profile && profile.owner_email === auth.email);
}

// --- Managers (admin only) ----------------------------------------------

export interface ManagerRow {
  email: string;
  created_at: string;
}

export function useManagers() {
  const { supabase, session, isAdmin } = useAuth();
  return useQuery({
    queryKey: ["managers"],
    enabled: Boolean(session) && isAdmin,
    queryFn: async (): Promise<ManagerRow[]> => {
      const { data, error } = await supabase
        .from("managers")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ManagerRow[];
    },
  });
}

export function useAddManager() {
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => authFetch(supabase, "/api/managers", { email }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["managers"] }),
  });
}

export function useRemoveManager() {
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      authFetch(supabase, "/api/managers", { email }, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["managers"] }),
  });
}

// --- Guests (khách): per-patient read-only sharing ----------------------

// One guest email with the set of patients they can view.
export interface GuestEntry {
  email: string;
  grants: { id: string; profile_id: string; full_name: string | null }[];
}

// Every profile_grant the current user can see (admin: all; owner: their own
// patients' grants), grouped by guest email.
export function useGuests() {
  const { supabase, session, canManage } = useAuth();
  return useQuery({
    queryKey: ["guests"],
    enabled: Boolean(session) && canManage,
    queryFn: async (): Promise<GuestEntry[]> => {
      const { data, error } = await supabase
        .from("profile_grants")
        .select("id, profile_id, granted_email, profiles(full_name)")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const byEmail = new Map<string, GuestEntry>();
      for (const row of (data ?? []) as unknown as {
        id: string;
        profile_id: string;
        granted_email: string;
        profiles: { full_name: string | null } | null;
      }[]) {
        const entry = byEmail.get(row.granted_email) ?? {
          email: row.granted_email,
          grants: [],
        };
        entry.grants.push({
          id: row.id,
          profile_id: row.profile_id,
          full_name: row.profiles?.full_name ?? null,
        });
        byEmail.set(row.granted_email, entry);
      }
      return Array.from(byEmail.values());
    },
  });
}

export function useAddGuest() {
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      email,
      profileIds,
    }: {
      email: string;
      profileIds: string[];
    }) => authFetch(supabase, "/api/guests", { email, profileIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guests"] }),
  });
}

// Remove one patient grant from a guest (deletes a single profile_grants row).
export function useRemoveGuestGrant() {
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (grantId: string) => {
      const { error } = await supabase
        .from("profile_grants")
        .delete()
        .eq("id", grantId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guests"] }),
  });
}
