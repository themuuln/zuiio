import type { SupabaseClient } from "@supabase/supabase-js";

export interface UploadOptions {
  /** Replace existing file at path (default: true) */
  upsert?: boolean;
  contentType?: string;
  /** Cache-Control header (default: "3600") */
  cacheControl?: string;
}

/**
 * Upload a file and return its public URL.
 * Works in browser, React Native (use FormData/Blob), and Node (use Buffer/ArrayBuffer).
 */
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

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

/** Remove one or more files from a bucket. */
export async function removeFiles(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[],
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}

/** Get a signed (temporary) URL for a private file. */
export async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

/** Build a deterministic storage path: `{prefix}/{uuid}.{ext}` */
export function buildStoragePath(prefix: string, filename: string): string {
  const ext = filename.split(".").pop() ?? "bin";
  const uuid = crypto.randomUUID();
  return `${prefix}/${uuid}.${ext}`;
}
