import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import { render } from "@/test/test-utils";
import ImportCustomersPage from "../page";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useCurrentOrg: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  fetchMock: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: mocks.useCurrentOrg,
}));

vi.mock("@/hooks/use-is-first-load", () => ({
  useIsFirstLoad: () => false,
}));

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));

// ── Fixtures ────────────────────────────────────────────────────────

const CSV = [
  "firstName,lastName,phone,email",
  "Bat,Erdene,99112233,bat@example.com",
  "Sarantuya,Bold,88112233,sara@example.com",
].join("\n");

function csvFile(name = "customers.csv", content = CSV) {
  return new File([content], name, { type: "text/csv" });
}

function okImport(
  imported: number,
  errors: { row: number; message: string }[] = [],
) {
  return {
    ok: true,
    json: async () => ({ data: { imported, errors } }),
  };
}

function errorImport(message: string) {
  return {
    ok: false,
    json: async () => ({ error: { message } }),
  };
}

async function uploadCsv(content = CSV) {
  const input = document.querySelector("#csv-file-input") as HTMLInputElement;
  fireEvent.change(input, {
    target: { files: [csvFile("customers.csv", content)] },
  });
  await waitFor(() =>
    expect(screen.getByText("customers.csv")).toBeInTheDocument(),
  );
}

// ── Tests ───────────────────────────────────────────────────────────

describe("ImportCustomersPage", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useCurrentOrg.mockReturnValue({
      data: { orgId: "org-1", orgName: "Org 1" },
      isPending: false,
      error: null,
    });
    fetchMock = vi.fn().mockResolvedValue(okImport(2));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the upload card and template download in the idle state", () => {
    render(<ImportCustomersPage />);
    expect(screen.getByText("Import Customers")).toBeInTheDocument();
    expect(screen.getByText("Upload CSV File")).toBeInTheDocument();
    expect(screen.getByText("import.downloadTemplate")).toBeInTheDocument();
  });

  it("previews a parsed CSV before importing", async () => {
    render(<ImportCustomersPage />);
    await uploadCsv();

    expect(screen.getByText("customers.csv")).toBeInTheDocument();
    expect(screen.getByText(/2 rows found/)).toBeInTheDocument();
    expect(screen.getByText("firstName")).toBeInTheDocument();
    expect(screen.getByText("Bat")).toBeInTheDocument();
    expect(screen.getByText("99112233")).toBeInTheDocument();
    expect(screen.getByText(/Import 2 Customers/)).toBeInTheDocument();
  });

  it("only shows the first 5 rows of a larger file in the preview", async () => {
    const lines = ["firstName,lastName,phone"];
    for (let i = 1; i <= 10; i++) {
      lines.push(`User${i},Last${i},99${i}`);
    }
    render(<ImportCustomersPage />);
    await uploadCsv(lines.join("\n"));

    expect(screen.getByText(/10 rows found/)).toBeInTheDocument();
    expect(screen.getByText("User1")).toBeInTheDocument();
    expect(screen.queryByText("User6")).not.toBeInTheDocument();
  });

  it("imports the file via POST FormData and shows the done state", async () => {
    render(<ImportCustomersPage />);
    await uploadCsv();

    await userEvent.click(screen.getByText(/Import 2 Customers/));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/organizations/org-1/customers/import");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);

    await waitFor(() =>
      expect(
        screen.getByText("Successfully imported 2 customers"),
      ).toBeInTheDocument(),
    );
    expect(mocks.toast.success).toHaveBeenCalledWith("import.success");
    expect(screen.getByText("import.importAnother")).toBeInTheDocument();
  });

  it("lists row errors after a partially successful import", async () => {
    fetchMock.mockResolvedValue(
      okImport(1, [{ row: 2, message: "bad phone number" }]),
    );
    render(<ImportCustomersPage />);
    await uploadCsv();

    await userEvent.click(screen.getByText(/Import 2 Customers/));

    await waitFor(() =>
      expect(
        screen.getByText("Successfully imported 1 customer"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("1 error")).toBeInTheDocument();
    expect(screen.getByText("bad phone number")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows the error state and allows retrying from scratch", async () => {
    fetchMock.mockResolvedValue(errorImport("CSV malformed"));
    render(<ImportCustomersPage />);
    await uploadCsv();

    await userEvent.click(screen.getByText(/Import 2 Customers/));

    await waitFor(() =>
      expect(screen.getByText("CSV malformed")).toBeInTheDocument(),
    );
    expect(mocks.toast.error).toHaveBeenCalledWith("import.failed");

    await userEvent.click(screen.getByText("import.tryAgain"));
    expect(screen.getByText("Upload CSV File")).toBeInTheDocument();
  });

  it("rejects non-CSV files with a toast", async () => {
    render(<ImportCustomersPage />);
    const input = document.querySelector("#csv-file-input") as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [csvFile("data.txt", CSV)] },
    });

    expect(mocks.toast.error).toHaveBeenCalledWith("import.onlyCsv");
    expect(screen.queryByText("customers.csv")).not.toBeInTheDocument();
  });

  it("rejects empty files with a toast", async () => {
    render(<ImportCustomersPage />);
    const input = document.querySelector("#csv-file-input") as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [csvFile("empty.csv", "   \n  ")] },
    });

    await waitFor(() =>
      expect(mocks.toast.error).toHaveBeenCalledWith("import.csvEmpty"),
    );
  });

  it("resets to idle after importing another batch", async () => {
    render(<ImportCustomersPage />);
    await uploadCsv();
    await userEvent.click(screen.getByText(/Import 2 Customers/));
    await waitFor(() =>
      expect(screen.getByText("import.importAnother")).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByText("import.importAnother"));
    expect(screen.getByText("Upload CSV File")).toBeInTheDocument();
    expect(screen.queryByText("customers.csv")).not.toBeInTheDocument();
  });

  it("downloads the CSV template", async () => {
    const createObjectUrl = vi.fn(() => "blob:mock");
    const revokeObjectUrl = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    });
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<ImportCustomersPage />);
    fireEvent.click(screen.getByText("import.downloadTemplate"));

    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("customer-import-template.csv");
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:mock");
  });

  it("shows the org error card when the org query fails", () => {
    mocks.useCurrentOrg.mockReturnValue({
      data: null,
      isPending: false,
      error: new Error("no org access"),
    });
    render(<ImportCustomersPage />);
    expect(screen.getByText("no org access")).toBeInTheDocument();
  });
});
