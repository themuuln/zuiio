import { beforeEach, describe, expect, it, vi } from "vitest";
import { zStack } from "./z-stack";

describe("zStack", () => {
  beforeEach(() => {
    zStack._reset();
  });

  describe("push", () => {
    it("returns 1 on first push", () => {
      expect(zStack.push()).toBe(1);
    });

    it("increments on each push", () => {
      expect(zStack.push()).toBe(1);
      expect(zStack.push()).toBe(2);
      expect(zStack.push()).toBe(3);
    });
  });

  describe("pop", () => {
    it("decrements the layer", () => {
      zStack.push();
      zStack.push();
      zStack.pop();
      expect(zStack.top()).toBe(1);
    });

    it("does not go below 0", () => {
      zStack.pop();
      expect(zStack.top()).toBe(0);
    });

    it("can pop more times than pushed", () => {
      zStack.push();
      zStack.pop();
      zStack.pop();
      zStack.pop();
      expect(zStack.top()).toBe(0);
    });
  });

  describe("top", () => {
    it("returns 0 when no layers are pushed", () => {
      expect(zStack.top()).toBe(0);
    });

    it("returns current layer number", () => {
      zStack.push();
      expect(zStack.top()).toBe(1);
      zStack.push();
      expect(zStack.top()).toBe(2);
    });
  });

  describe("toZClass", () => {
    it("returns z-51 for layer 1", () => {
      expect(zStack.toZClass(1)).toBe("z-51");
    });

    it("returns z-60 for layer 10", () => {
      expect(zStack.toZClass(10)).toBe("z-60");
    });

    it("handles layer 0", () => {
      expect(zStack.toZClass(0)).toBe("z-50");
    });
  });

  describe("toZIndex", () => {
    it("returns '51' for layer 1", () => {
      expect(zStack.toZIndex(1)).toBe("51");
    });

    it("returns '60' for layer 10", () => {
      expect(zStack.toZIndex(10)).toBe("60");
    });
  });

  describe("subscribe", () => {
    it("calls callback on push", () => {
      const cb = vi.fn();
      zStack.subscribe(cb);
      zStack.push();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("calls callback on pop", () => {
      const cb = vi.fn();
      zStack.push();
      zStack.subscribe(cb);
      zStack.pop();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("returns unsubscribe function that stops callbacks", () => {
      const cb = vi.fn();
      const unsubscribe = zStack.subscribe(cb);
      unsubscribe();
      zStack.push();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("_reset", () => {
    it("resets to initial state", () => {
      zStack.push();
      zStack.push();
      expect(zStack.top()).toBe(2);
      zStack._reset();
      expect(zStack.top()).toBe(0);
    });
  });
});
