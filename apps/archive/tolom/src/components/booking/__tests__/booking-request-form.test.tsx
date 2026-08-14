import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BookingRequestForm } from "../booking-request-form";

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

import { reportServerError } from "@/lib/sentry-report-server";

function okResponse(data: unknown) {
  return { ok: true, json: async () => data };
}

function errorResponse(message: string) {
  return { ok: false, json: async () => ({ error: { message } }) };
}

async function fillValidForm(user: UserEvent) {
  await user.type(screen.getByPlaceholderText("namePlaceholder"), "Bat");
  await user.type(
    screen.getByPlaceholderText("phonePlaceholder"),
    "+97699112233",
  );
  await user.type(
    screen.getByPlaceholderText("vehiclePlatePlaceholder"),
    "1234УНА",
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("BookingRequestForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders all fields with prefilled name and phone", () => {
    render(
      <BookingRequestForm
        token="tok-1"
        onSuccess={vi.fn()}
        initialName="Bat"
        initialPhone="+97699112233"
      />,
    );

    const name = screen.getByPlaceholderText("namePlaceholder");
    expect(name).toHaveValue("Bat");
    expect(screen.getByPlaceholderText("phonePlaceholder")).toHaveValue(
      "+97699112233",
    );
    expect(
      screen.getByPlaceholderText("vehiclePlatePlaceholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "requestAppointment" }),
    ).toBeInTheDocument();
  });

  it("validates required fields on empty submit", async () => {
    const user = userEvent.setup();
    render(<BookingRequestForm token="tok-1" onSuccess={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "requestAppointment" }),
    );

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Phone is required")).toBeInTheDocument();
    expect(screen.getByText("Plate number is required")).toBeInTheDocument();
  });

  it("rejects an invalid Mongolian phone number", async () => {
    const user = userEvent.setup();
    render(<BookingRequestForm token="tok-1" onSuccess={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("namePlaceholder"), "Bat");
    await user.type(screen.getByPlaceholderText("phonePlaceholder"), "+976123");
    await user.type(
      screen.getByPlaceholderText("vehiclePlatePlaceholder"),
      "1234УНА",
    );
    await user.click(
      screen.getByRole("button", { name: "requestAppointment" }),
    );

    expect(
      await screen.findByText("Enter a valid Mongolian phone number"),
    ).toBeInTheDocument();
  });

  it("posts the form data and calls onSuccess with the server message", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ data: { message: "Requested" } }));
    vi.stubGlobal("fetch", fetchMock);

    render(<BookingRequestForm token="tok-9" onSuccess={onSuccess} />);
    await fillValidForm(user);

    // Optional fields
    const dateInput =
      document.querySelector<HTMLInputElement>('input[type="date"]');
    if (!dateInput) throw new Error("date input not found");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-08-10");
    await user.type(screen.getByPlaceholderText("notesPlaceholder"), "Weekend");

    await user.click(
      screen.getByRole("button", { name: "requestAppointment" }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/booking/tok-9",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Bat",
            phone: "+97699112233",
            plate: "1234УНА",
            notes: "Weekend",
            requestedDate: "2026-08-10",
          }),
        }),
      ),
    );
    expect(onSuccess).toHaveBeenCalledWith("Requested");
  });

  it("honors a custom apiEndpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ data: { message: "OK" } }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BookingRequestForm
        token="tok-1"
        onSuccess={vi.fn()}
        apiEndpoint="/custom/booking"
      />,
    );
    await fillValidForm(user);
    await user.click(
      screen.getByRole("button", { name: "requestAppointment" }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/custom/booking",
        expect.any(Object),
      ),
    );
  });

  it("shows the server error message when the request fails", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse("Slot is taken")),
    );

    render(<BookingRequestForm token="tok-1" onSuccess={onSuccess} />);
    await fillValidForm(user);
    await user.click(
      screen.getByRole("button", { name: "requestAppointment" }),
    );

    expect(await screen.findByText("Slot is taken")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("shows the network error message when fetch throws", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<BookingRequestForm token="tok-1" onSuccess={vi.fn()} />);
    await fillValidForm(user);
    await user.click(
      screen.getByRole("button", { name: "requestAppointment" }),
    );

    expect(await screen.findByText("networkError")).toBeInTheDocument();
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });
});
