import type { SupabaseClient } from "@supabase/supabase-js";

export interface UploadOptions {
  upsert?: boolean;
  contentType?: string;
  cacheControl?: string;
}

export async function uploadFile(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: File | Blob | ArrayBuffer | FormData,
  opts: UploadOptions = {},
): Promise<string> {
  const { upsert = true, contentType, cacheControl = "3600" } = opts;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert,
    contentType,
    cacheControl,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export function getPublicUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
