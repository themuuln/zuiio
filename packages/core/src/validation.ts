/** Validate email format. */
export function requireEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate password — minimum 8 characters. */
export function requirePassword(password: string): boolean {
  return password.length >= 8;
}

/** Safely extract a trimmed string from FormData. */
export function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

/** Normalize phone number — remove spaces and dashes. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

/** Sanitize a redirect path — prevents open redirect attacks. */
export function sanitizeRedirectPath(path: string): string {
  if (!path || typeof path !== "string") return "/";
  if (!path.startsWith("/")) return "/";
  if (path.startsWith("//")) return "/";
  try {
    const url = new URL(path, "http://localhost");
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

/** Escape HTML special characters — prevents XSS in user-supplied strings. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
