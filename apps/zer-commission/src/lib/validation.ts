export function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function getNumber(formData: FormData, key: string) {
  const raw = formData.get(key);
  const value = Number(raw ?? 0);

  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return value;
}

export function requireEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function requirePassword(password: string) {
  return password.length >= 8;
}

export function normalizePhone(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned || null;
}

export function sanitizeRedirectPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}
