"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { AbTestData } from "@/types/flow";
import { NodeWrapper } from "./NodeWrapper";
import { getHandleStyle } from "./HandleColors";

const VARIANT_LABELS: Record<string, string> = {
  A: "Variant A: 50% traffic",
  B: "Variant B: 30% traffic",
  C: "Variant C: 20% traffic",
};

export const AbTestNode = memo(function AbTestNode({ data, selected }: NodeProps) {
  const d = data as AbTestData;
  const variants = d.variants ?? [];
  const variantCount = variants.length;

  const weightDistribution = variants
    .map((v, i) => `${v.weight}% ${String.fromCharCode(65 + i)}`)
    .join(" | ");

  return (
    <NodeWrapper
      selected={selected}
      color="linear-gradient(135deg, #ec4899, #f97316)"
      icon="🧪"
      label={d.label}
      footer={
        variantCount > 0 ? (
          <div className="flex">
            {variants.map((v, idx) => {
              const label = String.fromCharCode(65 + idx);
              const leftPct = ((idx + 0.5) / variantCount) * 100;
              const variantLabel = VARIANT_LABELS[label] ?? `Variant ${label}: ${v.weight}% traffic`;
              return (
                <div
                  key={v.id}
                  className="flex-1 text-center py-1 text-[11px] font-bold relative group"
                  style={{
                    color: idx === 0 ? "#ec4899" : idx === 1 ? "#f97316" : `hsl(${idx * 40 + 200}, 70%, 45%)`,
                  }}
                >
                  <span className="relative">
                    {label}
                    {/* Tooltip on hover for variant handles */}
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-[#1a1a2e] text-white text-[10px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      {variantLabel}
                    </span>
                  </span>
                  <Handle
                    type="source"
                    position={Position.Bottom}
                    id={`variant-${idx}`}
                    style={{
                      ...getHandleStyle("success"),
                      left: `${leftPct}%`,
                    }}
                    title={`Variant ${label}: connect to next step`}
                  />
                </div>
              );
            })}
          </div>
        ) : undefined
      }
    >
      <Handle type="target" position={Position.Top} id="in" style={getHandleStyle("standard")} title="Input: connect from previous step" />
      <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
        <span className="font-semibold text-text">{variantCount} variant{variantCount !== 1 ? "s" : ""}</span>
      </div>
      {variantCount > 0 && (
        <div className="flex flex-col gap-0.5">
          <div className="flex h-2 rounded-full overflow-hidden bg-surface-2">
            {variants.map((v, idx) => (
              <div
                key={v.id}
                className="h-full transition-all"
                style={{
                  width: `${v.weight}%`,
                  background: idx === 0
                    ? "#ec4899"
                    : idx === 1
                      ? "#f97316"
                      : `hsl(${idx * 40 + 200}, 70%, 55%)`,
                }}
              />
            ))}
          </div>
          <span className="text-[11px] text-text-muted">{weightDistribution}</span>
        </div>
      )}
    </NodeWrapper>
  );
});
