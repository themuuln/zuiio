export interface GoogleNoncePair {
  rawNonce: string;
  hashedNonce: string;
}

/**
 * Generates the nonce pair required by Google Identity Services and Supabase.
 * Google receives the SHA-256 hash; Supabase receives the original nonce.
 */
export async function generateGoogleNonce(): Promise<GoogleNoncePair> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const rawNonce = btoa(String.fromCharCode(...randomBytes));
  const encodedNonce = new TextEncoder().encode(rawNonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return { rawNonce, hashedNonce };
}
