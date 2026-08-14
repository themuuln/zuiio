import type { AuthError, PostgrestError } from "@supabase/supabase-js";

const POSTGREST_MESSAGES: Record<string, string> = {
  "42501": "Хандах эрх байхгүй",
  "23503": "Холбоотой өгөгдөл байна — устгах боломжгүй",
  "23505": "Энэ утга аль хэдийн бүртгэлтэй байна",
  PGRST116: "Өгөгдөл олдсонгүй",
  PGRST204: "Хүсэлтийн баганын нэр буруу байна",
};

export function parseRLSError(error: PostgrestError): string {
  return POSTGREST_MESSAGES[error.code] ?? error.message;
}

export function parseAuthError(error: AuthError): string {
  const msg = error.message.toLowerCase();
  if (msg.includes("invalid login credentials"))
    return "Нэвтрэх нэр эсвэл нууц үг буруу байна";
  if (msg.includes("email not confirmed"))
    return "И-мэйл хаягаа баталгаажуулна уу";
  if (msg.includes("user already registered"))
    return "Энэ и-мэйл хаяг аль хэдийн бүртгэлтэй байна";
  if (msg.includes("password should be at least"))
    return "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой";
  if (msg.includes("email rate limit exceeded"))
    return "Хэт олон оролдлого хийгдлээ. Түр хүлээнэ үү";
  if (msg.includes("token has expired"))
    return "Холбоос хугацаа дууссан байна. Дахин оролдоно уу";
  return error.message;
}

export function isRLSError(error: PostgrestError): boolean {
  return error.code === "42501";
}

export function isUniqueViolation(error: PostgrestError): boolean {
  return error.code === "23505";
}

export function isForeignKeyViolation(error: PostgrestError): boolean {
  return error.code === "23503";
}
