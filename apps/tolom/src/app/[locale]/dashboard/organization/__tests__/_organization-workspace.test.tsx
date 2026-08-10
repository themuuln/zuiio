import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { useForm } from "@/lib/hooks/use-form";
import type { Organization, SubscriptionPlanInfo } from "@/lib/types";
import { render } from "@/test/test-utils";
import {
  OrganizationWorkspace,
  type OrgEditValues,
} from "../_organization-workspace";

// ── Module mocks ────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const {
      fill: _fill,
      sizes: _sizes,
      unoptimized: _unoptimized,
      priority: _priority,
      quality: _quality,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      width: _width,
      height: _height,
      ...rest
    } = props;
    return (
      // biome-ignore lint/performance/noImgElement: test stand-in for next/image
      // biome-ignore lint/a11y/useAltText: alt flows through the mocked props
      <img {...(rest as ImgHTMLAttributes<HTMLImageElement>)} />
    );
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: React.ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/push-notification-settings", () => ({
  PushNotificationSettings: () => (
    <div data-testid="push-notification-settings" />
  ),
}));

// ── Fixtures ────────────────────────────────────────────────────────
function makeOrg(overrides: Partial<Organization> = {}): Organization {
  return {
    id: "org-1",
    name: "Garage X",
    slug: "garage-x",
    logo_url: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    booking_token: null,
    branch_limit: 1,
    is_active: true,
    sharing_enabled: false,
    settings: null,
    tax_id: null,
    ...overrides,
  };
}

const org = makeOrg();

const subscription: SubscriptionPlanInfo = {
  id: "sub-1",
  organizationId: "org-1",
  planType: "pro",
  status: "active",
  startedAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-03-01T00:00:00.000Z",
  gracePeriodEnd: null,
  trial: true,
};

// ── Harness ─────────────────────────────────────────────────────────
interface HarnessProps {
  organization?: Organization;
  subscription?: SubscriptionPlanInfo;
  loading?: boolean;
  subscriptionLoading?: boolean;
  editing?: boolean;
  saving?: boolean;
  name?: string;
  logoUrl?: string;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
}

function WorkspaceHarness({
  organization,
  subscription: sub,
  loading = false,
  subscriptionLoading = false,
  editing = false,
  saving = false,
  name,
  logoUrl,
  onEdit,
  onCancel,
  onSave,
}: HarnessProps) {
  const form = useForm<OrgEditValues>({
    defaultValues: {
      name: name ?? organization?.name ?? "",
      logoUrl: logoUrl ?? organization?.logo_url ?? "",
    },
  });
  return (
    <OrganizationWorkspace
      organization={organization}
      subscription={sub}
      loading={loading}
      subscriptionLoading={subscriptionLoading}
      editing={editing}
      saving={saving}
      form={form}
      onEdit={onEdit ?? (() => {})}
      onCancel={onCancel ?? (() => {})}
      onSave={onSave ?? (() => {})}
      t={(key: string) => key}
      orgT={(key: string) => key}
      pageT={(key: string) => key}
    />
  );
}

function renderWorkspace(props: HarnessProps = {}) {
  const view = render(<WorkspaceHarness {...props} />);
  const user = userEvent.setup();
  return { user, ...view };
}

// ── Tests ───────────────────────────────────────────────────────────
describe("OrganizationWorkspace", () => {
  it("renders the org name, slug and initial mark in read-only mode", () => {
    renderWorkspace({ organization: org });

    // Header line + identity card title + detail row value
    expect(screen.getAllByText("Garage X")).toHaveLength(3);
    // Header line + card description + slug detail row
    expect(screen.getAllByText("garage-x")).toHaveLength(3);
    // No logo → fallback initial from the org name
    expect(screen.getByText("G")).toBeInTheDocument();
    expect(screen.getByText("organization")).toBeInTheDocument();
    expect(screen.getByText("manageYourOrg")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "common.edit" }),
    ).toBeInTheDocument();
  });

  it("renders the logo image and logo URL link when logo_url is set", () => {
    renderWorkspace({
      organization: makeOrg({
        name: "Garage X",
        logo_url: "https://cdn.example.com/logo.png",
      }),
    });

    expect(screen.getByRole("img", { name: "Garage X" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/logo.png",
    );
    const logoLink = screen.getByRole("link", {
      name: "https://cdn.example.com/logo.png",
    });
    expect(logoLink).toHaveAttribute(
      "href",
      "https://cdn.example.com/logo.png",
    );
    expect(logoLink).toHaveAttribute("target", "_blank");
  });

  it("shows skeletons and hides org details while loading", () => {
    renderWorkspace({ organization: org, loading: true });

    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Garage X")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "common.edit" }),
    ).not.toBeInTheDocument();
  });

  it("renders the subscription plan, trial badge and billing dates", () => {
    renderWorkspace({
      organization: org,
      subscription,
      subscriptionLoading: false,
    });

    expect(screen.getByText("subscription")).toBeInTheDocument();
    expect(screen.getByText("planPro")).toBeInTheDocument();
    expect(screen.getByText("admin.trial")).toBeInTheDocument();
    expect(screen.getByText("started")).toBeInTheDocument();
    expect(screen.getByText("trialEnds")).toBeInTheDocument();
    expect(
      screen.getByText(new Date(subscription.startedAt).toLocaleDateString()),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new Date(subscription.expiresAt).toLocaleDateString()),
    ).toBeInTheDocument();
    // Header status badge
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders a message when there is no active subscription", () => {
    renderWorkspace({ organization: org });

    expect(screen.getByText("noActiveSubscription")).toBeInTheDocument();
  });

  it("shows an upgrade link for non-enterprise plans and a current-plan badge for enterprise", () => {
    const { unmount } = renderWorkspace({
      organization: org,
      subscription,
    });

    const upgrade = screen.getByRole("link", { name: "upgradePlan" });
    expect(upgrade).toHaveAttribute("href", "/pricing?plan=pro");
    unmount();

    renderWorkspace({
      organization: org,
      subscription: { ...subscription, planType: "enterprise" },
    });
    expect(screen.getByText("currentPlan")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "upgradePlan" }),
    ).not.toBeInTheDocument();
  });

  it("shows subscription skeletons while subscriptionLoading is true", () => {
    renderWorkspace({
      organization: org,
      subscription,
      subscriptionLoading: true,
    });

    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("planPro")).not.toBeInTheDocument();
  });

  it("renders editable name and logo inputs in edit mode and hides the edit button", () => {
    renderWorkspace({
      organization: org,
      editing: true,
      name: "Garage X",
    });

    const nameInput = screen.getByPlaceholderText("orgNamePlaceholder");
    expect(nameInput).toHaveValue("Garage X");
    expect(screen.getByPlaceholderText("logoUrlPlaceholder")).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: "common.edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "common.save" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "common.cancel" }),
    ).toBeInTheDocument();
  });

  it("calls onSave with the edited form values on submit", async () => {
    const onSave = vi.fn();
    const { user } = renderWorkspace({
      organization: org,
      editing: true,
      onSave,
    });

    const nameInput = screen.getByPlaceholderText("orgNamePlaceholder");
    await user.clear(nameInput);
    await user.type(nameInput, "New Garage");
    await user.click(screen.getByRole("button", { name: "common.save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toEqual({
      name: "New Garage",
      logoUrl: "",
    });
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const { user } = renderWorkspace({
      organization: org,
      editing: true,
      onCancel,
    });

    await user.click(screen.getByRole("button", { name: "common.cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables save and cancel buttons while saving", () => {
    renderWorkspace({ organization: org, editing: true, saving: true });

    expect(
      screen.getByRole("button", { name: "organization.saving" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "common.cancel" }),
    ).toBeDisabled();
  });

  it("renders workspace destination cards with the expected hrefs and titles", () => {
    renderWorkspace({ organization: org });

    const destinations: Array<[string, RegExp]> = [
      ["/dashboard/organization/members", /members/],
      ["/dashboard/organization/roles", /roles/],
      ["/dashboard/payroll", /payroll/],
      ["/dashboard/settings", /settings/],
      ["/dashboard/organization/settings/theme", /theme/],
      ["/dashboard/organization/devices", /devices/],
    ];
    for (const [href, name] of destinations) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(
      screen.getByTestId("push-notification-settings"),
    ).toBeInTheDocument();
  });
});
