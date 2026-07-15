/**
 * Centralized error codes for the identity application.
 * All user-facing errors flow through these codes so the
 * identity shell can render localized messages without leaking internals.
 */

export type AuthErrorCode =
  | "missing_authorization_id"
  | "unknown_client"
  | "disabled_client"
  | "invalid_continuation"
  | "expired_continuation"
  | "consumed_continuation"
  | "tampered_continuation"
  | "callback_exchange_failed"
  | "invalid_callback_url"
  | "missing_code"
  | "duplicate_username"
  | "duplicate_email"
  | "reserved_username"
  | "invalid_username_format"
  | "weak_password"
  | "invalid_credentials"
  | "provider_denied"
  | "missing_product_entitlement"
  | "generic_auth_error";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export const AUTH_ERRORS: Record<AuthErrorCode, AuthError> = {
  missing_authorization_id: {
    code: "missing_authorization_id",
    message: "Зөвшөөрлийн ID байхгүй байна.",
  },
  unknown_client: {
    code: "unknown_client",
    message: "Тодорхойлогдоогүй хүсэлт.",
  },
  disabled_client: {
    code: "disabled_client",
    message: "Энэ хэрэглэгч идэвхигүй байна.",
  },
  invalid_continuation: {
    code: "invalid_continuation",
    message: "Үргэлжлүүлэх холбоос буруу байна.",
  },
  expired_continuation: {
    code: "expired_continuation",
    message: "Үргэлжлүүлэх холбоос хугацаа нь дууссан.",
  },
  consumed_continuation: {
    code: "consumed_continuation",
    message: "Энэ холбоос аль хэдийн хэрэглэгдсэн.",
  },
  tampered_continuation: {
    code: "tampered_continuation",
    message: "Үргэлжлүүлэх холбоос өөрчлөгдсөн.",
  },
  callback_exchange_failed: {
    code: "callback_exchange_failed",
    message: "Нэвтрэх кодыг солиход алдаа гарлаа.",
  },
  invalid_callback_url: {
    code: "invalid_callback_url",
    message: "Буруу буцах хаяг.",
  },
  missing_code: {
    code: "missing_code",
    message: "Нэвтрэх код олдсонгүй.",
  },
  duplicate_username: {
    code: "duplicate_username",
    message: "Энэ нэр аль хэдийн ашиглагдаж байна.",
  },
  duplicate_email: {
    code: "duplicate_email",
    message: "Энэ имэйл аль хэдийн бүртгэлтэй.",
  },
  reserved_username: {
    code: "reserved_username",
    message: "Энэ нэрийг ашиглах боломжгүй.",
  },
  invalid_username_format: {
    code: "invalid_username_format",
    message: "Нэр 3-32 тэмдэгт, латин үсэг тооноос бүрдэх ёстой.",
  },
  weak_password: {
    code: "weak_password",
    message: "Нууц үг хангалтгүй байна.",
  },
  invalid_credentials: {
    code: "invalid_credentials",
    message: "Имэйл/нэр эсвэл нууц үг буруу байна.",
  },
  provider_denied: {
    code: "provider_denied",
    message: "Нэвтрэх үйлчилгээг зөвшөөрөөгүй.",
  },
  missing_product_entitlement: {
    code: "missing_product_entitlement",
    message: "Энэ бүтээгдэхүнд нэвтрэх эрх хүрэлцэхгүй.",
  },
  generic_auth_error: {
    code: "generic_auth_error",
    message: "Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.",
  },
};
