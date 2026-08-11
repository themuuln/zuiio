import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  let current: StoreSessionState = { status: "signedOut" };
  return {
    getState: () => current,
    setState: (next: StoreSessionState) => {
      current = next;
    },
  };
});

vi.mock("../use-store-session", () => ({
  useStoreSession: () => ({ state: hoisted.getState() }),
}));

const mockFrom = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import { I18nProvider } from "@/lib/i18n";
import type { StoreSessionState } from "../use-store-session";
import { AddressesClient, type SavedAddress } from "./addresses-client";

const ACCOUNT_STATE: StoreSessionState = {
  status: "account",
  account: {
    id: "user-1",
    email: "buyer@example.com",
    display_name: "Баяр",
    phone: "99112233",
  },
};

const HOME_ADDRESS: SavedAddress = {
  id: "addr-1",
  store_account_id: "user-1",
  label: "Гэр",
  address: "СБД, 1-р хороо, 41-р байр, 12 тоот",
  address_note: "Орц 2",
  phone: "99112233",
  is_default: true,
  created_at: "2026-08-01T12:00:00Z",
  updated_at: "2026-08-01T12:00:00Z",
};

const WORK_ADDRESS: SavedAddress = {
  id: "addr-2",
  store_account_id: "user-1",
  label: "Ажил",
  address: "СБД, 2-р хороо, Бизнес төв",
  address_note: null,
  phone: "99887766",
  is_default: false,
  created_at: "2026-08-02T12:00:00Z",
  updated_at: "2026-08-02T12:00:00Z",
};

// The from() mock mutates `rows` so the post-mutation reload the component
// triggers returns the updated list deterministically.
let rows: SavedAddress[] = [];
function mockTable() {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        order: () => ({
          order: () => Promise.resolve({ data: rows, error: null }),
        }),
      }),
    }),
    insert: (payload: unknown) => {
      mockInsert(payload);
      rows = [
        {
          ...(payload as object),
          id: "addr-new",
          created_at: "2026-08-01T12:00:00Z",
          updated_at: "2026-08-01T12:00:00Z",
        } as SavedAddress,
        ...rows,
      ];
      return Promise.resolve({ error: null });
    },
    update: (payload: unknown) => {
      mockUpdate(payload);
      return {
        eq: () =>
          Object.assign(Promise.resolve({ error: null }), {
            neq: () => Promise.resolve({ error: null }),
          }),
      };
    },
    delete: () => ({
      eq: (_column: unknown, id: unknown) => {
        mockDelete(id);
        rows = rows.filter((r) => r.id !== id);
        return Promise.resolve({ error: null });
      },
    }),
  });
}

function renderAddresses() {
  return render(
    <I18nProvider>
      <AddressesClient slug="storefront-e2e-test" />
    </I18nProvider>,
  );
}

describe("AddressesClient", () => {
  beforeEach(() => {
    hoisted.setState({ status: "signedOut" });
    rows = [];
    mockFrom.mockReset();
    mockCapture.mockClear();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockTable();
  });

  it("shows the sign-in prompt with a link to the account page when signed out", () => {
    renderAddresses();
    expect(
      screen.getByRole("heading", { name: "Хаягийн дэвтэр" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Хаягаа хадгалахын тулд нэвтэрнэ үү."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Нэвтрэх" })).toHaveAttribute(
      "href",
      "/storefront-e2e-test/account",
    );
  });

  it("shows the empty state for a buyer with no saved addresses", async () => {
    hoisted.setState(ACCOUNT_STATE);
    renderAddresses();

    expect(
      await screen.findByText("Хадгалсан хаяг байхгүй байна."),
    ).toBeInTheDocument();
  });

  it("renders saved addresses with labels, details and the default badge", async () => {
    hoisted.setState(ACCOUNT_STATE);
    rows = [HOME_ADDRESS, WORK_ADDRESS];
    renderAddresses();

    expect(await screen.findByText("Гэр")).toBeInTheDocument();
    expect(
      screen.getByText("СБД, 1-р хороо, 41-р байр, 12 тоот"),
    ).toBeInTheDocument();
    expect(screen.getByText("Нэмэлт: Орц 2")).toBeInTheDocument();
    expect(screen.getByText("99112233")).toBeInTheDocument();
    expect(screen.getByText("Үндсэн")).toBeInTheDocument();
    // The non-default address gets the "Үндсэн болгох" action.
    expect(screen.getByText("Ажил")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Үндсэн болгох" }),
    ).toBeInTheDocument();
  });

  it("adds a new address via the form — first address becomes the default", async () => {
    hoisted.setState(ACCOUNT_STATE);
    renderAddresses();

    fireEvent.click(
      await screen.findByRole("button", { name: "Шинэ хаяг нэмэх" }),
    );
    fireEvent.change(screen.getByLabelText("Шошго"), {
      target: { value: "Гэр" },
    });
    fireEvent.change(screen.getByLabelText("Хаяг"), {
      target: { value: "СБД, 1-р хороо, 41-р байр" },
    });
    fireEvent.change(screen.getByLabelText("Нэмэлт мэдээлэл"), {
      target: { value: "Орц 2" },
    });
    fireEvent.change(screen.getByLabelText("Утас"), {
      target: { value: "99112233" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Нэмэх" }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });
    expect(mockInsert).toHaveBeenCalledWith({
      store_account_id: "user-1",
      label: "Гэр",
      address: "СБД, 1-р хороо, 41-р байр",
      address_note: "Орц 2",
      phone: "99112233",
      is_default: true,
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Хаяг хадгалагдлаа.");
    // Reloaded list shows the saved address.
    expect(
      await screen.findByText("СБД, 1-р хороо, 41-р байр"),
    ).toBeInTheDocument();
  });

  it("edits an existing address and saves the changes", async () => {
    hoisted.setState(ACCOUNT_STATE);
    rows = [HOME_ADDRESS];
    renderAddresses();

    fireEvent.click(await screen.findByRole("button", { name: "Засах" }));
    // The form is prefilled with the address row.
    const addressField = screen.getByLabelText("Хаяг") as HTMLTextAreaElement;
    expect(addressField.value).toBe("СБД, 1-р хороо, 41-р байр, 12 тоот");
    fireEvent.change(addressField, {
      target: { value: "СБД, 1-р хороо, 42-р байр" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Хадгалах" }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      label: "Гэр",
      address: "СБД, 1-р хороо, 42-р байр",
      address_note: "Орц 2",
      phone: "99112233",
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Хаяг шинэчлэгдлээ.");
  });

  it("sets the default address via the two-step update", async () => {
    hoisted.setState(ACCOUNT_STATE);
    rows = [WORK_ADDRESS, HOME_ADDRESS];
    renderAddresses();

    fireEvent.click(
      await screen.findByRole("button", { name: "Үндсэн болгох" }),
    );

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
    // Clear the existing default first, then promote the clicked address.
    expect(mockUpdate).toHaveBeenNthCalledWith(1, { is_default: false });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, { is_default: true });
    expect(mockToastSuccess).toHaveBeenCalledWith("Үндсэн хаяг солигдлоо.");
  });

  it("deletes an address after confirmation", async () => {
    hoisted.setState(ACCOUNT_STATE);
    rows = [HOME_ADDRESS, WORK_ADDRESS];
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderAddresses();

    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Устгах" }))[0],
    );

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("addr-1");
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Хаяг устгагдлаа.");
    confirmSpy.mockRestore();
  });

  it("keeps the address when the delete confirmation is declined", async () => {
    hoisted.setState(ACCOUNT_STATE);
    rows = [HOME_ADDRESS];
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderAddresses();

    fireEvent.click(await screen.findByRole("button", { name: "Устгах" }));

    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("validates the address before inserting", async () => {
    hoisted.setState(ACCOUNT_STATE);
    renderAddresses();

    fireEvent.click(
      await screen.findByRole("button", { name: "Шинэ хаяг нэмэх" }),
    );
    fireEvent.change(screen.getByLabelText("Шошго"), {
      target: { value: "Гэр" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Нэмэх" }));

    expect(await screen.findByText("Хаягаа оруулна уу.")).toBeInTheDocument();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
