import type { Node, Edge } from "@xyflow/react";

export type FlowNodeType =
  | "start"
  | "sendMessage"
  | "askQuestion"
  | "condition"
  | "setField"
  | "delay"
  | "action"
  | "cardCarousel";

export interface StartData extends Record<string, unknown> {
  label: string;
  trigger: "default" | "keyword" | "button" | "ref";
  keywords?: string[];
}

export interface SendMessageData extends Record<string, unknown> {
  label: string;
  message: string;
  buttons: Button[];
  stats?: NodeStats;
}

export interface AskQuestionData extends Record<string, unknown> {
  label: string;
  question: string;
  saveToField: string;
  buttons: Button[];
  stats?: NodeStats;
}

export interface ConditionData extends Record<string, unknown> {
  label: string;
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "exists";
  value: string;
}

export interface SetFieldData extends Record<string, unknown> {
  label: string;
  field: string;
  value: string;
}

export interface DelayData extends Record<string, unknown> {
  label: string;
  duration: number;
  unit: "seconds" | "minutes" | "hours";
}

export interface ActionData extends Record<string, unknown> {
  label: string;
  actionType: "tag" | "subscribe" | "unsubscribe" | "notify" | "webhook";
  value: string;
}

export interface Button {
  id: string;
  text: string;
  actionType?:
    | "messenger"
    | "aiStep"
    | "openWebsite"
    | "callNumber"
    | "performAction"
    | "condition"
    | "randomizer"
    | "smartDelay"
    | "startAutomation"
    | "selectStep";
  actionValue?: string;
}

export interface CardButton {
  id: string;
  text: string;
  type: "postback" | "url";
  value: string;
}

export interface Card {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttons: CardButton[];
}

export interface CardCarouselData extends Record<string, unknown> {
  label: string;
  cards: Card[];
  stats?: NodeStats;
}

export interface NodeStats {
  sent: number;
  deliveredRate: number;
  openedRate: number;
  clickedRate: number;
}

export type FlowNodeData =
  | StartData
  | SendMessageData
  | AskQuestionData
  | ConditionData
  | SetFieldData
  | DelayData
  | ActionData
  | CardCarouselData;

export type FlowNode = Node<FlowNodeData, FlowNodeType>;
export type FlowEdge = Edge;

export interface NodeTemplate {
  type: FlowNodeType;
  label: string;
  icon: string;
  color: string;
  defaultData: FlowNodeData;
}
