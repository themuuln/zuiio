import { r2Backend } from "./r2-backend";
import { getStorageBackend } from "./storage-config";
import { supabaseBackend } from "./storage-service";
import type { StorageBackend } from "./storage-types";

let _backend: StorageBackend | null = null;

/**
 * Get the active storage backend based on STORAGE_BACKEND env var.
 * Cached after first call.
 */
export function getStorage(): StorageBackend {
  if (!_backend) {
    const backend = getStorageBackend();
    _backend = backend === "r2" ? r2Backend : supabaseBackend;
  }
  return _backend;
}
