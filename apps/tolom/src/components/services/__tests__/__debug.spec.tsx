import { ServiceForm } from "@/components/services/service-form";

const messages = {
  common: { cancel: "Cancel" },
  services: {
    quickAdd: "Quick Add",
    fullDetails: "Full Details",
    serviceName: "Service Name",
    namePlaceholderEn: "Service name (English)",
    nameMn: "Name (Mongolian)",
    namePlaceholderMn: "Service name (Монгол)",
    price: "Price",
    category: "Category",
    categoryPlaceholderForm: "e.g. Oil Change",
    description: "Description",
    descriptionPlaceholder: "Optional description",
    cost: "Cost",
    saving: "Saving...",
    createService: "Create Service",
    failedToSave: "Failed to save",
  },
};

it("debug", async () => {
  const { container } = await import("@/test/test-utils").then((m) =>
    m.render(<ServiceForm />, { messages }),
  );
  // Check button
  const buttons = container.querySelectorAll("button");
  buttons.forEach((_b, _i) => {});
  const html = container.innerHTML;
  const _lastPart = html.substring(Math.max(0, html.length - 2000));
});
