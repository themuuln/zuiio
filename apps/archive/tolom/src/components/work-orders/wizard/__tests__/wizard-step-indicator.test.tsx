import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { WizardStepIndicator } from "../wizard-step-indicator";

// ── IntersectionObserver stub ──────────────────────────────────────────
// jsdom has no IntersectionObserver; the indicator drives its active step
// from observer callbacks, so we install a controllable stub.

class IntersectionObserverStub {
  static instances: IntersectionObserverStub[] = [];

  callback: IntersectionObserverCallback;
  elements: Element[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverStub.instances.push(this);
  }

  observe(el: Element) {
    this.elements.push(el);
  }

  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }

  trigger(entries: { target: Element; intersectionRatio: number }[]) {
    this.callback(
      entries as unknown as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

const STEP_KEYS = [
  "customer",
  "vehicle",
  "complaint",
  "services",
  "parts",
  "mechanic",
  "summary",
];

function stepCard(key: string) {
  return document.querySelector(`[data-wizard-step="${key}"]`);
}

function lastObserver() {
  const instances = IntersectionObserverStub.instances;
  return instances[instances.length - 1];
}

function triggerStepVisible(key: string, ratio = 0.8) {
  const el = stepCard(key);
  if (!el) throw new Error(`step card ${key} not found`);
  act(() => {
    lastObserver().trigger([{ target: el, intersectionRatio: ratio }]);
  });
}

function buttonForStep(key: string): HTMLButtonElement {
  const button = screen.getByText(`workOrderWizard.${key}`).closest("button");
  if (!button) throw new Error(`button for step ${key} not found`);
  return button;
}

function Harness() {
  return (
    <div>
      <WizardStepIndicator />
      {STEP_KEYS.map((key) => (
        <div key={key} data-wizard-step={key} />
      ))}
    </div>
  );
}

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock("next-intl", () => {
  const NextIntlClientProvider = ({ children }: { children: ReactNode }) => (
    <>{children}</>
  );
  return {
    NextIntlClientProvider,
    useTranslations: () => (key: string) => key,
  };
});

// ── Tests ──────────────────────────────────────────────────────────────

describe("WizardStepIndicator", () => {
  beforeEach(() => {
    IntersectionObserverStub.instances = [];
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a progress nav with all seven step labels", () => {
    render(<Harness />);
    expect(
      screen.getByRole("navigation", {
        name: "Work order creation progress",
      }),
    ).toBeInTheDocument();
    for (const key of STEP_KEYS) {
      expect(screen.getByText(`workOrderWizard.${key}`)).toBeInTheDocument();
    }
  });

  it("marks the first step as active initially", () => {
    render(<Harness />);
    expect(buttonForStep("customer").classList).toContain("bg-primary");
    expect(buttonForStep("services").classList).not.toContain("bg-primary");
  });

  it("marks a later step active when the observer reports it visible", () => {
    render(<Harness />);
    triggerStepVisible("services");
    expect(buttonForStep("services").classList).toContain("bg-primary");
    expect(buttonForStep("customer").classList).not.toContain("bg-primary");
  });

  it("shows checkmarks and filled connectors for past steps", () => {
    render(<Harness />);
    triggerStepVisible("services");

    // customer, vehicle, complaint are past → checkmarks
    const checkmarks = screen.getAllByText("\u2713");
    expect(checkmarks).toHaveLength(3);

    // connector before "vehicle" (a past step) is filled
    const connector = buttonForStep("vehicle").parentElement?.querySelector(
      "div[aria-hidden='true']",
    );
    expect(connector?.classList).toContain("bg-primary");
  });

  it("shows step numbers for active and future steps", () => {
    render(<Harness />);
    triggerStepVisible("services");

    // active step shows its number (4)
    expect(buttonForStep("services").textContent).toContain("4");
    // future steps show their numbers
    expect(buttonForStep("summary").textContent).toContain("7");
  });

  it("ignores observer entries with negligible visibility", () => {
    render(<Harness />);
    triggerStepVisible("parts", 0.05);
    // Active step stays on customer
    expect(buttonForStep("customer").classList).toContain("bg-primary");
  });

  it("scrolls the step card into view when a step is clicked", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(buttonForStep("parts"));
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("does not crash when no step cards are in the document", () => {
    render(<WizardStepIndicator />);
    expect(IntersectionObserverStub.instances).toHaveLength(0);
    expect(
      screen.getByRole("navigation", {
        name: "Work order creation progress",
      }),
    ).toBeInTheDocument();
  });
});
