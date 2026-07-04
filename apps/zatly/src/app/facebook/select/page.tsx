"use client";

import { useEffect, useState } from "react";

type PageItem = {
  id: string;
  name: string;
};

export default function FacebookSelectPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selection = params.get("selection");

    if (!selection) {
      setError("Missing selection id.");
      setLoading(false);
      return;
    }

    setSelectionId(selection);

    const loadPages = async () => {
      try {
        const response = await fetch(`/api/facebook/pages?selection=${encodeURIComponent(selection)}`);
        const data = (await response.json()) as { pages?: PageItem[]; error?: string };

        if (!response.ok || !data.pages?.length) {
          setError(data.error || "No pages found or selection expired.");
          return;
        }

        setPages(data.pages);
        setSelectedPageId(data.pages[0].id);
      } catch {
        setError("Could not load pages.");
      } finally {
        setLoading(false);
      }
    };

    void loadPages();
  }, []);

  const connectSelectedPage = async () => {
    if (!selectionId || !selectedPageId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/facebook/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectionId, pageId: selectedPageId }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string; redirectUrl?: string };

      if (!response.ok || !data.success || !data.redirectUrl) {
        setError(data.error || "Could not connect selected page.");
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      setError("Could not connect selected page.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-bg p-6">
      <section className="w-full max-w-[480px] bg-surface border border-border rounded-xl p-5">
        <h1 className="m-0 mb-3 text-xl font-bold">Select Facebook Page</h1>

        {loading ? <p className="text-text-muted">Loading pages...</p> : null}

        {!loading && pages.length > 0 ? (
          <div className="flex flex-col gap-2 my-4">
            {pages.map((page) => (
              <label key={page.id} className="flex items-center gap-2 p-2 px-3 border border-border rounded-lg cursor-pointer hover:bg-surface-2 transition-colors">
                <input
                  type="radio"
                  className="accent-accent"
                  name="facebook-page"
                  value={page.id}
                  checked={selectedPageId === page.id}
                  onChange={() => setSelectedPageId(page.id)}
                />
                <span className="text-text text-sm font-medium">{page.name}</span>
              </label>
            ))}
          </div>
        ) : null}

        {error ? <p className="text-red text-[13px] mt-1.5">{error}</p> : null}

        <div className="mt-4 flex flex-col gap-2">
          <button
            className="inline-block text-center no-underline p-2 px-4 border border-border rounded-md bg-surface-2 text-text text-sm font-semibold cursor-pointer transition-all hover:border-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={connectSelectedPage}
            disabled={loading || saving || !selectedPageId}
          >
            {saving ? "Connecting..." : "Connect Selected Page"}
          </button>
          <a className="inline-block text-center no-underline p-2 px-4 border border-border rounded-md bg-transparent text-text-muted text-sm font-semibold cursor-pointer transition-all hover:border-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60" href="/">
            Cancel
          </a>
        </div>
      </section>
    </main>
  );
}
