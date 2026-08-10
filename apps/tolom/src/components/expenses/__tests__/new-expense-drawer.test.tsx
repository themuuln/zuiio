import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { NewExpenseDrawer } from "../new-expense-drawer";

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" }, isPending: false }),
}));

vi.mock("@/lib/queries/use-expenses", () => ({
  useExpenseCategories: () => ({ data: [] }),
  useCreateExpense: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("NewExpenseDrawer", () => {
  it("renders the expense form inside the modal when open", () => {
    render(<NewExpenseDrawer open onOpenChange={vi.fn()} />);
    expect(screen.getAllByText("addExpense").length).toBeGreaterThan(0);
    expect(
      screen.getByPlaceholderText("descriptionPlaceholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "addExpense" }),
    ).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(<NewExpenseDrawer open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText("addExpense")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("descriptionPlaceholder"),
    ).not.toBeInTheDocument();
  });
});
