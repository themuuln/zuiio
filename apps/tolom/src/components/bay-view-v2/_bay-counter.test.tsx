import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BayCounter } from "./_bay-counter";

interface BayCounterHarnessProps {
  applyBayCountChange: (value: number) => Promise<void>;
}

function BayCounterHarness({ applyBayCountChange }: BayCounterHarnessProps) {
  const [bayCountInputValue, setBayCountInputValue] = useState<number | string>(
    10,
  );
  const bayCountMutationInFlightRef = useRef(false);

  return (
    <BayCounter
      bayCount={10}
      bayCountInputValue={bayCountInputValue}
      setBayCountInputValue={setBayCountInputValue}
      bayCountPending={false}
      applyBayCountChange={applyBayCountChange}
      bayCountMutationInFlightRef={bayCountMutationInFlightRef}
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
});
