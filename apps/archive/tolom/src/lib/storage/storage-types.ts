/**
 * Unified storage interface.
 * Both Supabase Storage and R2 implementations conform to this.
 */

export interface UploadParams {
  orgId: string;
  fileName: string;
  mimeType: string;
  entityType: string;
  entityId?: string;
}

export interface UploadResult {
  url: string;
  path: string;
  bucket: string;
}

export interface StorageBackend {
  upload(params: UploadParams, fileBuffer: ArrayBuffer): Promise<UploadResult>;
  delete(urlOrPath: string): Promise<void>;
  getPublicUrl(path: string, bucket?: string): string;
  validateUpload(
    fileName: string,
    mimeType: string,
    fileSize: number,
  ): string | null;
}
