import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";

function renderProgress(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Progress", () => {
  it("renders with data-slot progress", () => {
    const { $ } = renderProgress(<Progress value={50} />);
    expect($("[data-slot='progress']")).toBeInTheDocument();
  });

  it("renders track with data-slot progress-track", () => {
    const { $ } = renderProgress(<Progress value={50} />);
    expect($("[data-slot='progress-track']")).toBeInTheDocument();
  });

  it("renders indicator with data-slot progress-indicator", () => {
    const { $ } = renderProgress(<Progress value={50} />);
    expect($("[data-slot='progress-indicator']")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderProgress(
      <Progress value={50} className="custom-progress" />,
    );
    expect($("[data-slot='progress']")?.className).toContain("custom-progress");
  });

  it("renders children alongside progress bar", () => {
    render(
      <Progress value={50}>
        <span data-testid="child">Child content</span>
      </Progress>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders with 0% value", () => {
    const { $ } = renderProgress(<Progress value={0} />);
    expect($("[data-slot='progress']")).toBeInTheDocument();
    expect($("[data-slot='progress-indicator']")).toBeInTheDocument();
  });

  it("renders with 100% value", () => {
    const { $ } = renderProgress(<Progress value={100} />);
    expect($("[data-slot='progress']")).toBeInTheDocument();
  });

  it("renders without a value", () => {
    const { $ } = renderProgress(<Progress />);
    expect($("[data-slot='progress']")).toBeInTheDocument();
  });
});

describe("ProgressLabel", () => {
  it("renders with data-slot progress-label inside progress", () => {
    const { $ } = renderProgress(
      <Progress>
        <ProgressLabel>Uploading</ProgressLabel>
      </Progress>,
    );
    expect($("[data-slot='progress-label']")).toBeInTheDocument();
  });

  it("displays the label text", () => {
    render(
      <Progress>
        <ProgressLabel>Uploading...</ProgressLabel>
      </Progress>,
    );
    expect(screen.getByText("Uploading...")).toBeInTheDocument();
  });
});

describe("ProgressValue", () => {
  it("renders with data-slot progress-value inside progress", () => {
    const { $ } = renderProgress(
      <Progress value={50}>
        <ProgressValue>50%</ProgressValue>
      </Progress>,
    );
    expect($("[data-slot='progress-value']")).toBeInTheDocument();
  });

  it("sets aria-valuetext on the progress root", () => {
    const { $ } = renderProgress(
      <Progress value={50}>
        <ProgressValue>50%</ProgressValue>
      </Progress>,
    );
    const root = $("[data-slot='progress']");
    expect(root).toHaveAttribute("aria-valuetext");
  });
});

describe("ProgressTrack", () => {
  it("renders with data-slot progress-track inside progress", () => {
    const { $ } = renderProgress(
      <Progress>
        <ProgressTrack />
      </Progress>,
    );
    expect($("[data-slot='progress-track']")).toBeInTheDocument();
  });
});

describe("ProgressIndicator", () => {
  it("renders with data-slot progress-indicator inside progress", () => {
    const { $ } = renderProgress(
      <Progress>
        <ProgressIndicator />
      </Progress>,
    );
    expect($("[data-slot='progress-indicator']")).toBeInTheDocument();
  });
});
