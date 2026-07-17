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

interface MergeResult {
  merge_id: string;
  status: string;
  products_merged: string[];
  conflict_count: number;
  [key: string]: unknown;
}

interface Feedback {
  tone: "error" | "success" | "warning";
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

export function MergeAccountsManager() {
  const [supabase] = useState(createBrowserSupabaseClient);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [mergingFrom, setMergingFrom] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);

  const refreshIdentities = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) {
        console.error("[MergeAccounts] getUserIdentities:", error);
        return;
      }
      // getUserIdentities returns { identities: UserIdentity[] }
      setIdentities((data?.identities as Identity[]) ?? []);
    } catch (err) {
      console.error("[MergeAccounts] Unexpected:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refreshIdentities();
  }, [refreshIdentities]);

  async function handleMerge(sourceUserId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFeedback({
        tone: "error",
        message: "Нэвтрээгүй байна.",
      });
      return;
    }

    // Confirm before merging
    if (
      !window.confirm(
        "Энэ үйлдэл нь хоёр бүртгэлийн мэдээллийг нэгтгэнэ. Үргэлжлүүлэх үү?",
      )
    ) {
      return;
    }

    setMergingFrom(sourceUserId);
    setFeedback(null);

    try {
      // Call the merge function via RPC
      const { data, error } = await supabase.rpc("execute_account_merge", {
        p_source_user_id: sourceUserId,
        p_target_user_id: user.id,
        p_products: ["zer", "tolom"],
        p_delete_source: false,
      });

      if (error) {
        console.error("[MergeAccounts] merge error:", error);
        setFeedback({
          tone: "error",
          message: `Нэгтгэхэд алдаа гарлаа: ${error.message}`,
        });
        return;
      }

      const result = data as MergeResult;
      setMergeResult(result);

      if (result.conflict_count > 0) {
        setFeedback({
          tone: "warning",
          message: `${result.conflict_count} мөр зөрчилтэй байна. Зөрчилтэй мэдээллийг хадгалсан бүртгэл хадгалагдлаа.`,
        });
      } else {
        setFeedback({
          tone: "success",
          message: "Бүртгэлүүд амжилттай нэгтгэгдлээ!",
        });
      }

      await refreshIdentities();
    } catch (err) {
      console.error("[MergeAccounts] Unexpected:", err);
      setFeedback({
        tone: "error",
        message: "Нэгтгэх үед алдаа гарлаа.",
      });
    } finally {
      setMergingFrom(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        Ачаалж байна…
      </div>
    );
  }

  // Only show if user has multiple identities from different providers
  const hasMultipleProviders =
    new Set(identities.map((i) => i.provider)).size > 1;

  if (!hasMultipleProviders) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-medium text-foreground">
          Бүртгэл нэгтгэх
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Таны холбогдсон нэвтрэх аргууд өөр өөр бүртгэлтэй байж магадгүй.
          Нэгтгэх боломжтой.
        </p>
      </div>

      {/* Identity list with merge buttons */}
      <div className="space-y-2">
        {identities.map((identity) => (
          <div
            key={identity.identity_id}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
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
                onClick={() => handleMerge(identity.user_id)}
                disabled={mergingFrom === identity.user_id}
                className="text-xs text-primary hover:text-primary/80 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mergingFrom === identity.user_id
                  ? "Нэгтгэж байна…"
                  : "Нэгтгэх"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Merge result */}
      {mergeResult && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <h3 className="text-sm font-medium text-foreground mb-2">
            Нэгтгэх үр дүн
          </h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Бүтээгдэхүүд: {mergeResult.products_merged.join(", ")}</p>
            <p>Зөрчил: {mergeResult.conflict_count}</p>
            <p>
              Төлөв:{" "}
              <span className="text-foreground">{mergeResult.status}</span>
            </p>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`animate-slide-up rounded-lg px-3 py-2 text-sm ${
            feedback.tone === "error"
              ? "bg-destructive/10 text-destructive"
              : feedback.tone === "warning"
                ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                : "bg-primary/10 text-primary"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </section>
  );
}
