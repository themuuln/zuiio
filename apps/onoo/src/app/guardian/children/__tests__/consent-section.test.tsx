/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ConsentInfo } from "@/app/lib/guardian-data";

// Mock server actions
vi.mock("@/app/lib/actions/consent-actions", () => ({
  signConsentAction: vi.fn().mockResolvedValue({
    record_id: "rec-1",
    status: "signed",
  }),
  withdrawConsentAction: vi.fn().mockResolvedValue({
    record_id: "rec-1",
    status: "withdrawn",
  }),
}));

// Need to mock the Dialog component's portal behavior for jsdom tests.
// The shadcn Dialog uses Radix UI Portal which renders to document.body.
// In jsdom this works but we need the dialog content to be findable.

import ConsentSection from "../[id]/consent-section";

const mockStudentId = "student-123";

function makeConsent(overrides: Partial<ConsentInfo> = {}): ConsentInfo {
  return {
    signed: [],
    pending: [],
    ...overrides,
  };
}

describe("ConsentSection", () => {
  describe("empty / null states", () => {
    it('renders "мэдээлэл байхгүй" when consent is null', () => {
      render(<ConsentSection consent={null} studentId={mockStudentId} />);
      expect(
        screen.getByText("Зөвшөөрлийн мэдээлэл байхгүй"),
      ).toBeInTheDocument();
    });

    it('renders "шаардлагагүй" when no templates exist', () => {
      render(
        <ConsentSection
          consent={makeConsent({ signed: [], pending: [] })}
          studentId={mockStudentId}
        />,
      );
      expect(screen.getByText("Зөвшөөрөл шаардлагагүй")).toBeInTheDocument();
    });
  });

  describe("pending templates", () => {
    const consentWithPending = makeConsent({
      pending: [
        {
          id: "tmpl-1",
          title: "Ерөнхий зөвшөөрөл",
          scope: "general",
          body: "Зөвшөөрлийн дэлгэрэнгүй агуулга.",
        },
        {
          id: "tmpl-2",
          title: "Медиа зөвшөөрөл",
          scope: "media",
          body: "Гэрэл зураг, видеонд ашиглах зөвшөөрөл.",
        },
      ],
    });

    it("renders pending templates with titles and scope badges", () => {
      render(
        <ConsentSection
          consent={consentWithPending}
          studentId={mockStudentId}
        />,
      );

      expect(screen.getByText("Хүлээгдэж буй")).toBeInTheDocument();
      expect(screen.getByText("Ерөнхий зөвшөөрөл")).toBeInTheDocument();
      expect(screen.getByText("Медиа зөвшөөрөл")).toBeInTheDocument();
      expect(screen.getByText("Ерөнхий")).toBeInTheDocument();
      expect(screen.getByText("Медиа")).toBeInTheDocument();
    });

    it("shows a Зөвшөөрөх button for each pending template", () => {
      render(
        <ConsentSection
          consent={consentWithPending}
          studentId={mockStudentId}
        />,
      );

      const signButtons = screen.getAllByRole("button", { name: "Зөвшөөрөх" });
      expect(signButtons).toHaveLength(2);
    });
    it("opens sign dialog when Зөвшөөрөх is clicked", async () => {
      const user = userEvent.setup();
      render(
        <ConsentSection
          consent={consentWithPending}
          studentId={mockStudentId}
        />,
      );

      await user.click(screen.getAllByRole("button", { name: "Зөвшөөрөх" })[0]);

      // Dialog body content should render
      expect(
        screen.getByText("Зөвшөөрлийн дэлгэрэнгүй агуулга."),
      ).toBeInTheDocument();
      // Close button should exist
      expect(screen.getByRole("button", { name: "Болих" })).toBeInTheDocument();
    });

    it("shows fallback text for empty template body", async () => {
      const user = userEvent.setup();
      const consentWithEmptyBody = makeConsent({
        pending: [
          {
            id: "tmpl-empty",
            title: "Хоосон зөвшөөрөл",
            scope: "liability",
            body: "",
          },
        ],
      });

      render(
        <ConsentSection
          consent={consentWithEmptyBody}
          studentId={mockStudentId}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Зөвшөөрөх" }));

      expect(
        screen.getByText("Зөвшөөрлийн агуулга хоосон байна."),
      ).toBeInTheDocument();
    });
  });

  describe("signed records", () => {
    const consentWithSigned = makeConsent({
      signed: [
        {
          id: "rec-1",
          template_id: "tmpl-1",
          template_title: "Ерөнхий зөвшөөрөл",
          signed_at: "2026-07-26T10:00:00Z",
          is_withdrawn: false,
        },
        {
          id: "rec-2",
          template_id: "tmpl-2",
          template_title: "Медиа зөвшөөрөл",
          signed_at: "2026-07-26T11:00:00Z",
          is_withdrawn: true,
        },
      ],
    });

    it("renders signed records with status badges", () => {
      render(
        <ConsentSection
          consent={consentWithSigned}
          studentId={mockStudentId}
        />,
      );

      expect(screen.getByText("Гарын үсэг зурсан")).toBeInTheDocument();
      expect(screen.getByText("Ерөнхий зөвшөөрөл")).toBeInTheDocument();
      expect(screen.getByText("Медиа зөвшөөрөл")).toBeInTheDocument();
      expect(screen.getByText("Зурсан")).toBeInTheDocument();
      expect(screen.getByText("Татагдсан")).toBeInTheDocument();
    });

    it("shows Татах button only for non-withdrawn records", () => {
      render(
        <ConsentSection
          consent={consentWithSigned}
          studentId={mockStudentId}
        />,
      );

      const withdrawButtons = screen.getAllByRole("button", { name: "Татах" });
      expect(withdrawButtons).toHaveLength(1); // Only one is not withdrawn
    });

    it("opens withdraw dialog when Татах is clicked", async () => {
      const user = userEvent.setup();
      render(
        <ConsentSection
          consent={consentWithSigned}
          studentId={mockStudentId}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Татах" }));

      expect(screen.getByText("Зөвшөөрлийг татах уу?")).toBeInTheDocument();
      expect(
        screen.getByText(/Энэ үйлдлийг буцаах боломжгүй/),
      ).toBeInTheDocument();
    });
  });

  describe("combined state", () => {
    it("renders both pending and signed sections simultaneously", () => {
      const consent = makeConsent({
        signed: [
          {
            id: "rec-1",
            template_id: "tmpl-1",
            template_title: "Зурсан зөвшөөрөл",
            signed_at: "2026-07-26T10:00:00Z",
            is_withdrawn: false,
          },
        ],
        pending: [
          {
            id: "tmpl-2",
            title: "Хүлээгдэж буй зөвшөөрөл",
            scope: "medical",
            body: "Эмнэлгийн зөвшөөрөл.",
          },
        ],
      });

      render(<ConsentSection consent={consent} studentId={mockStudentId} />);

      expect(screen.getByText("Хүлээгдэж буй")).toBeInTheDocument();
      expect(screen.getByText("Гарын үсэг зурсан")).toBeInTheDocument();
      expect(screen.getByText("Хүлээгдэж буй зөвшөөрөл")).toBeInTheDocument();
      expect(screen.getByText("Зурсан зөвшөөрөл")).toBeInTheDocument();
    });
  });

  describe("scopeLabel helper", () => {
    it("displays correct scope labels", () => {
      const consent = makeConsent({
        pending: [
          { id: "t1", title: "T1", scope: "liability", body: "..." },
          { id: "t2", title: "T2", scope: "medical", body: "..." },
          { id: "t3", title: "T3", scope: "media", body: "..." },
          { id: "t4", title: "T4", scope: "general", body: "..." },
        ],
      });

      render(<ConsentSection consent={consent} studentId={mockStudentId} />);

      expect(screen.getByText("Хариуцлагаас чөлөөлөх")).toBeInTheDocument();
      expect(screen.getByText("Эмнэлгийн")).toBeInTheDocument();
      expect(screen.getByText("Медиа")).toBeInTheDocument();
      expect(screen.getByText("Ерөнхий")).toBeInTheDocument();
    });
  });
});
