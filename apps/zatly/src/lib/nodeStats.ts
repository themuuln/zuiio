import type { NodeStats } from "@/types/flow";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPreviewStats(nodeId: string, provided?: NodeStats): NodeStats {
  if (provided) {
    return provided;
  }

  const seed = hashString(nodeId);
  const sent = 40 + (seed % 760);
  const deliveredRate = 92 + ((seed % 75) / 10);
  const openedRate = 78 + (((seed >> 3) % 220) / 10);
  const clickedRate = 12 + (((seed >> 6) % 340) / 10);

  return {
    sent,
    deliveredRate: Math.min(deliveredRate, 99.9),
    openedRate: Math.min(openedRate, 99.9),
    clickedRate: Math.min(clickedRate, 89.9),
  };
}
