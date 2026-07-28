import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrgLogoUpload from "@/components/org-logo-upload";

const mockOnLogoChange = vi.fn();

// Mock @zuiio/query
vi.mock("@zuiio/query", () => ({
  useOrgMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// Mock next-intl - component uses useTranslations("organization")
// with keys like "logo.uploadLogo", "logo.remove", etc.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "logo.uploadLogo": "Upload logo",
      "logo.remove": "Remove logo",
      "logo.changeLogo": "Change logo",
      "logo.altText": "Logo of {name}",
      "logo.uploaded": "Logo uploaded",
      "logo.removed": "Logo removed",
      "logo.sizeError": "File too large",
      "logo.typeError": "Invalid file type",
      "logo.uploadFailed": "Upload failed",
    };
    return map[key] ?? key;
  },
}));

// Mock react-dropzone
vi.mock("react-dropzone", () => ({
  useDropzone: () => ({
    getRootProps: () => ({
      onClick: vi.fn(),
      onKeyDown: vi.fn(),
      role: "button",
      tabIndex: 0,
    }),
    getInputProps: () => ({
      accept: "image/*",
      multiple: false,
      type: "file",
      style: { display: "none" },
    }),
    isDragActive: false,
    acceptedFiles: [],
    inputRef: { current: null },
  }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock sentry
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

describe("OrgLogoUpload", () => {
  beforeEach(() => {
    mockOnLogoChange.mockClear();
  });

  it("renders upload button when no logo", () => {
    render(
      <OrgLogoUpload
        orgId="org-1"
        logoUrl={null}
        orgName="Test Org"
        onLogoChange={mockOnLogoChange}
      />,
    );
    expect(screen.getByText("Upload logo")).toBeInTheDocument();
  });

  it("renders change logo and remove buttons when logo exists", () => {
    render(
      <OrgLogoUpload
        orgId="org-1"
        logoUrl="/logos/test.png"
        orgName="Test Org"
        onLogoChange={mockOnLogoChange}
      />,
    );
    expect(screen.getByText("Change logo")).toBeInTheDocument();
    expect(screen.getByText("Remove logo")).toBeInTheDocument();
  });

  it("renders Camera icon when no logo", () => {
    render(
      <OrgLogoUpload
        orgId="org-1"
        logoUrl={null}
        orgName="Test Org"
        onLogoChange={mockOnLogoChange}
      />,
    );
    expect(document.querySelector(".lucide-camera")).toBeInTheDocument();
  });
});
