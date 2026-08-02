import type { TableClient } from "@/lib/client";
import {
  accountMetadata,
  ensureStoreAccount,
  isValidPhone,
  type StoreAccountRow,
} from "@/lib/store-account";

function makeTableClient(opts: {
  existing?: unknown;
  upsertError?: { message: string } | null;
}): TableClient & { upsert: jest.Mock } {
  const upsert = jest.fn(async () => ({ error: opts.upsertError ?? null }));
  const client: TableClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: opts.existing ?? null,
            error: null,
          }),
        }),
      }),
      upsert,
    }),
  };
  return { ...client, upsert };
}

const user = {
  id: "user-1",
  email: "buyer@example.com",
  user_metadata: {
    store_account: true,
    display_name: "Бат",
    phone: "99112233",
  },
};

describe("isValidPhone", () => {
  it("accepts 8–12 digits with separators", () => {
    expect(isValidPhone("99112233")).toBe(true);
    expect(isValidPhone("+976 9911 2233")).toBe(true);
    expect(isValidPhone("123456789012")).toBe(true);
  });

  it("rejects short and long numbers", () => {
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("1234567890123")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});

describe("accountMetadata", () => {
  it("reads display_name and phone from sign-up metadata", () => {
    expect(accountMetadata(user)).toEqual({
      displayName: "Бат",
      phone: "99112233",
    });
  });

  it("ignores non-string metadata values", () => {
    expect(
      accountMetadata({
        id: "u",
        user_metadata: { display_name: 123, phone: null },
      }),
    ).toEqual({ displayName: null, phone: null });
  });
});

describe("ensureStoreAccount", () => {
  it("returns the existing row without upserting", async () => {
    const existing: StoreAccountRow = {
      id: "user-1",
      email: "buyer@example.com",
      display_name: "Бат",
      phone: "99112233",
    };
    const client = makeTableClient({ existing });
    const result = await ensureStoreAccount(client, user);
    expect(result).toEqual({ account: existing, created: false });
    expect(client.upsert).not.toHaveBeenCalled();
  });

  it("upserts a row from session metadata when missing", async () => {
    const client = makeTableClient({});
    const result = await ensureStoreAccount(client, user);
    expect(result.created).toBe(true);
    expect(result.account).toEqual({
      id: "user-1",
      email: "buyer@example.com",
      display_name: "Бат",
      phone: "99112233",
    });
    expect(client.upsert).toHaveBeenCalledWith({
      id: "user-1",
      email: "buyer@example.com",
      display_name: "Бат",
      phone: "99112233",
    });
  });

  it("throws when the upsert fails", async () => {
    const client = makeTableClient({ upsertError: { message: "RLS denied" } });
    await expect(ensureStoreAccount(client, user)).rejects.toThrow(
      /RLS denied/,
    );
  });
});
