import { describe, expect, it, vi } from "vitest";

const { mockReactEmailRender } = vi.hoisted(() => ({
  mockReactEmailRender: vi.fn().mockResolvedValue("<html>Mock</html>"),
}));

vi.mock("react-email", () => ({
  render: mockReactEmailRender,
}));

import { renderEmail, renderEmailText } from "./email";

describe("renderEmail", () => {
  it("calls react-email render with element", async () => {
    const element = <div>test</div>;
    const result = await renderEmail(element);
    expect(mockReactEmailRender).toHaveBeenCalledWith(element);
    expect(result).toBe("<html>Mock</html>");
  });
});

describe("renderEmailText", () => {
  it("calls react-email render with plainText option", async () => {
    const element = <div>test</div>;
    const result = await renderEmailText(element);
    expect(mockReactEmailRender).toHaveBeenCalledWith(element, {
      plainText: true,
    });
    expect(result).toBe("<html>Mock</html>");
  });
});
