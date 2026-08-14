import { describe, expect, it } from "vitest";
import {
  appointmentKeys,
  attachmentKeys,
  bayViewKeys,
  branchKeys,
  cashRegisterKeys,
  catalogVariantKeys,
  clockKeys,
  commissionKeys,
  customerCommunicationKeys,
  customerKeys,
  customerNoteKeys,
  dashboardKeys,
  dayCloseKeys,
  diagnosisLabelKeys,
  estimateKeys,
  expenseKeys,
  globalCatalogKeys,
  inventoryKeys,
  mechanicKeys,
  mechanicPerfKeys,
  orgKeys,
  payrollKeys,
  priceMemoryKeys,
  priceRuleKeys,
  profileKeys,
  publicStatsKeys,
  refundKeys,
  reportKeys,
  serviceKeys,
  serviceReminderKeys,
  vehicleKeys,
  vehicleModelKeys,
  wizardKeys,
  workOrderKeys,
} from "../keys";

describe("profileKeys", () => {
  it("constructs correct key", () => {
    expect(profileKeys.current()).toEqual(["profile", "current"]);
  });
});

describe("orgKeys", () => {
  it("constructs correct key shapes", () => {
    expect(orgKeys.all).toEqual(["organizations"]);
    expect(orgKeys.current()).toEqual(["organizations", "current"]);
    expect(orgKeys.detail("org-1")).toEqual(["organizations", "org-1"]);
    expect(orgKeys.settings("org-1")).toEqual([
      "organizations",
      "org-1",
      "settings",
    ]);
    expect(orgKeys.subscription("org-1")).toEqual([
      "organizations",
      "org-1",
      "subscription",
    ]);
  });
});

describe("branchKeys", () => {
  it("constructs correct key shapes", () => {
    expect(branchKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "branches",
    ]);
    expect(branchKeys.list("org-1")).toEqual([
      "organizations",
      "org-1",
      "branches",
      "list",
    ]);
  });
});

describe("customerKeys", () => {
  it("constructs correct key shapes", () => {
    expect(customerKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "customers",
    ]);
  });
});

describe("vehicleKeys", () => {
  it("constructs correct key shapes", () => {
    expect(vehicleKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "vehicles",
    ]);
  });
});

describe("workOrderKeys", () => {
  it("constructs correct key shapes", () => {
    expect(workOrderKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "work-orders",
    ]);
  });
});

describe("estimateKeys", () => {
  it("constructs correct key shapes", () => {
    expect(estimateKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "estimates",
    ]);
  });
});

describe("refundKeys", () => {
  it("constructs correct key shapes", () => {
    expect(refundKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "refunds",
    ]);
    expect(refundKeys.list("org-1", "pending")).toEqual([
      "organizations",
      "org-1",
      "refunds",
      "list",
      "pending",
    ]);
    expect(refundKeys.stats("org-1")).toEqual([
      "organizations",
      "org-1",
      "refunds",
      "stats",
    ]);
    expect(refundKeys.detail("org-1", "ref-1")).toEqual([
      "organizations",
      "org-1",
      "refunds",
      "detail",
      "ref-1",
    ]);
  });
});

describe("priceMemoryKeys", () => {
  it("constructs correct key shapes", () => {
    expect(priceMemoryKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "price-memory",
    ]);
  });
});

describe("serviceKeys", () => {
  it("constructs correct key shapes", () => {
    expect(serviceKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "services",
    ]);
  });
});

describe("mechanicKeys", () => {
  it("constructs correct key shapes", () => {
    expect(mechanicKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "mechanics",
    ]);
    expect(mechanicKeys.list("org-1")).toEqual([
      "organizations",
      "org-1",
      "mechanics",
      "list",
    ]);
    expect(mechanicKeys.eod("org-1", "user-1")).toEqual([
      "organizations",
      "org-1",
      "mechanics",
      "user-1",
      "eod",
    ]);
    expect(mechanicKeys.workOrders("org-1", "user-1")).toEqual([
      "organizations",
      "org-1",
      "mechanics",
      "user-1",
      "work-orders",
    ]);
  });
});

describe("mechanicPerfKeys", () => {
  it("constructs correct key shapes", () => {
    expect(mechanicPerfKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "mechanic-performance",
    ]);
  });
});

describe("clockKeys", () => {
  it("constructs correct key", () => {
    expect(clockKeys.status("org-1")).toEqual([
      "organizations",
      "org-1",
      "me",
      "time",
      "status",
    ]);
  });
});

describe("wizardKeys", () => {
  it("constructs correct key shapes", () => {
    expect(wizardKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "wizard",
    ]);
  });
});

describe("vehicleModelKeys", () => {
  it("constructs correct key shapes", () => {
    expect(vehicleModelKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "vehicle-models",
    ]);
  });
});

describe("customerCommunicationKeys", () => {
  it("constructs correct key shapes", () => {
    expect(customerCommunicationKeys.all("org-1", "cust-1")).toEqual([
      "organizations",
      "org-1",
      "customers",
      "cust-1",
      "communications",
    ]);
  });
});

describe("customerNoteKeys", () => {
  it("constructs correct key shapes", () => {
    expect(customerNoteKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "customers",
      "notes",
    ]);
  });
});

describe("reportKeys", () => {
  it("constructs correct key shapes", () => {
    expect(reportKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "reports",
      "all",
    ]);
  });
});

describe("payrollKeys", () => {
  it("constructs correct key shapes", () => {
    expect(payrollKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "payroll",
    ]);
  });
});

describe("dashboardKeys", () => {
  it("constructs correct key shapes", () => {
    expect(dashboardKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "dashboard",
      "all",
    ]);
  });
});

describe("inventoryKeys", () => {
  it("constructs correct key shapes", () => {
    expect(inventoryKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
    ]);
  });
});

describe("serviceReminderKeys", () => {
  it("constructs correct key shapes", () => {
    expect(serviceReminderKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "service-reminders",
    ]);
  });
});

describe("commissionKeys", () => {
  it("constructs correct key shapes", () => {
    expect(commissionKeys.all("org-1")).toEqual(["commission-rules", "org-1"]);
    expect(commissionKeys.list("org-1")).toEqual([
      "commission-rules",
      "org-1",
      "list",
    ]);
  });
});

describe("globalCatalogKeys", () => {
  it("constructs correct key shapes", () => {
    expect(globalCatalogKeys.all).toEqual(["global-catalog"]);
    expect(globalCatalogKeys.services()).toEqual([
      "global-catalog",
      "services",
    ]);
    expect(globalCatalogKeys.parts()).toEqual(["global-catalog", "parts"]);
  });
});

describe("diagnosisLabelKeys", () => {
  it("constructs correct key shapes", () => {
    expect(diagnosisLabelKeys.all("org-1")).toEqual([
      "diagnosis-labels",
      "org-1",
    ]);
  });
});

describe("attachmentKeys", () => {
  it("constructs correct key shapes", () => {
    expect(attachmentKeys.all("org-1", "wo-1")).toEqual([
      "organizations",
      "org-1",
      "work-orders",
      "wo-1",
      "attachments",
    ]);
    expect(attachmentKeys.list("org-1", "wo-1")).toEqual([
      "organizations",
      "org-1",
      "work-orders",
      "wo-1",
      "attachments",
      "list",
    ]);
  });
});

describe("dayCloseKeys", () => {
  it("constructs correct key shapes", () => {
    expect(dayCloseKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "day-close",
    ]);
    expect(dayCloseKeys.status("org-1", "2024-01-15")).toEqual([
      "organizations",
      "org-1",
      "day-close",
      "status",
      "2024-01-15",
    ]);
  });
});

describe("publicStatsKeys", () => {
  it("constructs correct key", () => {
    expect(publicStatsKeys.all).toEqual(["public-stats"]);
  });
});

describe("expenseKeys", () => {
  it("constructs correct key shapes", () => {
    expect(expenseKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "expenses",
    ]);
  });
});

describe("bayViewKeys", () => {
  it("constructs correct key shapes", () => {
    expect(bayViewKeys.all).toEqual(["bay-view"]);
    expect(bayViewKeys.data("branch-1")).toEqual([
      "bay-view",
      "data",
      "branch-1",
    ]);
    expect(bayViewKeys.shiftReport("branch-1")).toEqual([
      "bay-view",
      "shift-report",
      "branch-1",
    ]);
  });
});

describe("appointmentKeys", () => {
  it("constructs correct key shapes", () => {
    expect(appointmentKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "appointments",
    ]);
  });
});

describe("priceRuleKeys", () => {
  it("constructs correct key shapes", () => {
    expect(priceRuleKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "price-rules",
    ]);
  });
});

describe("catalogVariantKeys", () => {
  it("constructs correct key shapes", () => {
    expect(catalogVariantKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "catalog-variants",
    ]);
  });
});

describe("cashRegisterKeys", () => {
  it("constructs correct key shapes", () => {
    expect(cashRegisterKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "cash-register",
    ]);
  });
});
