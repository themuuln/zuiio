import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeviceRegistrationDialog } from "./device-registration-dialog";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockToDataURL = vi.hoisted(() => vi.fn());

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: mockToDataURL,
  },
  toDataURL: mockToDataURL,
}));

const mockMechanics = [
  { id: "mech-1", full_name: "John Doe" },
  { id: "mech-2", full_name: "Jane Smith" },
];

const mockTokenResponse = {
  data: {
    rawToken: "tok_reg_001",
    sessionId: "sess_reg_001",
    expiresAt: "2026-05-31T01:05:00.000Z",
  },
};

const mockDevicesEmpty = { data: [] };

const mockDeviceFound = {
  data: [
    {
      deviceId: "dev_001",
      mechanicId: "mech-1",
      isActive: true,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Open the Select dropdown and pick an option by its visible text.
 * base-ui Select renders options in a portal; we target the role="option" element.
 */
async function selectOption(label: string) {
  const trigger = screen.getByRole("combobox");
  await userEvent.click(trigger);

  // Wait for the popup to appear
  const option = await screen.findByRole("option", { name: label });
  await userEvent.click(option);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("DeviceRegistrationDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    orgId: "org-1",
  };

  it("renders dialog with mechanic selector", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: mockMechanics }), { status: 200 }),
    );

    render(<DeviceRegistrationDialog {...defaultProps} />);

    // Dialog title appears twice (h2 title + sr-only description)
    await waitFor(() => {
      expect(screen.getAllByText("deviceRegistration.title")).toHaveLength(2);
    });

    // Field label and placeholder both render the same key
    await waitFor(() => {
      expect(
        screen.getAllByText("deviceRegistration.selectMechanic").length,
      ).toBeGreaterThanOrEqual(1);
    });

    // Generate QR button (initially disabled because no mechanic selected)
    const generateButton = screen.getByText("deviceRegistration.generateQr");
    expect(generateButton).toBeDefined();
    expect(generateButton).toBeDisabled();

    fetchMock.mockRestore();
  });

  it("generates QR code on button click", async () => {
    const onOpenChange = vi.fn();
    mockToDataURL.mockResolvedValue("data:image/png;base64,fakeqr");

    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = url.toString();

      if (urlStr.includes("reports?type=mechanics")) {
        return new Response(JSON.stringify({ data: mockMechanics }), {
          status: 200,
        });
      }

      if (urlStr.includes("clock/generate-registration")) {
        return new Response(JSON.stringify(mockTokenResponse), {
          status: 200,
        });
      }

      if (urlStr.includes("clock/devices")) {
        return new Response(JSON.stringify(mockDevicesEmpty), {
          status: 200,
        });
      }

      return new Response(JSON.stringify({ data: null }), { status: 200 });
    });

    render(
      <DeviceRegistrationDialog
        {...defaultProps}
        onOpenChange={onOpenChange}
      />,
    );

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getAllByText("deviceRegistration.title")).toHaveLength(2);
    });

    // Select John Doe
    await selectOption("John Doe");

    // Click "Generate QR" button
    const generateButton = screen.getByText("deviceRegistration.generateQr");
    expect(generateButton).not.toBeDisabled();
    await userEvent.click(generateButton);

    // QR code image should appear
    await waitFor(() => {
      const qrImage = document.querySelector('img[alt="Registration QR Code"]');
      expect(qrImage).not.toBeNull();
      expect(qrImage?.getAttribute("src")).toBe("data:image/png;base64,fakeqr");
    });

    // Verify registration fetch call
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("clock/generate-registration"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ mechanicId: "mech-1" }),
      }),
    );

    fetchMock.mockRestore();
  });

  it("shows error alert when registration fetch fails", async () => {
    mockToDataURL.mockResolvedValue("data:image/png;base64,fakeqr");

    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = url.toString();

      if (urlStr.includes("reports?type=mechanics")) {
        return new Response(JSON.stringify({ data: mockMechanics }), {
          status: 200,
        });
      }

      if (urlStr.includes("clock/generate-registration")) {
        return new Response(
          JSON.stringify({
            error: { message: "Failed to generate registration" },
          }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ data: null }), { status: 200 });
    });

    render(<DeviceRegistrationDialog {...defaultProps} />);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getAllByText("deviceRegistration.title")).toHaveLength(2);
    });

    // Select John Doe
    await selectOption("John Doe");

    // Click generate QR
    const generateButton = screen.getByText("deviceRegistration.generateQr");
    await userEvent.click(generateButton);

    // Error alert should appear
    await waitFor(() => {
      expect(screen.getByText("Failed to generate registration")).toBeDefined();
    });

    fetchMock.mockRestore();
  });

  it("shows success when device registration is confirmed via polling", async () => {
    const onOpenChange = vi.fn();
    mockToDataURL.mockResolvedValue("data:image/png;base64,fakeqr");

    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = url.toString();

      if (urlStr.includes("reports?type=mechanics")) {
        return new Response(JSON.stringify({ data: mockMechanics }), {
          status: 200,
        });
      }

      if (urlStr.includes("clock/generate-registration")) {
        return new Response(JSON.stringify(mockTokenResponse), {
          status: 200,
        });
      }

      if (urlStr.includes("clock/devices")) {
        // Return the device immediately on first poll
        return new Response(JSON.stringify(mockDeviceFound), { status: 200 });
      }

      return new Response(JSON.stringify({ data: null }), { status: 200 });
    });

    render(
      <DeviceRegistrationDialog
        {...defaultProps}
        onOpenChange={onOpenChange}
      />,
    );

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getAllByText("deviceRegistration.title")).toHaveLength(2);
    });

    // Select John Doe
    await selectOption("John Doe");

    // Click generate
    const generateButton = screen.getByText("deviceRegistration.generateQr");
    await userEvent.click(generateButton);

    // Wait for success state (immediate poll finds the device)
    await waitFor(() => {
      expect(screen.getByText("deviceRegistration.success")).toBeDefined();
    });

    fetchMock.mockRestore();
  });
});
