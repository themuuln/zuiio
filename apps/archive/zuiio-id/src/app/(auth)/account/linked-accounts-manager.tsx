"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface Identity {
  id: string;
  identity_id: string;
  user_id: string;
  provider: string;
  last_sign_in_at: string;
  created_at: string;
  updated_at: string;
}

interface Feedback {
  tone: "error" | "success";
  message: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  email: "Имэйл/Нууц үг",
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
  github: "GitHub",
  passkey: "Passkey",
};

const PROVIDER_ICONS: Record<string, string> = {
  email: "📧",
  google: "🔴",
  apple: "🍎",
  facebook: "🔵",
  github: "⚫",
  passkey: "🔑",
};

export function LinkedAccountsManager() {
  const [supabase] = useState(createBrowserSupabaseClient);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);

  const refreshIdentities = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) {
        console.error("[LinkedAccounts] getUserIdentities:", error);
        return;
      }
      // getUserIdentities returns { identities: UserIdentity[] }
      setIdentities((data?.identities as Identity[]) ?? []);
    } catch (err) {
      console.error("[LinkedAccounts] Unexpected:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refreshIdentities();
  }, [refreshIdentities]);

  // Listen for identity changes (link/unlink)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        refreshIdentities();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, refreshIdentities]);

  async function handleLink(provider: string) {
    setLinkingProvider(provider);
    setFeedback(null);

    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: provider as "google" | "apple" | "facebook" | "github",
      });

      if (error) {
        console.error("[LinkedAccounts] linkIdentity:", error);
        setFeedback({
          tone: "error",
          message: `${PROVIDER_LABELS[provider] ?? provider} холбоход алдаа гарлаа: ${error.message}`,
        });
      }
      // On success, Supabase redirects to provider consent page
      // and back to callback, which triggers onAuthStateChange
    } catch (err) {
      console.error("[LinkedAccounts] link error:", err);
      setFeedback({
        tone: "error",
        message: "Холбох үед алдаа гарлаа.",
      });
    } finally {
      setLinkingProvider(null);
    }
  }

  async function handleUnlink(identity: Identity) {
    // Don't allow unlinking the last identity
    if (identities.length <= 1) {
      setFeedback({
        tone: "error",
        message: "Сүүлийн нэвтрэх аргыг устгах боломжгүй.",
      });
      return;
    }

    // Confirm before unlinking
    const providerName =
      PROVIDER_LABELS[identity.provider] ?? identity.provider;
    if (
      !window.confirm(
        `${providerName} холболтыг устгах уу? Та энэ аргаар нэвтрэхээ болино.`,
      )
    ) {
      return;
    }

    try {
      // Pass the identity object directly from getUserIdentities
      const { error } = await supabase.auth.unlinkIdentity(identity as never);

      if (error) {
        console.error("[LinkedAccounts] unlinkIdentity:", error);
        setFeedback({
          tone: "error",
          message: `${providerName} холболтыг устгахад алдаа гарлаа: ${error.message}`,
        });
        return;
      }

      setFeedback({
        tone: "success",
        message: `${providerName} холболт устгагдлаа.`,
      });
      await refreshIdentities();
    } catch (err) {
      console.error("[LinkedAccounts] unlink error:", err);
      setFeedback({
        tone: "error",
        message: "Устгах үед алдаа гарлаа.",
      });
    }
  }

  // Available providers that aren't already linked
  const linkedProviders = new Set(identities.map((i) => i.provider));
  const availableProviders = ["google", "apple"].filter(
    (p) => !linkedProviders.has(p),
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        Ачаалж байна…
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-medium text-foreground">
          Холбогдсон нэвтрэх аргууд
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Таны бүртгэлтэй холбогдсон нэвтрэх аргууд. Нэмэх эсвэл устгах
          боломжтой.
        </p>
      </div>

      {/* Linked identities */}
      <div className="space-y-2">
        {identities.map((identity) => (
          <div
            key={identity.identity_id}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {PROVIDER_ICONS[identity.provider] ?? "🔐"}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {PROVIDER_LABELS[identity.provider] ?? identity.provider}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(identity.last_sign_in_at).toLocaleDateString(
                    "mn-MN",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>

            {identities.length > 1 && (
              <button
                type="button"
                onClick={() => handleUnlink(identity)}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors"
              >
                Устгах
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new provider */}
      {availableProviders.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Шинэ нэвтрэх арга нэмэх:
          </p>
          <div className="flex gap-2">
            {availableProviders.map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleLink(provider)}
                disabled={linkingProvider === provider}
                className="active-scale flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{PROVIDER_ICONS[provider]}</span>
                <span>{PROVIDER_LABELS[provider]}</span>
                {linkingProvider === provider && (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`animate-slide-up rounded-lg px-3 py-2 text-sm ${
            feedback.tone === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </section>
  );
}
