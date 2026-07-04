import type { FlowNodeType, FlowNodeData } from "@/types/flow";
import { nanoid } from "nanoid";

export function getDefaultData(type: FlowNodeType): FlowNodeData {
  switch (type) {
    case "start":
      return { label: "Start", trigger: "default", keywords: [] };
    case "sendMessage":
      return {
        label: "Send Message",
        message: "Hello! How can I help you?",
        buttons: [],
      };
    case "askQuestion":
      return {
        label: "Ask Question",
        question: "What is your name?",
        saveToField: "name",
        buttons: [
          { id: nanoid(6), text: "Option A" },
          { id: nanoid(6), text: "Option B" },
        ],
      };
    case "condition":
      return {
        label: "Condition",
        field: "name",
        operator: "exists",
        value: "",
      };
    case "setField":
      return { label: "Set Field", field: "", value: "" };
    case "delay":
      return { label: "Delay", duration: 1, unit: "minutes" };
    case "action":
      return { label: "Action", actionType: "tag", value: "" };
    case "cardCarousel":
      return {
        label: "Card Carousel",
        cards: [
          {
            id: nanoid(6),
            title: "Card 1",
            subtitle: "Description here",
            imageUrl: "",
            buttons: [
              { id: nanoid(6), text: "Learn More", type: "postback", value: "learn_more" },
            ],
          },
        ],
      };
    default:
      return { label: "Send Message", message: "", buttons: [] } as FlowNodeData;
  }
}

export const NODE_TEMPLATES = [
  {
    type: "sendMessage" as FlowNodeType,
    label: "Send Message",
    icon: "💬",
    color: "#3b82f6",
  },
  {
    type: "askQuestion" as FlowNodeType,
    label: "Ask Question",
    icon: "❓",
    color: "#eab308",
  },
  {
    type: "condition" as FlowNodeType,
    label: "Condition",
    icon: "🔀",
    color: "#a855f7",
  },
  {
    type: "setField" as FlowNodeType,
    label: "Set Field",
    icon: "📝",
    color: "#22c55e",
  },
  {
    type: "delay" as FlowNodeType,
    label: "Delay",
    icon: "⏱",
    color: "#f97316",
  },
  {
    type: "action" as FlowNodeType,
    label: "Action",
    icon: "⚡",
    color: "#ef4444",
  },
  {
    type: "cardCarousel" as FlowNodeType,
    label: "Card Carousel",
    icon: "🎴",
    color: "#ec4899",
  },
];
