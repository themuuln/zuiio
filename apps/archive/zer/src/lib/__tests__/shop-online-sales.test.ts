import { describe, expect, it } from "vitest";
import {
  filterOnlineSales,
  type OnlineSaleFields,
  onlineBuyerLabel,
} from "../shop-online-sales";

function sale(overrides: Partial<OnlineSaleFields> = {}): OnlineSaleFields {
  return {
    is_online: false,
    contacts: null,
    store_accounts: null,
    ...overrides,
  };
}

describe("onlineBuyerLabel", () => {
  it("prefers the signed-in store account display name over the contact", () => {
    expect(
      onlineBuyerLabel(
        sale({
          is_online: true,
          contacts: { name: "Гоё Хэрэглэгч" },
          store_accounts: { display_name: "Бат", email: "bat@example.mn" },
        }),
      ),
    ).toBe("Бат");
  });

  it("falls back to the store account email when display name is unset", () => {
    expect(
      onlineBuyerLabel(
        sale({
          is_online: true,
          store_accounts: { display_name: null, email: "buyer@example.mn" },
        }),
      ),
    ).toBe("buyer@example.mn");
  });

  it("falls back to the guest contact name for non-signed-in orders", () => {
    expect(
      onlineBuyerLabel(
        sale({ is_online: true, contacts: { name: "Гоё Хэрэглэгч" } }),
      ),
    ).toBe("Гоё Хэрэглэгч");
  });

  it("returns null when there is no buyer information", () => {
    expect(onlineBuyerLabel(sale({ is_online: false }))).toBeNull();
  });
});

describe("filterOnlineSales", () => {
  const sales = [
    sale({ is_online: true, contacts: { name: "Онлайн" } }),
    sale({ is_online: false }),
    sale({ is_online: true, contacts: { name: "Онлайн 2" } }),
  ];

  it("returns all sales when the filter is off", () => {
    expect(filterOnlineSales(sales, false)).toHaveLength(3);
  });

  it("keeps only is_online sales when the filter is on", () => {
    const filtered = filterOnlineSales(sales, true);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((s) => s.is_online)).toBe(true);
  });

  it("does not mutate the input array", () => {
    const input = [...sales];
    filterOnlineSales(sales, true);
    expect(sales).toEqual(input);
  });
});
