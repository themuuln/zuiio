import { afterEach, describe, expect, it } from "vitest";
import { MOCK_FAIL_PACKAGE_ID, MockProvider } from "@/lib/provider/mock";

const provider = new MockProvider();

afterEach(() => {
  delete process.env.MOCK_PROVIDER_FAILURE_RATE;
  delete process.env.MOCK_PROVIDER_ASYNC;
});

describe("MockProvider catalog", () => {
  it("returns a realistic catalog with stable ids", async () => {
    const catalog = await provider.listCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(25);
    const china = catalog.filter((p) => p.regionSlug === "china");
    expect(china.length).toBe(5);
    expect(catalog.every((p) => p.providerPackageId.startsWith("mock-"))).toBe(
      true,
    );
    expect(catalog.every((p) => p.costUsd > 0)).toBe(true);
  });

  it("getPackage finds catalog entries and the fail-test package", async () => {
    const pkg = await provider.getPackage("mock-cn-5gb-30d");
    expect(pkg?.regionSlug).toBe("china");
    expect(pkg?.dataMb).toBe(5 * 1024);

    const failPkg = await provider.getPackage(MOCK_FAIL_PACKAGE_ID);
    expect(failPkg).not.toBeNull();

    expect(await provider.getPackage("nonexistent")).toBeNull();
  });
});

describe("MockProvider provision", () => {
  const req = {
    providerPackageId: "mock-cn-5gb-30d",
    orderRef: "ZIM-TEST01",
    quantity: 1,
    customerEmail: "test@example.com",
  };

  it("is deterministic: same orderRef → same eSIM", async () => {
    const a = await provider.provision(req);
    const b = await provider.provision(req);
    expect(a.kind).toBe("delivered");
    if (a.kind === "delivered" && b.kind === "delivered") {
      expect(a.esims[0].iccid).toBe(b.esims[0].iccid);
      expect(a.esims[0].lpaString).toBe(b.esims[0].lpaString);
    }
  });

  it("different orderRef → different eSIM", async () => {
    const a = await provider.provision(req);
    const b = await provider.provision({ ...req, orderRef: "ZIM-TEST02" });
    if (a.kind === "delivered" && b.kind === "delivered") {
      expect(a.esims[0].iccid).not.toBe(b.esims[0].iccid);
    }
  });

  it("produces valid LPA strings and ICCIDs", async () => {
    const result = await provider.provision(req);
    expect(result.kind).toBe("delivered");
    if (result.kind === "delivered") {
      const esim = result.esims[0];
      expect(esim.lpaString).toMatch(
        /^LPA:1\$rsp\.mock\.zuiio\.dev\$[A-Z2-9]+$/,
      );
      expect(esim.iccid).toMatch(/^8985235\d{12}$/);
    }
  });

  it("respects quantity", async () => {
    const result = await provider.provision({ ...req, quantity: 3 });
    if (result.kind === "delivered") {
      expect(result.esims.length).toBe(3);
      const iccids = new Set(result.esims.map((e) => e.iccid));
      expect(iccids.size).toBe(3);
    }
  });

  it("always fails the magic fail package (retryable)", async () => {
    const result = await provider.provision({
      ...req,
      providerPackageId: MOCK_FAIL_PACKAGE_ID,
    });
    expect(result.kind).toBe("failed");
    if (result.kind === "failed") {
      expect(result.retryable).toBe(true);
    }
  });

  it("failure rate 1 fails everything", async () => {
    process.env.MOCK_PROVIDER_FAILURE_RATE = "1";
    const result = await provider.provision(req);
    expect(result.kind).toBe("failed");
  });

  it("async mode returns pending with a deterministic order id", async () => {
    process.env.MOCK_PROVIDER_ASYNC = "true";
    const a = await provider.provision(req);
    const b = await provider.provision(req);
    expect(a.kind).toBe("pending");
    if (a.kind === "pending" && b.kind === "pending") {
      expect(a.providerOrderId).toBe(b.providerOrderId);
    }
  });

  it("esimsForOrder matches sync provisioning output", async () => {
    const sync = await provider.provision(req);
    const derived = provider.esimsForOrder(req.orderRef, 1);
    if (sync.kind === "delivered") {
      expect(derived[0].iccid).toBe(sync.esims[0].iccid);
    }
  });
});
