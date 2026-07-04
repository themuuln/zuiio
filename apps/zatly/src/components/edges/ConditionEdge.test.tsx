// @vitest-environment jsdom
import { vi, describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ReactFlowProvider, Position } from "@xyflow/react";
import { ConditionEdge } from "./ConditionEdge";

// Mock getSmoothStepPath to return predictable values
vi.mock("@xyflow/react", async () => {
  const actual = await vi.importActual("@xyflow/react");
  return {
    ...actual,
    getSmoothStepPath: vi.fn(() => [
      "M 0 0 L 100 100",
      50,
      50,
    ]),
  };
});

function renderEdge(props: Record<string, unknown> = {}) {
  return render(
    <ReactFlowProvider>
      <svg style={{ width: 500, height: 500 }}>
        <ConditionEdge
          id="test-edge-1"
          sourceX={0}
          sourceY={0}
          targetX={100}
          targetY={100}
          sourcePosition={Position.Bottom}
          targetPosition={Position.Top}
          source="node-1"
          target="node-2"
          sourceHandleId="yes"
          selected={false}
          animated={false}
          {...props}
        />
      </svg>
    </ReactFlowProvider>
  );
}

describe("ConditionEdge", () => {
  it("renders the edge path with correct id", () => {
    const { container } = renderEdge({ sourceHandleId: "yes" });
    const path = container.querySelector("path#test-edge-1");
    expect(path).not.toBeNull();
    expect(path?.getAttribute("d")).toBe("M 0 0 L 100 100");
  });

  it("applies animated-edge-path class when animated is true", () => {
    const { container } = renderEdge({
      sourceHandleId: "yes",
      animated: true,
    });
    const path = container.querySelector("path#test-edge-1");
    expect(path?.getAttribute("class")).toContain("animated-edge-path");
  });

  it("does not show animated class when animated is false", () => {
    const { container } = renderEdge({
      sourceHandleId: "yes",
      animated: false,
    });
    const path = container.querySelector("path#test-edge-1");
    expect(path?.getAttribute("class")).not.toContain("animated-edge-path");
  });
});
