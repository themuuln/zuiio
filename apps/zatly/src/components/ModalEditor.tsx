"use client";

import { useEffect, useState, useRef } from "react";
import { useFlowStore } from "@/store/flowStore";
import type { ConditionData, AiReplyData } from "@/types/flow";

export function ModalEditor() {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const nodes = useFlowStore((s) => s.nodes);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const selectNode = useFlowStore((s) => s.selectNode);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!selectedNode || !open) return;
    if (inputRef.current) inputRef.current.focus();
  }, [open, selectedNode]);

  const handleOpen = () => {
    if (!selectedNode || (selectedNode.type !== "condition" && selectedNode.type !== "aiReply")) return;
    const d = selectedNode.data as Record<string, unknown>;
    setFormData({
      field: String(d.field ?? ""),
      operator: String(d.operator ?? "equals"),
      value: String(d.value ?? ""),
      systemPrompt: String(d.systemPrompt ?? ""),
      model: String(d.model ?? "deepseek-v4-flash"),
      contextSize: String(d.contextSize ?? "5"),
      temperature: String(d.temperature ?? "0.7"),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (selectedNodeId && selectedNode && (selectedNode.type === "condition" || selectedNode.type === "aiReply")) {
      handleOpen();
    }
  }, [selectedNodeId]);

  if (!open || !selectedNode) return null;

  const save = () => {
    updateNodeData(selectedNode.id, formData as unknown as Partial<ConditionData & AiReplyData>);
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => { save(); setOpen(false); }}
    >
      <div
        className="w-[520px] max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl p-6 animate-[fadeScaleIn_0.12s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="m-0 text-lg font-semibold text-text">
            Edit {selectedNode.type === "condition" ? "Condition" : "AI Reply"}
          </h2>
          <button
            type="button"
            className="h-7 w-7 rounded-lg border border-border text-text-muted text-sm cursor-pointer hover:bg-surface-2 transition-colors flex items-center justify-center"
            onClick={() => { save(); setOpen(false); }}
          >
            ✕
          </button>
        </div>

        {selectedNode.type === "condition" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Field</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-accent"
                value={formData.field ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, field: e.target.value }))}
                placeholder="e.g. name, email, age"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Operator</label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-accent"
                value={formData.operator ?? "equals"}
                onChange={(e) => setFormData((p) => ({ ...p, operator: e.target.value }))}
              >
                <option value="equals">Equals (=)</option>
                <option value="contains">Contains</option>
                <option value="gt">Greater than (&gt;)</option>
                <option value="lt">Less than (&lt;)</option>
                <option value="exists">Exists</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Value</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-accent"
                value={formData.value ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, value: e.target.value }))}
                placeholder="Value to compare against"
              />
            </div>
          </div>
        )}

        {selectedNode.type === "aiReply" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">System Prompt</label>
              <textarea
                ref={inputRef}
                className="w-full h-32 px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-accent resize-y font-sans"
                value={formData.systemPrompt ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, systemPrompt: e.target.value }))}
                placeholder="Describe how the AI should behave..."
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Model</label>
                <input
                  className="w-full h-10 px-3 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-accent"
                  value={formData.model ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Context Size</label>
                <input
                  type="number"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-accent"
                  value={formData.contextSize ?? "5"}
                  onChange={(e) => setFormData((p) => ({ ...p, contextSize: e.target.value }))}
                  min={1}
                  max={50}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-accent"
                  value={formData.temperature ?? "0.7"}
                  onChange={(e) => setFormData((p) => ({ ...p, temperature: e.target.value }))}
                  min={0}
                  max={2}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="h-9 px-4 rounded-lg border border-border text-text-muted text-sm cursor-pointer hover:bg-surface-2 transition-colors"
            onClick={() => { setOpen(false); selectNode(null); }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-9 px-4 rounded-lg border border-accent/60 bg-accent/15 text-text text-sm font-semibold cursor-pointer hover:bg-accent/25 transition-colors"
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
