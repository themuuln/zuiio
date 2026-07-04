import type { FlowNode } from "@/types/flow";

export interface NodeValidation {
  nodeId: string;
  missingFields: string[];
}

export function validateNode(node: FlowNode): NodeValidation | null {
  const missingFields: string[] = [];
  const data = node.data;

  switch (node.type) {
    case "sendMessage": {
      const d = data as Record<string, unknown>;
      if (!d.message || String(d.message).trim() === "") missingFields.push("message");
      break;
    }
    case "askQuestion": {
      const d = data as Record<string, unknown>;
      if (!d.question || String(d.question).trim() === "") missingFields.push("question");
      if (!d.saveToField || String(d.saveToField).trim() === "") missingFields.push("saveToField");
      break;
    }
    case "condition": {
      const d = data as Record<string, unknown>;
      if (!d.field || String(d.field).trim() === "") missingFields.push("field");
      break;
    }
    case "setField": {
      const d = data as Record<string, unknown>;
      if (!d.field || String(d.field).trim() === "") missingFields.push("field");
      if (!d.value || String(d.value).trim() === "") missingFields.push("value");
      break;
    }
    case "action": {
      const d = data as Record<string, unknown>;
      if (!d.actionType || String(d.actionType).trim() === "") missingFields.push("actionType");
      break;
    }
    case "delay": {
      const d = data as Record<string, unknown>;
      if (typeof d.duration !== "number" || d.duration <= 0) missingFields.push("duration");
      break;
    }
    case "cardCarousel": {
      const d = data as Record<string, unknown>;
      const cards = d.cards as Array<Record<string, unknown>> | undefined;
      if (!cards || cards.length === 0) missingFields.push("cards");
      break;
    }
    case "start":
    case "note":
    case "aiReply":
      break;
  }

  return missingFields.length > 0 ? { nodeId: node.id, missingFields } : null;
}

export function validateFlow(nodes: FlowNode[]): NodeValidation[] {
  const results: NodeValidation[] = [];
  for (const node of nodes) {
    if (node.type === "note" || node.type === "start") continue;
    const result = validateNode(node);
    if (result) results.push(result);
  }
  return results;
}
