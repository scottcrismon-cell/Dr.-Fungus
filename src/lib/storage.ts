import { createClient } from "@supabase/supabase-js";

export type AssessmentDraft = {
  file: File;
  concern: string;
  notes: string;
};

export type SavedAssessment = {
  id: string;
  imageUrl: string | null;
  persisted: boolean;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;

export async function saveAssessment(
  draft: AssessmentDraft,
): Promise<SavedAssessment> {
  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      imageUrl: null,
      persisted: false,
    };
  }

  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();
  const user = existingUser;

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const extension = draft.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const assessmentId = crypto.randomUUID();
  const objectPath = `${user.id}/${assessmentId}/original.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("foot-assessments")
    .upload(objectPath, draft.file, {
      cacheControl: "3600",
      contentType: draft.file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from("assessments").insert({
    id: assessmentId,
    user_id: user.id,
    image_path: objectPath,
    concern: draft.concern,
    notes: draft.notes || null,
    status: "awaiting_analysis",
  });

  if (insertError) {
    await supabase.storage.from("foot-assessments").remove([objectPath]);
    throw insertError;
  }

  return {
    id: assessmentId,
    imageUrl: objectPath,
    persisted: true,
  };
}
