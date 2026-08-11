import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import EstimateDetailPage from "../page";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useEstimateDetail: vi.fn(),
  updateStatusMutate: vi.fn(),
  convertMutate: vi.fn(),
  updateEstimateMutateAsync: vi.fn().mockResolvedValue({ id: "est-1" }),
  duplicateMutateAsync: vi.fn().mockResolvedValue({ id: "est-99" }),
  sendMutateAsync: vi.fn().mockResolvedValue(undefined),
  push: vi.fn(),
  back: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  reportServerError: vi.fn(),
  isFirstLoad: true,
  useUpdateEstimateStatus: vi.fn(),
  useConvertEstimate: vi.fn(),
  useUpdateEstimate: vi.fn(),
  useDuplicateEstimate: vi.fn(),
  useSendEstimate: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "est-1" }),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: mocks.push, back: mocks.back }),
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: React.ReactNode;
  }) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-is-first-load", () => ({
  useIsFirstLoad: () => mocks.isFirstLoad,
}));

vi.mock("@/lib/queries/use-estimates", () => ({
  useEstimateDetail: mocks.useEstimateDetail,
  useUpdateEstimateStatus: mocks.useUpdateEstimateStatus,
  useConvertEstimate: mocks.useConvertEstimate,
  useUpdateEstimate: mocks.useUpdateEstimate,
  useDuplicateEstimate: mocks.useDuplicateEstimate,
  useSendEstimate: mocks.useSendEstimate,
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" }, isPending: false }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));

// ── Fixtures ────────────────────────────────────────────────────────

const baseEstimate = {
  id: "est-1",
  estimate_number: "EST-2026-001",
  status: "draft",
  created_at: "2026-07-01T00:00:00.000Z",
  valid_until: "2026-08-01T00:00:00.000Z",
  notes: "Signed off by manager",
  terms: "50% upfront",
  public_token: "pub-tok-1",
  subtotal: 50000,
  discount_total: 5000,
  tax_total: 4500,
  grand_total: 49500,
  discount_amount: 0,
  discount_percentage: 0,
  customer: {
    id: "cust-1",
    first_name: "Bold",
    last_name: "Bat",
    phone: "+97699112233",
    email: "bold@example.com",
  },
  customer_id: "cust-1",
  vehicle: {
    id: "veh-1",
    plate_number: "1234УБА",
    year: 2018,
    make: "Toyota",
    model: "Prius",
  },
  vehicle_id: "veh-1",
  branch_id: null,
  converted_work_order: null,
  items: [
    {
      id: "item-1",
      item_type: "service",
      source_service_id: "sc-1",
      source_part_id: null,
      description: "Oil Change",
      quantity: 1,
      unit_price: 50000,
      discount_amount: 0,
      discount_percentage: 0,
      line_total: 50000,
    },
  ],
};

function setEstimate(data: unknown | null, isPending = false) {
  mocks.useEstimateDetail.mockReturnValue({ data, isPending });
}

function setupMutationDefaults() {
  mocks.useUpdateEstimateStatus.mockReturnValue({
    mutate: mocks.updateStatusMutate,
    isPending: false,
  });
  mocks.useConvertEstimate.mockReturnValue({
    mutate: mocks.convertMutate,
    data: undefined,
    isPending: false,
  });
  mocks.useUpdateEstimate.mockReturnValue({
    mutateAsync: mocks.updateEstimateMutateAsync,
    isPending: false,
  });
  mocks.useDuplicateEstimate.mockReturnValue({
    mutateAsync: mocks.duplicateMutateAsync,
    isPending: false,
  });
  mocks.useSendEstimate.mockReturnValue({
    mutateAsync: mocks.sendMutateAsync,
    isPending: false,
  });
}

// ── Tests ───────────────────────────────────────────────────────────

describe("EstimateDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isFirstLoad = false;
    setupMutationDefaults();
    setEstimate(baseEstimate);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows skeletons on the first load while the estimate is pending", () => {
    mocks.isFirstLoad = true;
    setEstimate(undefined, true);
    render(<EstimateDetailPage />);

    expect(screen.queryByText("EST-2026-001")).not.toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("shows the not-found state when the estimate is missing", () => {
    setEstimate(undefined, false);
    render(<EstimateDetailPage />);
    expect(screen.getByText("notFound")).toBeInTheDocument();
  });

  it("renders header, customer, vehicle, line items and summary", async () => {
    render(<EstimateDetailPage />);

    expect(await screen.findByText("EST-2026-001")).toBeInTheDocument();
    expect(screen.getByText("status_draft")).toBeInTheDocument();
    // customer + vehicle cards
    expect(screen.getAllByText("Bold Bat").length).toBeGreaterThan(0);
    expect(screen.getByText("+97699112233")).toBeInTheDocument();
    expect(screen.getByText("bold@example.com")).toBeInTheDocument();
    expect(screen.getByText("1234УБА")).toBeInTheDocument();
    // line item
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    // summary totals: subtotal 50,000 and grand total 49,500
    expect(screen.getAllByText(/₮ 50,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₮ 49,500/).length).toBeGreaterThan(0);
    // notes/terms details
    expect(screen.getByText("Signed off by manager")).toBeInTheDocument();
    expect(screen.getByText("50% upfront")).toBeInTheDocument();
  });

  it("sends a draft estimate to the customer", async () => {
    const user = userEvent.setup();
    render(<EstimateDetailPage />);
    await screen.findByText("EST-2026-001");

    await user.click(screen.getByText("sendToCustomer"));
    expect(mocks.sendMutateAsync).toHaveBeenCalledWith({ id: "est-1" });
  });

  it("approves a draft estimate via the status mutation", async () => {
    const user = userEvent.setup();
    render(<EstimateDetailPage />);
    await screen.findByText("EST-2026-001");

    await user.click(screen.getByText("approve"));
    expect(mocks.updateStatusMutate).toHaveBeenCalledWith({
      estimateId: "est-1",
      status: "approved",
    });
  });

  it("duplicates the estimate and navigates to the new one", async () => {
    const user = userEvent.setup();
    render(<EstimateDetailPage />);
    await screen.findByText("EST-2026-001");

    await user.click(screen.getByText("duplicate"));
    expect(mocks.duplicateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: "cust-1",
        vehicle_id: "veh-1",
        status: "draft",
        discount_amount: 0,
        tax_total: 4500,
        items: [
          expect.objectContaining({
            item_type: "service",
            source_service_id: "sc-1",
            description: "Oil Change",
            sort_order: 0,
          }),
        ],
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/dashboard/estimates/est-99");
  });

  it("copies the public link and toasts success", async () => {
    const user = userEvent.setup();
    const writeSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    render(<EstimateDetailPage />);
    await screen.findByText("EST-2026-001");

    await user.click(screen.getByText("share"));
    expect(writeSpy).toHaveBeenCalledWith(
      `${window.location.origin}/estimate/pub-tok-1`,
    );
    expect(mocks.toast.success).toHaveBeenCalledWith("linkCopied");
    writeSpy.mockRestore();
  });

  it("saves edited line items through the update mutation", async () => {
    const user = userEvent.setup();
    render(<EstimateDetailPage />);
    await screen.findByText("EST-2026-001");

    await user.click(screen.getByText("edit"));
    const descriptionInput = screen.getByDisplayValue("Oil Change");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Oil Change + filter");
    await user.click(screen.getByText("saveChanges"));

    expect(mocks.updateEstimateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "est-1",
        notes: "Signed off by manager",
        items: [
          expect.objectContaining({
            description: "Oil Change + filter",
            quantity: 1,
            unit_price: 50000,
            sort_order: 0,
          }),
        ],
      }),
    );
  });

  it("shows approve and decline actions for sent estimates", async () => {
    const user = userEvent.setup();
    setEstimate({ ...baseEstimate, status: "sent" });
    render(<EstimateDetailPage />);
    await screen.findByText("EST-2026-001");

    await user.click(screen.getByText("decline"));
    expect(mocks.updateStatusMutate).toHaveBeenCalledWith({
      estimateId: "est-1",
      status: "declined",
    });
  });

  it("converts an approved estimate into a work order", async () => {
    const user = userEvent.setup();
    setEstimate({ ...baseEstimate, status: "approved" });
    render(<EstimateDetailPage />);
    await screen.findByText("EST-2026-001");

    await user.click(screen.getByText("convertToWorkOrder"));
    await user.click(screen.getByText("createWorkOrder"));
    expect(mocks.convertMutate).toHaveBeenCalledWith({ estimateId: "est-1" });
  });

  it("navigates to the work order when conversion data arrives", async () => {
    let convertData: { id: string } | undefined;
    mocks.useConvertEstimate.mockReturnValue({
      mutate: mocks.convertMutate,
      data: convertData,
      isPending: false,
    });
    const { rerender } = render(<EstimateDetailPage />);
    await screen.findByText("EST-2026-001");
    expect(mocks.push).not.toHaveBeenCalled();

    convertData = { id: "wo-9" };
    mocks.useConvertEstimate.mockReturnValue({
      mutate: mocks.convertMutate,
      data: convertData,
      isPending: false,
    });
    rerender(<EstimateDetailPage />);
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/dashboard/work-orders/wo-9"),
    );
  });
});
