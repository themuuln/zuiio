export function requireEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function requirePassword(password: string): boolean {
  return password.length >= 8;
}

export function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

export function sanitizeRedirectPath(path: string): string {
  if (!path || typeof path !== "string") return "/";
  // Only allow relative paths starting with /
  if (!path.startsWith("/")) return "/";
  // Block external URLs and protocol-relative URLs
  if (path.startsWith("//")) return "/";
  try {
    const url = new URL(path, "http://localhost");
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * Replaces &, <, >, ", and ' with their HTML entity equivalents.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
