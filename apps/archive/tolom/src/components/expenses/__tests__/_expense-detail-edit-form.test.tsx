import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { render } from "@/test/test-utils";
import { ExpenseDetailEditForm } from "../_expense-detail-edit-form";
import {
  type ExpenseFormValues,
  expenseSchema,
} from "../_expense-detail-utils";

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

const CATEGORIES = [{ id: "cat-1", name: "Fuel" }];

function Harness({ initial }: { initial: ExpenseFormValues }) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initial,
  });
  const [saved, setSaved] = useState<ExpenseFormValues | null>(null);
  return (
    <div>
      <ExpenseDetailEditForm
        form={form}
        categories={CATEGORIES}
        handleSave={() => setSaved(form.getValues())}
      />
      <button type="submit" form="expense-detail-form">
        Save
      </button>
      {saved && <div data-testid="saved">{JSON.stringify(saved)}</div>}
    </div>
  );
}

function selectPopupItem(text: string) {
  const item = screen.getByText(text);
  fireEvent.pointerDown(item, { pointerType: "mouse" });
  fireEvent.click(item);
}

const INITIAL: ExpenseFormValues = {
  description: "Diesel refill",
  amount: "120000",
  taxAmount: "0",
  expenseDate: "2026-08-01",
  dueDate: "2026-09-01",
  categoryId: "cat-1",
  vendorName: "Fuel Station",
  paymentMethod: "cash",
  referenceNumber: "INV-123",
  paid: true,
  notes: "Office van",
};

describe("ExpenseDetailEditForm", () => {
  it("renders every field prefilled from the form values", () => {
    render(<Harness initial={INITIAL} />);

    const description =
      document.querySelector<HTMLInputElement>("#eds-description");
    expect(description?.value).toBe("Diesel refill");
    expect(document.querySelector<HTMLInputElement>("#eds-date")?.value).toBe(
      "2026-08-01",
    );
    expect(
      document.querySelector<HTMLInputElement>("#eds-due-date")?.value,
    ).toBe("2026-09-01");
    expect(document.querySelector<HTMLInputElement>("#eds-vendor")?.value).toBe(
      "Fuel Station",
    );
    expect(
      document.querySelector<HTMLInputElement>("#eds-reference")?.value,
    ).toBe("INV-123");
    expect(document.querySelector<HTMLInputElement>("#eds-notes")?.value).toBe(
      "Office van",
    );
    // Currency input shows the formatted amount
    expect(
      document.querySelector<HTMLInputElement>("#eds-amount")?.value,
    ).toMatch(/120,000/);
  });

  it("submits the current form values as the update payload", async () => {
    const user = userEvent.setup();
    render(<Harness initial={INITIAL} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    const saved = JSON.parse(
      screen.getByTestId("saved").textContent ?? "{}",
    ) as ExpenseFormValues;
    expect(saved.description).toBe("Diesel refill");
    expect(saved.amount).toBe("120000");
    expect(saved.expenseDate).toBe("2026-08-01");
    expect(saved.categoryId).toBe("cat-1");
    expect(saved.paymentMethod).toBe("cash");
    expect(saved.paid).toBe(true);
  });

  it("reflects edited fields in the submitted payload", async () => {
    const user = userEvent.setup();
    render(<Harness initial={INITIAL} />);

    const description =
      document.querySelector<HTMLInputElement>("#eds-description");
    if (!description) throw new Error("description input not found");
    fireEvent.change(description, { target: { value: "Premium diesel" } });

    const vendor = document.querySelector<HTMLInputElement>("#eds-vendor");
    if (!vendor) throw new Error("vendor input not found");
    fireEvent.change(vendor, { target: { value: "Premium Fuels LLC" } });

    // Change category through the select popup
    const categoryTrigger = screen.getAllByRole("combobox")[0];
    await user.click(categoryTrigger);
    selectPopupItem("Fuel");

    await user.click(screen.getByRole("button", { name: "Save" }));

    const saved = JSON.parse(
      screen.getByTestId("saved").textContent ?? "{}",
    ) as ExpenseFormValues;
    expect(saved.description).toBe("Premium diesel");
    expect(saved.vendorName).toBe("Premium Fuels LLC");
  });

  it("blocks submit with a validation error when the amount is missing", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ ...INITIAL, amount: "" }} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Amount is required")).toBeInTheDocument();
    expect(screen.queryByTestId("saved")).not.toBeInTheDocument();
  });

  it("lists the available categories in the select popup", async () => {
    const user = userEvent.setup();
    render(<Harness initial={INITIAL} />);

    const categoryTrigger = screen.getAllByRole("combobox")[0];
    await user.click(categoryTrigger);
    expect(screen.getByText("Fuel")).toBeInTheDocument();
  });
});
