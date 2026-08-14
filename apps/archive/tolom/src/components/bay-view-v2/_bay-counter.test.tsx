import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { BaySlotData } from "@/lib/services/bay-view-service.types";
import { render } from "@/test/test-utils";
import { BayCounter } from "./_bay-counter";

function makeBays(count: number, occupied: number[] = []): BaySlotData[] {
  return Array.from({ length: count }, (_, i) => ({
    bayNumber: i + 1,
    workOrder: occupied.includes(i + 1)
      ? ({
          id: `wo-${i + 1}`,
          bay_number: i + 1,
          status: "In Progress",
          vehicle: { id: `v-${i + 1}`, plate: `ABC${i + 1}` },
        } as BaySlotData["workOrder"])
      : null,
  }));
}

interface BayCounterHarnessProps {
  applyBayCountChange: (value: number) => Promise<void>;
  bayCount?: number;
  bays?: BaySlotData[];
}

function BayCounterHarness({
  applyBayCountChange,
  bayCount = 10,
  bays,
}: BayCounterHarnessProps) {
  const [bayCountInputValue, setBayCountInputValue] = useState<number | string>(
    bayCount,
  );
  const bayCountMutationInFlightRef = useRef(false);

  return (
    <BayCounter
      bayCount={bayCount}
      bayCountInputValue={bayCountInputValue}
      setBayCountInputValue={setBayCountInputValue}
      bayCountPending={false}
      applyBayCountChange={applyBayCountChange}
      bayCountMutationInFlightRef={bayCountMutationInFlightRef}
      bays={bays ?? makeBays(bayCount)}
      t={() => "Bay count"}
    />
  );
}

describe("BayCounter", () => {
  it("commits the edited bay count value to the save handler exactly once", async () => {
    const applyBayCountChange = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<BayCounterHarness applyBayCountChange={applyBayCountChange} />);

    const input = screen.getByRole("textbox", { name: "Bay count" });

    expect((input as HTMLInputElement).value).toBe("10");

    await user.click(input);
    await user.clear(input);
    await user.type(input, "9");
    await user.tab();

    await waitFor(() => {
      expect(applyBayCountChange).toHaveBeenCalledTimes(1);
    });

    expect(applyBayCountChange).toHaveBeenCalledWith(9);
    expect((input as HTMLInputElement).value).toBe("9");
  });

  it("blocks reduction when occupied bays exist above the target", async () => {
    const applyBayCountChange = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const bays = makeBays(9, [7, 8]);

    render(
      <BayCounterHarness
        applyBayCountChange={applyBayCountChange}
        bayCount={9}
        bays={bays}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Bay count" });

    await user.click(input);
    await user.clear(input);
    await user.type(input, "6");
    await user.tab();

    // Mutation should NOT have been called
    expect(applyBayCountChange).not.toHaveBeenCalled();
    // Input should revert to original value
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe("9");
    });
  });

  it("allows reduction when all bays above target are empty", async () => {
    const applyBayCountChange = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const bays = makeBays(9, [1, 3]); // occupied below target=6, nothing above

    render(
      <BayCounterHarness
        applyBayCountChange={applyBayCountChange}
        bayCount={9}
        bays={bays}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Bay count" });

    await user.click(input);
    await user.clear(input);
    await user.type(input, "6");
    await user.tab();

    await waitFor(() => {
      expect(applyBayCountChange).toHaveBeenCalledTimes(1);
    });

    expect(applyBayCountChange).toHaveBeenCalledWith(6);
  });
});
