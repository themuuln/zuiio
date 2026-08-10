import { describe, expect, it } from "vitest";
import {
  GuardedPointerSensor,
  GuardedTouchSensor,
  type ViewMode,
} from "../_types";

type ActivatorHandler = (args: {
  nativeEvent: { target: EventTarget | null };
}) => boolean;

const pointerActivator = GuardedPointerSensor.activators[0]
  .handler as unknown as ActivatorHandler;
const touchActivator = GuardedTouchSensor.activators[0]
  .handler as unknown as ActivatorHandler;

describe("GuardedPointerSensor", () => {
  it("registers an onPointerDown activator", () => {
    expect(GuardedPointerSensor.activators[0].eventName).toBe("onPointerDown");
  });

  it("allows drag on plain elements", () => {
    const target = document.createElement("div");
    expect(pointerActivator({ nativeEvent: { target } })).toBe(true);
  });

  it("blocks drag on buttons, links, inputs, textareas and selects", () => {
    for (const tag of ["button", "a", "input", "textarea", "select"]) {
      const el = document.createElement(tag);
      expect(pointerActivator({ nativeEvent: { target: el } }), tag).toBe(
        false,
      );
    }
  });

  it("blocks drag on [data-no-dnd] elements", () => {
    const el = document.createElement("div");
    el.setAttribute("data-no-dnd", "true");
    expect(pointerActivator({ nativeEvent: { target: el } })).toBe(false);
  });

  it("blocks drag on descendants of blocked elements", () => {
    const button = document.createElement("button");
    const span = document.createElement("span");
    button.appendChild(span);
    expect(pointerActivator({ nativeEvent: { target: span } })).toBe(false);
  });

  it("allows drag on elements inside a data-no-dnd=false subtree", () => {
    const parent = document.createElement("div");
    parent.setAttribute("data-no-dnd", "false");
    const span = document.createElement("span");
    parent.appendChild(span);
    expect(pointerActivator({ nativeEvent: { target: span } })).toBe(true);
  });

  it("allows drag for non-element targets (guard only blocks HTML elements)", () => {
    expect(pointerActivator({ nativeEvent: { target: null } })).toBe(true);
    expect(
      pointerActivator({ nativeEvent: { target: {} as EventTarget } }),
    ).toBe(true);
  });
});

describe("GuardedTouchSensor", () => {
  it("registers an onTouchStart activator", () => {
    expect(GuardedTouchSensor.activators[0].eventName).toBe("onTouchStart");
  });

  it("follows the same guard rules as the pointer sensor", () => {
    const plain = document.createElement("div");
    expect(touchActivator({ nativeEvent: { target: plain } })).toBe(true);

    const button = document.createElement("button");
    expect(touchActivator({ nativeEvent: { target: button } })).toBe(false);

    const noDnd = document.createElement("div");
    noDnd.setAttribute("data-no-dnd", "true");
    expect(touchActivator({ nativeEvent: { target: noDnd } })).toBe(false);

    expect(touchActivator({ nativeEvent: { target: null } })).toBe(true);
  });
});

describe("ViewMode type", () => {
  it("accepts the three supported view modes", () => {
    const modes: ViewMode[] = ["grid", "kanban", "list"];
    expect(modes).toHaveLength(3);
    expect(modes).toContain("grid");
  });
});
