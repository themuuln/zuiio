"use client";

import { useUiStore, type WorkspaceTab } from "@/store/uiStore";

const NAV_ITEMS: Array<{ id: WorkspaceTab; label: string; icon: string }> = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "contacts", label: "Contacts", icon: "◯" },
  { id: "automation", label: "Automation", icon: "◇" },
  { id: "inbox", label: "Inbox", icon: "✉" },
  { id: "broadcasts", label: "Broadcasts", icon: "➤" },
  { id: "settings", label: "Settings", icon: "⚙" },
] as const;

export function Sidebar() {
  const activeTab = useUiStore((s) => s.activeTab);
  const setActiveTab = useUiStore((s) => s.setActiveTab);

  return (
    <aside className="h-full w-[84px] min-w-[84px] border-r border-border/80 bg-linear-to-b from-rail to-[#061224] flex flex-col max-lg:h-[88px] max-lg:w-full max-lg:min-w-0 max-lg:flex-row max-lg:items-center max-lg:border-r-0 max-lg:border-b max-lg:border-border/80 max-lg:overflow-x-auto">
      <div className="px-2.5 py-3.5 border-b border-border/70 max-lg:border-b-0 max-lg:border-r max-lg:border-border/70 text-center max-lg:min-w-[84px]">
        <div className="mx-auto mb-1.5 w-9 h-9 rounded-xl border border-border/70 bg-surface/80 shadow-[0_10px_24px_-14px_rgba(14,165,233,0.6)] flex items-center justify-center">
          <h1 className="text-base font-bold m-0 tracking-tight">ZB</h1>
        </div>
        <span className="text-[9px] text-text-muted uppercase tracking-[0.18em]">Studio</span>
      </div>

      <div className="px-1.5 py-2.5 flex flex-col gap-1 max-lg:flex-row max-lg:py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={[
              "group relative w-full max-lg:w-[74px] rounded-xl py-2 px-1 flex flex-col items-center justify-center gap-1 cursor-pointer border text-[10px] tracking-wide transition-all duration-200",
              item.id === activeTab
                ? "bg-accent/18 border-accent/45 text-text shadow-[0_10px_22px_-12px_rgba(14,165,233,0.85)]"
                : "border-transparent text-text-muted hover:text-text hover:bg-surface/70 hover:border-border/60",
            ].join(" ")}
            type="button"
            onClick={() => setActiveTab(item.id)}
          >
            {item.id === activeTab ? <span className="absolute left-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-accent" /> : null}
            <span
              className={[
                "w-6 h-6 rounded-lg border flex items-center justify-center text-[13px] leading-none transition-colors",
                item.id === activeTab
                  ? "border-accent/50 bg-accent/20 text-text"
                  : "border-border/70 bg-surface/40 text-text-muted group-hover:text-text group-hover:border-border",
              ].join(" ")}
            >
              {item.icon}
            </span>
            <span className="leading-none text-[9.5px]">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto px-1.5 py-2.5 border-t border-border/70 max-lg:border-t-0 max-lg:border-l max-lg:border-border/70 max-lg:ml-auto">
        <div className="rounded-xl border border-border/80 bg-surface/65 p-1.5 text-center">
          <p className="m-0 text-[10px] text-text-muted uppercase tracking-[0.12em]">Usage</p>
          <p className="m-0 text-[10px] font-semibold text-text">1088 / 1000</p>
        </div>
      </div>
    </aside>
  );
}
