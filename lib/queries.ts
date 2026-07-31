"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/lib/auth-context";
import type {
  AccessGrant,
  ClientDoc,
  DocumentCategory,
  HealthDocument,
  Profile,
  Visit,
  VisitWithProfile,
} from "@/lib/types";

const BUCKET = "health-docs";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

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
        .select("*, profiles(id, full_name, relationship)")
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
        .select("*, profiles(id, full_name, relationship)")
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

export interface ShareVisit {
  id: string;
  visit_date: string;
  diagnosis: string | null;
  hospital: string | null;
  profiles: { full_name: string } | null;
  access_grants: AccessGrant[];
}

export function useShareVisits() {
  const { supabase, session, isAdmin } = useAuth();
  return useQuery({
    queryKey: ["share-visits"],
    enabled: Boolean(session) && isAdmin,
    queryFn: async (): Promise<ShareVisit[]> => {
      const { data, error } = await supabase
        .from("visits")
        .select(
          "id, visit_date, diagnosis, hospital, profiles(full_name), access_grants(*)",
        )
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ShareVisit[];
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
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: ProfileInput }) => {
      if (id) {
        const { error } = await supabase.from("profiles").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").insert(values);
        if (error) throw error;
      }
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
  diagnosis: string | null;
  doctor: string | null;
  notes: string | null;
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
      if (id) {
        const { error } = await supabase.from("visits").update(values).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from("visits")
        .insert(values)
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

// --- Sharing mutations --------------------------------------------------

export function useGrantAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ visitId, email }: { visitId: string; email: string }) => {
      const res = await fetch("/api/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, email }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Không thể chia sẻ. Vui lòng thử lại.");
      }
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["share-visits"] });
      qc.invalidateQueries({ queryKey: ["visit", vars.visitId] });
    },
  });
}

export function useRevokeAccess() {
  const { supabase } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ grantId }: { grantId: string; visitId: string }) => {
      const { error } = await supabase.from("access_grants").delete().eq("id", grantId);
      if (error) throw error;
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["share-visits"] });
      qc.invalidateQueries({ queryKey: ["visit", vars.visitId] });
    },
  });
}
