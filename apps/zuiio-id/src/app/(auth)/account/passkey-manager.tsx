"use client";

import { FingerprintSimpleIcon } from "@phosphor-icons/react/FingerprintSimple";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPasskeyErrorMessage,
  isPasskeyCancellation,
  isPasskeySupported,
} from "@/lib/auth/passkey";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface Passkey {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
}

interface Feedback {
  tone: "error" | "success";
  message: string;
}

const passkeyDateFormatter = new Intl.DateTimeFormat("mn-MN", {
  dateStyle: "medium",
});

export function PasskeyManager() {
  const [supabase] = useState(createBrowserSupabaseClient);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supportStatus, setSupportStatus] = useState<
    "checking" | "supported" | "unsupported"
  >("checking");
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [friendlyName, setFriendlyName] = useState("");
  const passkeyNameInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const refreshPasskeys = useCallback(async () => {
    const { data, error } = await supabase.auth.passkey.list();
    if (error) {
      setFeedback({ tone: "error", message: getPasskeyErrorMessage(error) });
    } else {
      setPasskeys(data ?? []);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!isPasskeySupported()) {
      setSupportStatus("unsupported");
      setIsLoading(false);
      return;
    }

    setSupportStatus("supported");
    void refreshPasskeys();
  }, [refreshPasskeys]);

  useEffect(() => {
    if (editingId) {
      passkeyNameInputRef.current?.focus();
    }
  }, [editingId]);

  async function handleRegister() {
    setActiveOperation("register");
    setFeedback(null);

    const { error } = await supabase.auth.registerPasskey();
    if (error) {
      if (!isPasskeyCancellation(error)) {
        setFeedback({ tone: "error", message: getPasskeyErrorMessage(error) });
      }
      setActiveOperation(null);
      return;
    }

    await refreshPasskeys();
    setFeedback({
      tone: "success",
      message: "Passkey амжилттай нэмэгдлээ.",
    });
    setActiveOperation(null);
  }

  async function handleRename(passkeyId: string) {
    const nextName = friendlyName.trim();
    if (!nextName) {
      setFeedback({
        tone: "error",
        message: "Passkey-ийн нэрийг оруулна уу.",
      });
      return;
    }

    setActiveOperation(`rename:${passkeyId}`);
    setFeedback(null);
    const { data, error } = await supabase.auth.passkey.update({
      passkeyId,
      friendlyName: nextName,
    });

    if (error) {
      setFeedback({ tone: "error", message: getPasskeyErrorMessage(error) });
    } else if (data) {
      setPasskeys((current) =>
        current.map((passkey) =>
          passkey.id === passkeyId ? { ...passkey, ...data } : passkey,
        ),
      );
      setEditingId(null);
      setFeedback({
        tone: "success",
        message: "Passkey-ийн нэр шинэчлэгдлээ.",
      });
    }
    setActiveOperation(null);
  }

  async function handleDelete(passkey: Passkey) {
    const name = passkey.friendly_name?.trim() || "Passkey";
    if (!window.confirm(`“${name}”-г бүртгэлээс устгах уу?`)) return;

    setActiveOperation(`delete:${passkey.id}`);
    setFeedback(null);
    const { error } = await supabase.auth.passkey.delete({
      passkeyId: passkey.id,
    });

    if (error) {
      setFeedback({ tone: "error", message: getPasskeyErrorMessage(error) });
    } else {
      setPasskeys((current) =>
        current.filter((item) => item.id !== passkey.id),
      );
      setFeedback({ tone: "success", message: "Passkey устгагдлаа." });
    }
    setActiveOperation(null);
  }

  return (
    <section
      className="flex flex-col gap-4 border-t border-border pt-6"
      aria-labelledby="passkeys-heading"
    >
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FingerprintSimpleIcon size={22} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h2
            id="passkeys-heading"
            className="text-base font-semibold text-foreground"
          >
            Passkey
          </h2>
          <p className="text-sm leading-5 text-muted-foreground">
            Нүүр эсвэл хурууны хээ, төхөөрөмжийн PIN, аюулгүй байдлын түлхүүрээр
            нууц үггүй нэвтэрнэ.
          </p>
        </div>
      </div>

      {supportStatus === "unsupported" && (
        <div
          className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"
          role="status"
        >
          Энэ хөтөч эсвэл холболт passkey дэмжихгүй байна. HTTPS ашиглаж байгаа
          эсэхээ шалгана уу.
        </div>
      )}

      {supportStatus !== "unsupported" && isLoading && (
        <div
          className="flex flex-col gap-2"
          role="status"
          aria-busy="true"
          aria-label="Passkey жагсаалтыг ачаалж байна"
        >
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        </div>
      )}

      {supportStatus === "supported" && !isLoading && passkeys.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Таны passkey-үүд">
          {passkeys.map((passkey) => {
            const isRenaming = activeOperation === `rename:${passkey.id}`;
            const isDeleting = activeOperation === `delete:${passkey.id}`;

            return (
              <li
                key={passkey.id}
                className="rounded-lg border border-border bg-card p-3"
              >
                {editingId === passkey.id ? (
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleRename(passkey.id);
                    }}
                  >
                    <label
                      htmlFor={`passkey-name-${passkey.id}`}
                      className="text-xs font-medium text-foreground"
                    >
                      Passkey-ийн нэр
                    </label>
                    <input
                      id={`passkey-name-${passkey.id}`}
                      value={friendlyName}
                      ref={passkeyNameInputRef}
                      onChange={(event) => setFriendlyName(event.target.value)}
                      maxLength={120}
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isRenaming}
                        className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRenaming ? "Хадгалж байна…" : "Хадгалах"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={isRenaming}
                        className="h-9 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                      >
                        Болих
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">
                        {passkey.friendly_name?.trim() || "Passkey"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {passkeyDateFormatter.format(
                          new Date(passkey.created_at),
                        )}
                        -д нэмсэн
                        {passkey.last_used_at
                          ? ` · ${passkeyDateFormatter.format(new Date(passkey.last_used_at))}-д ашигласан`
                          : ""}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(passkey.id);
                          setFriendlyName(
                            passkey.friendly_name?.trim() || "Passkey",
                          );
                          setFeedback(null);
                        }}
                        disabled={isDeleting}
                        className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                      >
                        Нэр өөрчлөх
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(passkey)}
                        disabled={isDeleting}
                        className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                      >
                        {isDeleting ? "Устгаж байна…" : "Устгах"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {feedback && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            feedback.tone === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleRegister()}
        disabled={
          supportStatus !== "supported" || isLoading || activeOperation !== null
        }
        className="h-11 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {activeOperation === "register"
          ? "Passkey үүсгэж байна…"
          : "Шинэ passkey нэмэх"}
      </button>
    </section>
  );
}
