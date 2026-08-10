import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PartImagesGallery } from "@/components/inventory/part-images-gallery";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUsePartImages = vi.fn();
const mockUseAddPartImage = vi.fn();
const mockUseRemovePartImage = vi.fn();
const mockUseSetPrimaryImage = vi.fn();

vi.mock("@/lib/queries/use-inventory", () => ({
  usePartImages: (...args: unknown[]) => mockUsePartImages(...args),
  useAddPartImage: (...args: unknown[]) => mockUseAddPartImage(...args),
  useRemovePartImage: (...args: unknown[]) => mockUseRemovePartImage(...args),
  useSetPrimaryImage: (...args: unknown[]) => mockUseSetPrimaryImage(...args),
}));

const images = [
  {
    id: "img-1",
    organization_id: "org-1",
    part_id: "part-1",
    image_url: "https://cdn.example.com/1.jpg",
    is_primary: true,
    sort_order: 0,
    created_by: "u-1",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "img-2",
    organization_id: "org-1",
    part_id: "part-1",
    image_url: "https://cdn.example.com/2.jpg",
    is_primary: false,
    sort_order: 1,
    created_by: "u-1",
    created_at: "2026-08-01T00:00:00Z",
  },
];

function renderGallery() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PartImagesGallery orgId="org-1" partId="part-1" />
    </QueryClientProvider>,
  );
}

function imageCard(alt: string): HTMLElement {
  const img = screen.getByAltText(alt);
  const card = img.closest(".group");
  if (!card) throw new Error(`Expected card for ${alt}`);
  return card as HTMLElement;
}

describe("PartImagesGallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePartImages.mockReturnValue({ data: images, isPending: false });
    mockUseAddPartImage.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "img-3" }),
      isPending: false,
    });
    mockUseRemovePartImage.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(null),
      isPending: false,
    });
    mockUseSetPrimaryImage.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "img-2" }),
      isPending: false,
    });
  });

  it("renders image count and image srcs", () => {
    renderGallery();
    expect(screen.getByText("images")).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
    const img1 = screen.getByAltText("Part 1") as HTMLImageElement;
    const img2 = screen.getByAltText("Part 2") as HTMLImageElement;
    expect(img1.src).toContain("1.jpg");
    expect(img2.src).toContain("2.jpg");
  });

  it("only shows set-primary button on non-primary images", () => {
    renderGallery();
    // Base UI Tooltip renders a trigger wrapper + the real button per tooltip.
    // Count only real buttons (data-slot="button").
    expect(
      imageCard("Part 1").querySelectorAll('button[data-slot="button"]'),
    ).toHaveLength(1);
    expect(
      imageCard("Part 2").querySelectorAll('button[data-slot="button"]'),
    ).toHaveLength(2);
  });

  it("shows empty state when there are no images", () => {
    mockUsePartImages.mockReturnValue({ data: [], isPending: false });
    renderGallery();
    expect(screen.getByText("noImages")).toBeInTheDocument();
    expect(screen.queryByAltText("Part 1")).not.toBeInTheDocument();
  });

  it("shows loading spinner while pending with no images", () => {
    mockUsePartImages.mockReturnValue({ data: [], isPending: true });
    const { container } = renderGallery();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("calls removeImage with partId and imageId on delete", async () => {
    const user = userEvent.setup();
    const removeMutate = vi.fn().mockResolvedValue(null);
    mockUseRemovePartImage.mockReturnValue({
      mutateAsync: removeMutate,
      isPending: false,
    });
    renderGallery();

    const card = imageCard("Part 2");
    const removeButton = card.querySelectorAll('button[data-slot="button"]')[1];
    await user.click(removeButton);

    await waitFor(() => {
      expect(removeMutate).toHaveBeenCalledWith({
        partId: "part-1",
        imageId: "img-2",
      });
    });
  });

  it("calls setPrimary with partId and imageId", async () => {
    const user = userEvent.setup();
    const setPrimaryMutate = vi.fn().mockResolvedValue({ id: "img-2" });
    mockUseSetPrimaryImage.mockReturnValue({
      mutateAsync: setPrimaryMutate,
      isPending: false,
    });
    renderGallery();

    const card = imageCard("Part 2");
    const setPrimaryButton = card.querySelectorAll(
      'button[data-slot="button"]',
    )[0];
    await user.click(setPrimaryButton);

    await waitFor(() => {
      expect(setPrimaryMutate).toHaveBeenCalledWith({
        partId: "part-1",
        imageId: "img-2",
      });
    });
  });

  it("adds image with is_primary true when gallery is empty", async () => {
    const user = userEvent.setup();
    const addMutate = vi.fn().mockResolvedValue({ id: "img-1" });
    mockUsePartImages.mockReturnValue({ data: [], isPending: false });
    mockUseAddPartImage.mockReturnValue({
      mutateAsync: addMutate,
      isPending: false,
    });
    renderGallery();

    await user.click(screen.getByText("addImage"));
    await user.type(
      screen.getByPlaceholderText("imageUrlPlaceholder"),
      "https://cdn.example.com/new.jpg",
    );
    await user.click(screen.getByText("add"));

    await waitFor(() => {
      expect(addMutate).toHaveBeenCalledWith({
        partId: "part-1",
        image_url: "https://cdn.example.com/new.jpg",
        is_primary: true,
      });
    });
  });

  it("adds image with is_primary false when gallery already has images", async () => {
    const user = userEvent.setup();
    const addMutate = vi.fn().mockResolvedValue({ id: "img-3" });
    mockUseAddPartImage.mockReturnValue({
      mutateAsync: addMutate,
      isPending: false,
    });
    renderGallery();

    await user.click(screen.getByText("addImage"));
    await user.type(
      screen.getByPlaceholderText("imageUrlPlaceholder"),
      "https://cdn.example.com/new.jpg",
    );
    await user.click(screen.getByText("add"));

    await waitFor(() => {
      expect(addMutate).toHaveBeenCalledWith({
        partId: "part-1",
        image_url: "https://cdn.example.com/new.jpg",
        is_primary: false,
      });
    });
  });

  it("keeps add button disabled while URL is empty", async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.click(screen.getByText("addImage"));
    expect(screen.getByText("add")).toBeDisabled();
  });
});
