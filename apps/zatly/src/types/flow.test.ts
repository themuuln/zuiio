import { describe, it, expect } from "vitest";
import type { FlowNodeType, FlowNodeData, Button, AiReplyData, AbTestData, AbTestVariant } from "./flow";

describe("Flow types", () => {
  it("FlowNodeType includes all expected types", () => {
    const types: FlowNodeType[] = [
      "start", "sendMessage", "askQuestion", "condition",
      "setField", "delay", "action", "cardCarousel", "aiReply",
    ];
    expect(types).toHaveLength(9);
  });

  it("Button has required fields", () => {
    const button: Button = { id: "btn1", text: "Click me" };
    expect(button.id).toBe("btn1");
    expect(button.text).toBe("Click me");
  });

  it("AiReplyData has correct default fields", () => {
    const data: AiReplyData = {
      label: "AI Reply",
      systemPrompt: "You are a helpful assistant.",
      model: "deepseek-v4-flash",
      contextSize: 5,
      temperature: 0.7,
    };
    expect(data.label).toBe("AI Reply");
    expect(data.systemPrompt).toBe("You are a helpful assistant.");
    expect(data.model).toBe("deepseek-v4-flash");
    expect(data.contextSize).toBe(5);
    expect(data.temperature).toBe(0.7);
  });

  it("aiReply is a valid FlowNodeType", () => {
    const nodeType: FlowNodeType = "aiReply";
    expect(nodeType).toBe("aiReply");
  });

  it("AiReplyData is assignable to FlowNodeData", () => {
    const data: AiReplyData = {
      label: "AI Reply",
      systemPrompt: "Hello",
      model: "deepseek-v4-flash",
      contextSize: 3,
      temperature: 0.5,
    };
    const nodeData: FlowNodeData = data;
    expect(nodeData).toEqual(data);
  });

  it("AbTestData has correct fields", () => {
    const variant: AbTestVariant = { id: "v1", weight: 70, message: "Variant A" };
    const data: AbTestData = {
      label: "A/B Test",
      variants: [variant],
    };
    expect(data.label).toBe("A/B Test");
    expect(data.variants).toHaveLength(1);
    expect(data.variants[0].id).toBe("v1");
    expect(data.variants[0].weight).toBe(70);
    expect(data.variants[0].message).toBe("Variant A");
  });

  it("abTest is a valid FlowNodeType", () => {
    const nodeType: FlowNodeType = "abTest";
    expect(nodeType).toBe("abTest");
  });

  it("AbTestData is assignable to FlowNodeData", () => {
    const data: AbTestData = {
      label: "A/B Test",
      variants: [
        { id: "v1", weight: 50, message: "Variant A" },
        { id: "v2", weight: 50, message: "Variant B" },
      ],
    };
    const nodeData: FlowNodeData = data;
    expect(nodeData).toEqual(data);
  });

  it("FlowNodeType includes abTest", () => {
    const types: FlowNodeType[] = [
      "start", "sendMessage", "askQuestion", "condition",
      "setField", "delay", "action", "cardCarousel", "aiReply", "abTest",
    ];
    expect(types).toHaveLength(10);
  });
});
