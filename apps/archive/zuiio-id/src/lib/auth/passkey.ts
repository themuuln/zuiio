interface PasskeyErrorLike {
  code?: unknown;
  name?: unknown;
  cause?: unknown;
}

function isPasskeyErrorLike(error: unknown): error is PasskeyErrorLike {
  return typeof error === "object" && error !== null;
}

export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "PublicKeyCredential" in window &&
    "credentials" in navigator
  );
}

export function isPasskeyCancellation(error: unknown): boolean {
  if (!isPasskeyErrorLike(error)) return false;

  const passkeyError = error;

  if (passkeyError.code === "ERROR_CEREMONY_ABORTED") return true;
  if (
    passkeyError.name === "AbortError" ||
    passkeyError.name === "NotAllowedError"
  ) {
    return true;
  }

  const cause = passkeyError.cause;
  return (
    isPasskeyErrorLike(cause) &&
    (cause.name === "AbortError" || cause.name === "NotAllowedError")
  );
}

export function getPasskeyErrorMessage(error: unknown): string {
  const code = isPasskeyErrorLike(error) ? error.code : undefined;

  switch (code) {
    case "passkey_disabled":
      return "Passkey нэвтрэлт одоогоор идэвхгүй байна.";
    case "too_many_passkeys":
      return "Passkey-ийн дээд хязгаарт хүрсэн байна. Хуучин passkey-гээ устгаад дахин оролдоно уу.";
    case "webauthn_credential_exists":
    case "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED":
      return "Энэ passkey таны бүртгэлд аль хэдийн нэмэгдсэн байна.";
    case "webauthn_credential_not_found":
      return "Тохирох passkey олдсонгүй. Өөр нэвтрэх аргыг ашиглана уу.";
    case "webauthn_challenge_expired":
      return "Passkey хүсэлтийн хугацаа дууслаа. Дахин оролдоно уу.";
    case "webauthn_verification_failed":
      return "Passkey-г баталгаажуулж чадсангүй. Дахин оролдоно уу.";
    case "ERROR_INVALID_DOMAIN":
    case "ERROR_INVALID_RP_ID":
      return "Passkey домэйны тохиргоо буруу байна. Системийн админтай холбогдоно уу.";
    case "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT":
    case "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT":
      return "Энэ төхөөрөмж шаардлагатай passkey боломжийг дэмжихгүй байна.";
    default:
      return "Passkey үйлдлийг дуусгаж чадсангүй. Дахин оролдоно уу.";
  }
}
