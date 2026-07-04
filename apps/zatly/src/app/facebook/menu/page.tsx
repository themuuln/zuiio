"use client";

import { useEffect, useState } from "react";

type ItemType = "postback" | "web_url";

type MenuItem = {
  id: string;
  type: ItemType;
  title: string;
  payload: string;
  url: string;
};

type MenuApiResponse = {
  error?: string;
  persistent_menu?: Array<{
    composer_input_disabled?: boolean;
    call_to_actions?: Array<{
      type?: string;
      title?: string;
      payload?: string;
      url?: string;
    }>;
  }>;
};

const DEFAULT_ITEMS: MenuItem[] = [
  { id: "item-1", type: "postback", title: "Main Menu", payload: "MENU_MAIN", url: "" },
  { id: "item-2", type: "postback", title: "Pricing", payload: "MENU_PRICING", url: "" },
  { id: "item-3", type: "web_url", title: "Visit Website", payload: "", url: "https://example.com" },
];

function makeId() {
  return `item-${Math.random().toString(36).slice(2, 10)}`;
}

export default function FacebookMenuPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [composerInputDisabled, setComposerInputDisabled] = useState(false);
  const [items, setItems] = useState<MenuItem[]>(DEFAULT_ITEMS);

  const loadMenu = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/facebook/persistent-menu", { cache: "no-store" });
      const data = (await response.json()) as MenuApiResponse;

      if (!response.ok) {
        setStatus(data.error ?? "Failed to load menu.");
        return;
      }

      const current = data.persistent_menu?.[0];
      if (!current?.call_to_actions?.length) {
        setStatus("No persistent menu found. Fill this form and click Save.");
        return;
      }

      setComposerInputDisabled(Boolean(current.composer_input_disabled));
      const mapped: MenuItem[] = current.call_to_actions.map((entry, index) => ({
        id: `item-${index + 1}`,
        type: entry.type === "web_url" ? "web_url" : "postback",
        title: entry.title ?? "",
        payload: entry.payload ?? "",
        url: entry.url ?? "",
      }));
      setItems(mapped);
      setStatus("Persistent menu loaded.");
    } catch {
      setStatus("Failed to load menu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMenu();
  }, []);

  const updateItem = (id: string, patch: Partial<MenuItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: makeId(),
        type: "postback",
        title: "",
        payload: "",
        url: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const saveMenu = async () => {
    setSaving(true);
    setStatus(null);
    try {
      if (items.length === 0) {
        setStatus("Add at least one menu item.");
        return;
      }

      const callToActions = items.map((item) => {
        if (item.type === "web_url") {
          return {
            type: "web_url",
            title: item.title.trim(),
            url: item.url.trim(),
          };
        }
        return {
          type: "postback",
          title: item.title.trim(),
          payload: item.payload.trim(),
        };
      });

      const hasInvalid = callToActions.some((item) => {
        if (!item.title) {
          return true;
        }
        if (item.type === "web_url") {
          return !item.url;
        }
        return !item.payload;
      });

      if (hasInvalid) {
        setStatus("Each item needs a title and value (payload or URL).");
        return;
      }

      const response = await fetch("/api/facebook/persistent-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          composer_input_disabled: composerInputDisabled,
          call_to_actions: callToActions,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatus(data.error ?? "Failed to save menu.");
        return;
      }

      setStatus("Persistent menu saved.");
    } catch {
      setStatus("Failed to save menu.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMenu = async () => {
    setDeleting(true);
    setStatus(null);
    try {
      const response = await fetch("/api/facebook/persistent-menu", { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(data.error ?? "Failed to remove menu.");
        return;
      }
      setStatus("Persistent menu removed from page.");
    } catch {
      setStatus("Failed to remove menu.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="h-screen overflow-auto bg-bg p-6">
      <section className="w-full max-w-[880px] mx-auto bg-surface border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="m-0 text-xl font-bold">Messenger Persistent Menu</h1>
            <p className="m-0 mt-1 text-sm text-text-muted">
              Configure the menu users see in your Facebook Messenger chat.
            </p>
          </div>
          <a
            href="/"
            className="inline-block text-center no-underline p-2 px-3 border border-border rounded-md bg-transparent text-text-muted text-sm transition-all hover:border-accent hover:bg-accent/10"
          >
            Back to Builder
          </a>
        </div>

        <div className="p-3 border border-border rounded-lg bg-surface-2 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-accent"
              checked={composerInputDisabled}
              onChange={(e) => setComposerInputDisabled(e.target.checked)}
            />
            Disable free text input (show menu-only UX)
          </label>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={item.id} className="p-3 border border-border rounded-lg bg-surface-2">
              <div className="flex items-center justify-between mb-2">
                <strong className="text-sm">Menu Item {index + 1}</strong>
                <button
                  className="p-1 px-2 border border-border rounded-md bg-transparent text-text-muted text-xs transition-all hover:border-accent hover:bg-accent/10"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <label className="text-xs text-text-muted flex flex-col gap-1">
                  Type
                  <select
                    className="p-2 border border-border rounded-md bg-surface text-text text-sm"
                    value={item.type}
                    onChange={(e) =>
                      updateItem(item.id, {
                        type: e.target.value as ItemType,
                        payload: e.target.value === "postback" ? item.payload : "",
                        url: e.target.value === "web_url" ? item.url : "",
                      })
                    }
                  >
                    <option value="postback">Bot Action</option>
                    <option value="web_url">Website Link</option>
                  </select>
                </label>

                <label className="text-xs text-text-muted flex flex-col gap-1 md:col-span-2">
                  Button Title
                  <input
                    className="p-2 border border-border rounded-md bg-surface text-text text-sm"
                    value={item.title}
                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                    placeholder="Example: Pricing"
                  />
                </label>
              </div>

              {item.type === "postback" ? (
                <label className="text-xs text-text-muted flex flex-col gap-1 mt-2">
                  Action Keyword (payload)
                  <input
                    className="p-2 border border-border rounded-md bg-surface text-text text-sm"
                    value={item.payload}
                    onChange={(e) => updateItem(item.id, { payload: e.target.value })}
                    placeholder="Example: MENU_PRICING"
                  />
                </label>
              ) : (
                <label className="text-xs text-text-muted flex flex-col gap-1 mt-2">
                  Website URL
                  <input
                    className="p-2 border border-border rounded-md bg-surface text-text text-sm"
                    value={item.url}
                    onChange={(e) => updateItem(item.id, { url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </label>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3">
          <button
            className="p-2 px-3 border border-border rounded-md bg-surface-2 text-text text-sm transition-all hover:border-accent hover:bg-accent/10"
            onClick={addItem}
          >
            Add Menu Item
          </button>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <button
            className="p-2 px-4 border border-border rounded-md bg-surface-2 text-text text-sm font-semibold transition-all hover:border-accent hover:bg-accent/10 disabled:opacity-60"
            onClick={saveMenu}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : "Save Persistent Menu"}
          </button>
          <button
            className="p-2 px-4 border border-border rounded-md bg-transparent text-text-muted text-sm transition-all hover:border-accent hover:bg-accent/10 disabled:opacity-60"
            onClick={() => void loadMenu()}
            disabled={loading || saving || deleting}
          >
            {loading ? "Loading..." : "Reload from Facebook"}
          </button>
          <button
            className="p-2 px-4 border border-border rounded-md bg-transparent text-red text-sm transition-all hover:border-red/70 hover:bg-red/10 disabled:opacity-60"
            onClick={deleteMenu}
            disabled={deleting || saving}
          >
            {deleting ? "Removing..." : "Delete Menu from Page"}
          </button>
        </div>

        {status ? <div className="mt-3 text-sm text-text-muted">{status}</div> : null}
      </section>
    </main>
  );
}
