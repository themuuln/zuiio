"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface MfaFactor {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: string;
}

/**
 * TOTP MFA manager for the /account page.
 * Shows existing TOTP factors, allows enrollment and removal.
 * Opt-in: users without a verified factor are not forced to enroll.
 */
export function MfaManager() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  const loadFactors = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
      // data.totp only has verified; data.all has everything
      const totpFactors = (data.all ?? [])
        .filter((f) => f.factor_type === "totp")
        .map((f) => ({
          id: f.id,
          friendly_name: f.friendly_name ?? null,
          factor_type: f.factor_type,
          status: f.status,
        }));
      setFactors(totpFactors);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadFactors();
  }, [loadFactors]);

  const startEnrollment = async () => {
    setEnrolling(true);
    setError(null);
    setSuccess(null);
    setQrCode(null);
    setSecret(null);

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Таны төхөөрөмж",
    });

    if (error) {
      setError("Бүртгүүлэхэд алдаа гарлаа.");
      setEnrolling(false);
      return;
    }

    const totp = data?.totp;
    if (totp) {
      setQrCode(totp.qr_code);
      setSecret(totp.secret);
    }
  };

  const confirmEnrollment = async () => {
    if (verifyCode.length !== 6) {
      setError("6 оронтоо код оруулна уу.");
      return;
    }

    setError(null);
    setSuccess(null);

    // Find the unverified TOTP factor from the full list
    const unverified = factors.find((f) => f.status === "unverified");

    if (!unverified) {
      // Reload and try again
      const { data } = await supabase.auth.mfa.listFactors();
      const f = data?.all?.find(
        (t) => t.factor_type === "totp" && t.status === "unverified",
      );
      if (!f) {
        setError("Бүртгүүлэлт олдсонгүй. Дахин оролдоно уу.");
        setEnrolling(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify(
        {
          factorId: f.id,
          code: verifyCode,
        },
      );

      if (verifyError) {
        setError("Код буруу байна. Дахин оролдоно уу.");
        return;
      }

      setSuccess("MFA амжилттай идэвхжүүллээ!");
      setEnrolling(false);
      setQrCode(null);
      setSecret(null);
      setVerifyCode("");
      loadFactors();
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: unverified.id,
      code: verifyCode,
    });

    if (verifyError) {
      setError("Код буруу байна. Дахин оролдоно уу.");
      return;
    }

    setSuccess("MFA амжилттай идэвхжүүллээ!");
    setEnrolling(false);
    setQrCode(null);
    setSecret(null);
    setVerifyCode("");
    loadFactors();
  };

  const removeFactor = async (factorId: string) => {
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      setError("MFA-г устгахад алдаа гарлаа.");
      return;
    }

    setSuccess("MFA амжилттай устгагдлаа.");
    loadFactors();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const verifiedFactors = factors.filter((f) => f.status === "verified");

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-foreground">
        Нэмэлт нэвтрэх баталгаа (MFA)
      </h2>

      {error && (
        <div className="animate-slide-down mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="animate-slide-down mb-3 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {success}
        </div>
      )}

      {verifiedFactors.length > 0 && !enrolling && (
        <div className="space-y-2">
          {verifiedFactors.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div>
                <p className="text-sm text-foreground">
                  {f.friendly_name ?? "TOTP"}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-success">
                  <span className="inline-block size-1.5 rounded-full bg-success" />
                  Идэвхитай
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFactor(f.id)}
                className="text-xs text-destructive hover:underline"
              >
                Устгах
              </button>
            </div>
          ))}
        </div>
      )}

      {!enrolling && verifiedFactors.length === 0 && (
        <button
          type="button"
          onClick={startEnrollment}
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          TOTP нэмэх
        </button>
      )}

      {enrolling && (
        <div className="rounded-lg border border-border bg-card p-4">
          {qrCode ? (
            <>
              <p className="mb-3 text-sm text-foreground">
                Google Authenticator эсвэл бусад TOTP апп-д QR кодыг уншуулна
                уу:
              </p>
              <div className="flex justify-center">
                <Image
                  src={qrCode}
                  alt="TOTP QR код"
                  width={192}
                  height={192}
                  unoptimized
                  className="rounded-lg border border-border"
                />
              </div>
              {secret && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Эсвэл нууц түлхүүр:{" "}
                  <code className="font-mono">{secret}</code>
                </p>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 оронтоо код"
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="h-10 rounded-lg border border-input bg-background px-3 text-center text-sm font-mono tracking-widest text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmEnrollment}
                    disabled={verifyCode.length !== 6}
                    className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    Баталгаажуулах
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnrolling(false);
                      setQrCode(null);
                      setSecret(null);
                      setVerifyCode("");
                    }}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Цуцлах
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      )}

      {!enrolling && verifiedFactors.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Нэмэлт нэвтрэх баталгаа нь таны бүртгэлийг хамгаална. Нэмэх нь заавал
          биш.
        </p>
      )}
    </div>
  );
}
