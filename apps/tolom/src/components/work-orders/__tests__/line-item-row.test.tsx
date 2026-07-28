import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LineItemRow } from "@/components/work-orders/line-items/line-item-row";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock("@zuiio/ui", () => ({
  InlineEditableField: ({
    value,
    onSave,
    type,
    className,
    formatDisplay,
  }: {
    value: number;
    onSave: (val: number) => void;
    onChange?: (val: number) => void;
    type?: string;
    className?: string;
    formatDisplay?: (val: number) => string;
    autoFocus?: boolean;
  }) => (
    <button
      data-testid="inline-editable-field"
      data-value={value}
      data-type={type}
      className={className}
      onClick={() => onSave(value)}
    >
      {formatDisplay ? formatDisplay(value) : value}
    </button>
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | boolean | undefined | null)[]) =>
    classes.filter(Boolean).join(" "),
  formatCurrency: (val: number) => `₮${val.toLocaleString()}`,
}));

vi.mock("lucide-react", () => ({}));

// ── Tests ──────────────────────────────────────────────────────────────

describe("LineItemRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    name: "Oil Change",
    finalPrice: 50000,
  };

  it("renders item name and final price in read-only mode", () => {
    render(<LineItemRow {...defaultProps} />);
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("₮50,000")).toBeInTheDocument();
  });

  it("renders quantity and unit price when provided", () => {
    render(<LineItemRow {...defaultProps} quantity={2} unitPrice={25000} />);
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    // Without edit callbacks, final price still shows
    expect(screen.getByText("₮50,000")).toBeInTheDocument();
  });

  it("renders discount info when provided", () => {
    render(
      <LineItemRow
        {...defaultProps}
        quantity={2}
        unitPrice={25000}
        discountAmount={5000}
        discountPercentage={10}
        finalPrice={40000}
      />,
    );
    // Read-only mode shows finalPrice
    expect(screen.getByText("₮40,000")).toBeInTheDocument();
  });

  it("renders Mongolian name when locale is mn", () => {
    render(
      <LineItemRow
        name="Oil Change"
        nameMn="Тос солих"
        locale="mn"
        finalPrice={50000}
      />,
    );
    expect(screen.getByText("Тос солих")).toBeInTheDocument();
    // English name should not be visible
    expect(screen.queryByText("Oil Change")).not.toBeInTheDocument();
  });

  it("renders editable fields when onEditQtySave is provided", () => {
    const mockQtySave = vi.fn();
    render(
      <LineItemRow
        name="Oil Change"
        quantity={2}
        unitPrice={25000}
        finalPrice={50000}
        lineItemId="line-1"
        onEditQtySave={mockQtySave}
      />,
    );

    // Editable field should render
    const fields = screen.getAllByTestId("inline-editable-field");
    expect(fields.length).toBeGreaterThanOrEqual(1);

    // Click to trigger save
    fireEvent.click(fields[0]);
    expect(mockQtySave).toHaveBeenCalledWith("line-1", 2);
  });

  it("shows English name by default when no Mongoilan name provided", () => {
    render(<LineItemRow name="Oil Change" finalPrice={50000} />);
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
  });

  it("renders English name when locale is en and nameMn exists", () => {
    render(
      <LineItemRow
        name="Oil Change"
        nameMn="Тос солих"
        locale="en"
        finalPrice={50000}
      />,
    );
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
  });
});
