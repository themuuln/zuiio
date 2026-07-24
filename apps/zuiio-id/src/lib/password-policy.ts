/**
 * Password strength requirements following NIST SP 800-63B guidelines:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - No common/breached passwords (we check against a small blocklist)
 * - Maximum 128 characters (reasonable limit)
 */

const COMMON_PASSWORDS: Record<string, true> = {
  password: true,
  "12345678": true,
  qwerty123: true,
  admin123: true,
  letmein: true,
  welcome1: true,
  monkey123: true,
  dragon123: true,
  login123: true,
  princess1: true,
  football1: true,
  shadow123: true,
  master123: true,
  qwerty1: true,
  abc12345: true,
  password1: true,
  passw0rd: true,
  "123456789": true,
  "1234567890": true,
  trustno1: true,
};

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой.");
  }

  if (password.length > 128) {
    errors.push("Нууц үг хамгийн ихдээ 128 тэмдэгт байх ёстой.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Нууц үг дор хаяж нэг том үсэг агуулсан байх ёстой.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Нууц үг дор хаяж нэг жижиг үсэг агуулсан байх ёстой.");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Нууц үг дор хаяж нэг тоо агуулсан байх ёстой.");
  }

  if (password.toLowerCase() in COMMON_PASSWORDS) {
    errors.push("Энэ нууц үг хэт энгийн байна. Өөр нууц үг сонгоно уу.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
