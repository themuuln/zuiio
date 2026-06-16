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
