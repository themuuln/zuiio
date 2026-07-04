import type { NodeStats } from "@/types/flow";

export function PreviewStatsNode({ stats }: { stats: NodeStats }) {
  const items = [
    { label: "Sent", value: String(stats.sent) },
    { label: "Delivered", value: `${stats.deliveredRate.toFixed(1)}%` },
    { label: "Opened", value: `${stats.openedRate.toFixed(1)}%` },
    { label: "Clicked", value: `${stats.clickedRate.toFixed(1)}%` },
  ];

  return (
    <div className="mt-1 mb-1.5 grid grid-cols-4 gap-1">
      {items.map((item) => (
        <div key={item.label} className="rounded-md bg-surface-2 border border-border p-1 text-center">
          <div className="text-[11px] leading-none font-semibold text-blue">{item.value}</div>
          <div className="text-[9px] mt-0.5 leading-none text-text-muted">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
