import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BusinessDefaultsForm,
  buildFormFromOrganization,
  DEFAULT_FORM,
  type SettingsForm,
} from "@/app/[locale]/dashboard/settings/_business-defaults-form";

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: { fallback?: string }) =>
    params?.fallback ?? key,
}));

// ── Helpers ────────────────────────────────────────────────────────────

function makeProps(
  overrides: Partial<Parameters<typeof BusinessDefaultsForm>[0]> = {},
) {
  const setForm = vi.fn();
  const onSubmit = vi.fn();
  const props: Parameters<typeof BusinessDefaultsForm>[0] = {
    form: { ...DEFAULT_FORM },
    setForm,
    saving: false,
    error: null,
    successMessage: null,
    currentLocale: "en",
    onSubmit,
    ...overrides,
  };
  return { setForm, onSubmit, props };
}

function renderForm(
  overrides: Partial<Parameters<typeof BusinessDefaultsForm>[0]> = {},
) {
  const { setForm, onSubmit, props } = makeProps(overrides);
  const result = render(<BusinessDefaultsForm {...props} />);
  return { setForm, onSubmit, props, result };
}

function formElement(): HTMLFormElement {
  const form = document.querySelector("form");
  if (!form) throw new Error("Missing form");
  return form as HTMLFormElement;
}

function submitForm() {
  fireEvent.submit(formElement());
}

/** Type into a NumericInput and commit the value (commits on blur/Enter). */
async function setNumericInput(input: HTMLElement, value: string) {
  const user = userEvent.setup();
  await user.clear(input);
  await user.type(input, value);
  await user.tab();
}

/** Pick a Base UI Select item (pointerdown + click, see vehicle-form.test.tsx). */
function selectPopupItem(text: string) {
  const item = screen.getByText(text);
  fireEvent.pointerDown(item, { pointerType: "mouse" });
  fireEvent.click(item);
}

async function openSelect(triggerId: string) {
  const user = userEvent.setup();
  await user.click(document.getElementById(triggerId) as HTMLElement);
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("buildFormFromOrganization", () => {
  it("returns DEFAULT_FORM for missing or null settings", () => {
    expect(buildFormFromOrganization({ settings: null })).toEqual(DEFAULT_FORM);
    expect(buildFormFromOrganization({ settings: undefined })).toEqual(
      DEFAULT_FORM,
    );
  });

  it("maps snake_case settings onto the form shape with fallbacks", () => {
    const form = buildFormFromOrganization({
      settings: {
        invoice_prefix: "AB",
        default_currency: "USD",
        default_tax_rate: 5,
        nuat_enabled: true,
        ndsh_enabled: true,
        ndsh_employer_rate: 11,
        ndsh_employee_rate: 11.5,
        einvoice_enabled: true,
        einvoice_api_key: "sk_test",
        einvoice_merchant_id: "MERCH-1",
        timezone: "Asia/Tokyo",
        date_format: "DD/MM/YYYY",
        language: "en",
        brand_color: "#334155",
      },
    });

    expect(form).toEqual({
      invoicePrefix: "AB",
      defaultCurrency: "USD",
      defaultTaxRate: "5",
      nuatEnabled: true,
      ndshEnabled: true,
      ndshEmployerRate: "11",
      ndshEmployeeRate: "11.5",
      einvoiceEnabled: true,
      einvoiceApiKey: "sk_test",
      einvoiceMerchantId: "MERCH-1",
      einvoiceEndpoint: "",
      timezone: "Asia/Tokyo",
      dateFormat: "DD/MM/YYYY",
      language: "en",
      brandColor: "#334155",
    });
  });

  it("falls back for non-string/non-boolean settings", () => {
    const form = buildFormFromOrganization({
      settings: {
        invoice_prefix: 123,
        default_currency: "",
        default_tax_rate: "not-a-number",
        nuat_enabled: null,
        ndsh_enabled: null,
        einvoice_enabled: null,
      },
    });

    expect(form.invoicePrefix).toBe(DEFAULT_FORM.invoicePrefix);
    expect(form.defaultCurrency).toBe(DEFAULT_FORM.defaultCurrency);
    expect(form.defaultTaxRate).toBe("not-a-number"); // string passes through
    expect(form.nuatEnabled).toBe(false);
    expect(form.ndshEnabled).toBe(false);
    expect(form.einvoiceEnabled).toBe(false);
  });
});

describe("BusinessDefaultsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders saved form values into fields", () => {
      renderForm({
        form: {
          ...DEFAULT_FORM,
          invoicePrefix: "SRV",
          defaultCurrency: "USD",
          timezone: "Asia/Tokyo",
          dateFormat: "DD/MM/YYYY",
          language: "en",
        },
      });

      expect(screen.getByLabelText("invoicePrefix")).toHaveValue("SRV");
      expect(screen.getByText("USD")).toBeInTheDocument();
      expect(screen.getByLabelText("timezone")).toHaveValue("Asia/Tokyo");
      expect(screen.getByLabelText("dateFormat")).toHaveValue("DD/MM/YYYY");
      expect(screen.getByRole("button", { name: "save" })).toBeInTheDocument();
    });

    it("displays the error message when provided", () => {
      renderForm({ error: "Something went wrong" });
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("displays the success message when provided", () => {
      renderForm({
        successMessage: "Settings saved",
        form: { ...DEFAULT_FORM, language: "en" },
      });
      expect(screen.getByText("Settings saved")).toBeInTheDocument();
      expect(screen.getByText("allChangesSaved")).toBeInTheDocument();
    });

    it("disables the submit button and shows saving state while saving", () => {
      renderForm({ saving: true });
      expect(screen.getByRole("button", { name: "saving" })).toBeDisabled();
    });
  });

  describe("validation", () => {
    it("clamps the VAT rate to the 0-100 input boundary", async () => {
      renderForm({
        form: { ...DEFAULT_FORM, nuatEnabled: true },
      });

      await setNumericInput(screen.getByLabelText("VAT Rate"), "150");

      // NumericInput enforces min/max on commit, so the schema's
      // 0-100 range can never be violated through the UI
      await waitFor(() => {
        expect(screen.getByLabelText("VAT Rate")).toHaveValue("100");
      });
    });

    it("blocks submit with an empty timezone", async () => {
      const { onSubmit } = renderForm();

      fireEvent.change(screen.getByLabelText("timezone"), {
        target: { value: "" },
      });
      submitForm();

      expect(
        await screen.findByText("Timezone is required"),
      ).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("blocks submit with an over-long invoice prefix", async () => {
      const { onSubmit } = renderForm();

      fireEvent.change(screen.getByLabelText("invoicePrefix"), {
        target: { value: "ABCDEFGHIJKLMNO" },
      });
      submitForm();

      expect(await screen.findByText("Prefix is too long")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits when the form is valid", async () => {
      const { onSubmit } = renderForm();
      submitForm();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    });
  });

  describe("toggle-gated sections", () => {
    it("reveals the VAT rate field when НӨАТ is enabled", async () => {
      const user = userEvent.setup();
      renderForm();

      expect(screen.queryByLabelText("VAT Rate")).not.toBeInTheDocument();

      await user.click(document.getElementById("nuatEnabled") as HTMLElement);
      expect(screen.getByLabelText("VAT Rate")).toBeInTheDocument();
    });

    it("reveals employer/employee НДШ rates when social insurance is enabled", async () => {
      const user = userEvent.setup();
      renderForm();

      expect(screen.queryByText("Employer НДШ")).not.toBeInTheDocument();
      expect(screen.queryByText("Employee НДШ")).not.toBeInTheDocument();

      await user.click(document.getElementById("ndshEnabled") as HTMLElement);
      expect(screen.getByText("Employer НДШ")).toBeInTheDocument();
      expect(screen.getByText("Employee НДШ")).toBeInTheDocument();
    });

    it("reveals merchant ID + API key when e-invoice is enabled", async () => {
      const user = userEvent.setup();
      renderForm();

      expect(
        screen.queryByPlaceholderText("merchantIdPlaceholder"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("apiKeyPlaceholder"),
      ).not.toBeInTheDocument();

      await user.click(
        document.getElementById("einvoiceEnabled") as HTMLElement,
      );
      expect(
        screen.getByPlaceholderText("merchantIdPlaceholder"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("apiKeyPlaceholder"),
      ).toBeInTheDocument();
    });
  });

  describe("field behavior", () => {
    it("uppercases the invoice prefix as the user types", async () => {
      renderForm();
      const input = screen.getByLabelText("invoicePrefix");
      await userEvent.clear(input);
      await userEvent.type(input, "abc");
      expect(input).toHaveValue("ABC");
    });

    it("syncs edits to the parent form state", async () => {
      const { setForm } = renderForm();

      // The watch subscription fires on mount with current values; capture
      // the updater produced by a later edit.
      const user = userEvent.setup();
      await user.type(screen.getByLabelText("invoicePrefix"), "XYZ");

      await waitFor(() => {
        expect(setForm).toHaveBeenCalled();
      });
      let lastUpdate: ((prev: SettingsForm) => SettingsForm) | null = null;
      for (const call of setForm.mock.calls) {
        if (typeof call[0] === "function") lastUpdate = call[0];
      }
      const next = lastUpdate?.({ ...DEFAULT_FORM });
      expect(next?.invoicePrefix).toBe("INVXYZ");
      // Unrelated fields are preserved
      expect(next?.defaultCurrency).toBe("MNT");
    });

    it("shows the language-change hint when the selected language differs from the locale", async () => {
      renderForm({
        currentLocale: "en",
        form: { ...DEFAULT_FORM, language: "en" },
      });

      expect(
        screen.queryByText("languageChangeAfterSave"),
      ).not.toBeInTheDocument();

      await openSelect("language");
      selectPopupItem("languageMn");

      expect(screen.getByText("languageChangeAfterSave")).toBeInTheDocument();
      expect(screen.getByText("langWillReload")).toBeInTheDocument();
    });
  });
});
