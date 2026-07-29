"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth";
import type { DocumentCategory } from "@/lib/types";

const CATEGORY_VALUES: [DocumentCategory, ...DocumentCategory[]] = [
  "lab_imaging",
  "prescription",
  "exam_form",
  "invoice",
  "other",
];

async function requireAdmin() {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  if (!session.isAdmin) throw new Error("Bạn không có quyền thực hiện thao tác này.");
  return session;
}

// --- Profiles ---------------------------------------------------------------

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Vui lòng nhập họ tên."),
  relationship: z.string().trim().optional(),
  dob: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function emptyToNull(v?: string) {
  return v && v.length > 0 ? v : null;
}

export async function createProfile(formData: FormData) {
  await requireAdmin();
  const data = profileSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").insert({
    full_name: data.full_name,
    relationship: emptyToNull(data.relationship),
    dob: emptyToNull(data.dob),
    gender: emptyToNull(data.gender),
    notes: emptyToNull(data.notes),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/profiles");
  redirect("/profiles");
}

export async function updateProfile(id: string, formData: FormData) {
  await requireAdmin();
  const data = profileSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      relationship: emptyToNull(data.relationship),
      dob: emptyToNull(data.dob),
      gender: emptyToNull(data.gender),
      notes: emptyToNull(data.notes),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/profiles");
  redirect("/profiles");
}

export async function deleteProfile(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/profiles");
}

// --- Visits -----------------------------------------------------------------

const visitSchema = z.object({
  profile_id: z.string().uuid("Vui lòng chọn thành viên."),
  visit_date: z.string().trim().min(1, "Vui lòng chọn ngày khám."),
  hospital: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  diagnosis: z.string().trim().optional(),
  doctor: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createVisit(formData: FormData) {
  await requireAdmin();
  const data = visitSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from("visits")
    .insert({
      profile_id: data.profile_id,
      visit_date: data.visit_date,
      hospital: emptyToNull(data.hospital),
      specialty: emptyToNull(data.specialty),
      diagnosis: emptyToNull(data.diagnosis),
      doctor: emptyToNull(data.doctor),
      notes: emptyToNull(data.notes),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect(`/visit/${inserted.id}`);
}

export async function updateVisit(id: string, formData: FormData) {
  await requireAdmin();
  const data = visitSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();

  const { error } = await supabase
    .from("visits")
    .update({
      profile_id: data.profile_id,
      visit_date: data.visit_date,
      hospital: emptyToNull(data.hospital),
      specialty: emptyToNull(data.specialty),
      diagnosis: emptyToNull(data.diagnosis),
      doctor: emptyToNull(data.doctor),
      notes: emptyToNull(data.notes),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/visit/${id}`);
  redirect(`/visit/${id}`);
}

export async function deleteVisit(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  // Remove attached files from storage first, then the visit row (documents
  // cascade). Storage objects are not covered by the DB cascade.
  const { data: docs } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("visit_id", id);

  if (docs && docs.length > 0) {
    const admin = createAdminClient();
    await admin.storage
      .from("health-docs")
      .remove(docs.map((d) => d.storage_path));
  }

  const { error } = await supabase.from("visits").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/");
}

// --- Documents (file upload / delete) ---------------------------------------

export async function uploadDocument(formData: FormData) {
  await requireAdmin();

  const visitId = String(formData.get("visit_id") ?? "");
  const category = String(formData.get("category") ?? "") as DocumentCategory;
  const file = formData.get("file");

  if (!CATEGORY_VALUES.includes(category)) throw new Error("Loại giấy tờ không hợp lệ.");
  if (!(file instanceof File) || file.size === 0) throw new Error("Chưa chọn tệp.");

  const supabase = await createClient();

  // Confirm the visit exists (and get its profile_id for the storage path).
  const { data: visit, error: visitErr } = await supabase
    .from("visits")
    .select("id, profile_id")
    .eq("id", visitId)
    .single();
  if (visitErr || !visit) throw new Error("Không tìm thấy lần khám.");

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const unique = crypto.randomUUID();
  const path = `${visit.profile_id}/${visit.id}/${category}/${unique}-${safeName}`;

  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from("health-docs")
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadErr) throw new Error(uploadErr.message);

  const { error: docErr } = await supabase.from("documents").insert({
    visit_id: visit.id,
    category,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
  });
  if (docErr) {
    // Roll back the uploaded file if the metadata insert fails.
    await admin.storage.from("health-docs").remove([path]);
    throw new Error(docErr.message);
  }

  revalidatePath(`/visit/${visit.id}`);
}

export async function deleteDocument(documentId: string, visitId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();

  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) throw new Error(error.message);

  if (doc) {
    const admin = createAdminClient();
    await admin.storage.from("health-docs").remove([doc.storage_path]);
  }

  revalidatePath(`/visit/${visitId}`);
}

// --- Access grants (sharing) ------------------------------------------------

const grantSchema = z.object({
  visit_id: z.string().uuid(),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ."),
});

export async function grantAccess(formData: FormData) {
  await requireAdmin();
  const { visit_id, email } = grantSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();
  const admin = createAdminClient();

  // Ensure an auth account exists for this email so they can receive an OTP.
  // Ignore the error if the user already exists.
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr && !/already/i.test(createErr.message)) {
    throw new Error(createErr.message);
  }

  const { error } = await supabase
    .from("access_grants")
    .upsert({ visit_id, granted_email: email }, { onConflict: "visit_id,granted_email" });
  if (error) throw new Error(error.message);

  revalidatePath("/share");
  revalidatePath(`/visit/${visit_id}`);
}

export async function revokeAccess(grantId: string, visitId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("access_grants").delete().eq("id", grantId);
  if (error) throw new Error(error.message);
  revalidatePath("/share");
  revalidatePath(`/visit/${visitId}`);
}

// --- Auth -------------------------------------------------------------------

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
