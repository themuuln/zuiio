import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { DrawerCelebration } from "../_drawer-celebration";

describe("DrawerCelebration", () => {
  it("renders nothing when hidden", () => {
    render(<DrawerCelebration show={false} message="Done" />);
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("renders the message when shown", () => {
    render(<DrawerCelebration show message="Амжилттай" />);
    expect(screen.getByText("Амжилттай")).toBeInTheDocument();
  });
});
