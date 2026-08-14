import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { DeviceRegistrationDialog } from "../device-registration-dialog";

const tMock = vi.hoisted(() => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key}[${Object.values(params).join("|")}]` : key,
}));
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => tMock.t,
  };
});

vi.mock("@/components/ui/detail-drawer", () => ({
  DetailDrawer: Object.assign(
    ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? <div data-testid="detail-drawer">{children}</div> : null,
    {
      Header: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-header">{children}</div>
      ),
      Title: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-title">{children}</div>
      ),
      Description: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-description">{children}</div>
      ),
      Body: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-body">{children}</div>
      ),
      Footer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer">{children}</div>
      ),
      FooterActions: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer-actions">{children}</div>
      ),
    },
  ),
}));

const qrToDataURL = vi.fn();
vi.mock("qrcode", () => ({
  default: {
    toDataURL: (...args: unknown[]) => qrToDataURL(...args),
  },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const onOpenChange = vi.fn();

const MECHANICS = [{ id: "m1", full_name: "Bat Erdene" }];

function routeFetch(url: string) {
  if (url.includes("/reports?type=mechanics")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: MECHANICS }),
    });
  }
  if (url.includes("/clock/generate-registration")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { rawToken: "tok-1", sessionId: "sess-1" },
        }),
    });
  }
  if (url.includes("/clock/devices")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: null }),
  });
}

function renderDialog(open = true) {
  return render(
    <DeviceRegistrationDialog
      open={open}
      onOpenChange={onOpenChange}
      orgId="org-1"
    />,
  );
}

async function selectMechanicAndGenerate() {
  await act(async () => {});
  const trigger = screen.getByRole("combobox");
  await act(async () => {
    fireEvent.click(trigger);
  });
  const option = await screen.findByText("Bat Erdene");
  await act(async () => {
    fireEvent.click(option);
  });
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: /deviceRegistration.generateQr/ }),
    );
  });
}

describe("DeviceRegistrationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockImplementation((url: string) => routeFetch(url));
    qrToDataURL.mockResolvedValue("data:image/png;base64,QRCODE");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when closed", () => {
    renderDialog(false);
    expect(screen.queryByTestId("detail-drawer")).not.toBeInTheDocument();
  });

  it("loads mechanics on open and disables generate until one is selected", async () => {
    renderDialog();
    expect(
      screen.getAllByText("deviceRegistration.title").length,
    ).toBeGreaterThanOrEqual(1);

    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/reports?type=mechanics",
    );

    const generate = screen.getByRole("button", {
      name: /deviceRegistration.generateQr/,
    });
    expect(generate).toBeDisabled();
  });

  it("does not call the generate endpoint while the button is disabled", async () => {
    renderDialog();
    await act(async () => {});

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /deviceRegistration.generateQr/ }),
      );
    });

    const generateCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/clock/generate-registration"),
    );
    expect(generateCalls).toHaveLength(0);
    expect(qrToDataURL).not.toHaveBeenCalled();
  });

  it("generates a QR code with the mechanic id and shows the countdown", async () => {
    renderDialog();
    await selectMechanicAndGenerate();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/clock/generate-registration",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ mechanicId: "m1" }),
      }),
    );
    expect(qrToDataURL).toHaveBeenCalledWith(
      JSON.stringify({
        t: "tok-1",
        s: "sess-1",
        a: "register_device",
      }),
      expect.anything(),
    );

    const qrImage = await screen.findByAltText("bayView.registrationQrCode");
    expect(qrImage).toHaveAttribute("src", "data:image/png;base64,QRCODE");
    expect(screen.getByText(/05:00/)).toBeInTheDocument();
    expect(screen.getByText(/Bat Erdene/)).toBeInTheDocument();
  });

  it("shows the error state when generation fails", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/clock/generate-registration")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ error: { message: "Token generation failed" } }),
        });
      }
      return routeFetch(url);
    });

    renderDialog();
    await selectMechanicAndGenerate();

    expect(
      await screen.findByText("Token generation failed"),
    ).toBeInTheDocument();
  });

  it("polls for the registered device and shows success, then auto-closes", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/clock/devices")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  id: "dev-1",
                  mechanicId: "m1",
                  isActive: true,
                },
              ],
            }),
        });
      }
      return routeFetch(url);
    });

    vi.useFakeTimers();
    renderDialog();
    await act(async () => {});
    const trigger = screen.getByRole("combobox");
    await act(async () => {
      fireEvent.click(trigger);
    });
    await act(async () => {});
    const option = screen.getByText("Bat Erdene");
    await act(async () => {
      fireEvent.click(option);
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /deviceRegistration.generateQr/ }),
      );
    });
    await act(async () => {});

    expect(screen.getByText("deviceRegistration.success")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps polling when no device is registered yet", async () => {
    renderDialog();
    await selectMechanicAndGenerate();

    await screen.findByAltText("bayView.registrationQrCode");
    await waitFor(() => {
      const deviceCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes("/clock/devices"),
      );
      expect(deviceCalls.length).toBeGreaterThanOrEqual(1);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/clock/devices?mechanicId=m1",
    );
    expect(
      screen.queryByText("deviceRegistration.success"),
    ).not.toBeInTheDocument();
  });
});
