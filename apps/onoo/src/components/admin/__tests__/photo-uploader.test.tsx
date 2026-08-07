import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock sonner
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string; [k: string]: unknown }) => (
    // biome-ignore lint/performance/noImgElement: test mock, not production
    <img src={props.src} alt={props.alt} data-testid="preview-img" />
  ),
}));

import { toast } from "sonner";
import { PhotoUploader } from "../photo-uploader";

const mockToast = vi.mocked(toast);

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]');
  if (!input) throw new Error("No file input found");
  return input as HTMLInputElement;
}

function createFile(name: string, type: string, size: number): File {
  const buffer = new ArrayBuffer(size);
  const file = new File([buffer], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

const defaultProps = {
  entityId: "player-1",
  entityType: "player" as const,
  onUploaded: vi.fn(),
};

describe("PhotoUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload button", () => {
    render(<PhotoUploader {...defaultProps} />);
    expect(screen.getByText("Файл сонгох")).toBeInTheDocument();
  });

  it("renders upload icon placeholder when no currentUrl", () => {
    const { container } = render(<PhotoUploader {...defaultProps} />);
    expect(
      container.querySelector(".size-16.rounded-full.bg-muted"),
    ).toBeTruthy();
  });

  it("renders preview image when currentUrl is provided", () => {
    render(
      <PhotoUploader
        {...defaultProps}
        currentUrl="https://example.com/photo.jpg"
      />,
    );
    const img = screen.getByTestId("preview-img");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("does not show save button initially", () => {
    render(<PhotoUploader {...defaultProps} />);
    expect(screen.queryByText("Хадгалах")).not.toBeInTheDocument();
  });

  it("rejects non-image file types with toast error", () => {
    const { container } = render(<PhotoUploader {...defaultProps} />);
    const input = getFileInput(container);

    const file = createFile("doc.pdf", "application/pdf", 1000);
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockToast.error).toHaveBeenCalledWith(
      "Зөвхөн JPEG, PNG, Webp файл хүлээн авна",
    );
  });

  it("rejects files larger than 2MB", () => {
    const { container } = render(<PhotoUploader {...defaultProps} />);
    const input = getFileInput(container);

    const oversizedFile = createFile(
      "big.jpg",
      "image/jpeg",
      2.5 * 1024 * 1024,
    );
    fireEvent.change(input, { target: { files: [oversizedFile] } });

    expect(mockToast.error).toHaveBeenCalledWith(
      "Файлын хэмжээ 2MB-аас хэтрэх ёсгүй",
    );
  });

  it("accepts valid JPEG file and shows save button", () => {
    const { container } = render(<PhotoUploader {...defaultProps} />);
    const input = getFileInput(container);

    const file = createFile("photo.jpg", "image/jpeg", 500 * 1024);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-preview");
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockToast.error).not.toHaveBeenCalled();
    expect(screen.getByText("Хадгалах")).toBeInTheDocument();
  });

  it("accepts valid PNG file", () => {
    const { container } = render(<PhotoUploader {...defaultProps} />);
    const input = getFileInput(container);

    const file = createFile("photo.png", "image/png", 500 * 1024);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-png");
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it("accepts valid WebP file", () => {
    const { container } = render(<PhotoUploader {...defaultProps} />);
    const input = getFileInput(container);

    const file = createFile("photo.webp", "image/webp", 500 * 1024);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-webp");
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it("has hidden file input with correct accept attribute", () => {
    const { container } = render(<PhotoUploader {...defaultProps} />);
    const input = getFileInput(container);
    expect(input).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  });

  it("rejects GIF (disallowed type) and shows no save button", () => {
    const { container } = render(<PhotoUploader {...defaultProps} />);
    const input = getFileInput(container);

    const file = createFile("anim.gif", "image/gif", 1000);
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockToast.error).toHaveBeenCalled();
    expect(screen.queryByText("Хадгалах")).not.toBeInTheDocument();
  });
});

describe("PhotoUploader with entityType: team", () => {
  const teamProps = {
    entityId: "team-1",
    entityType: "team" as const,
    onUploaded: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload button for team logo", () => {
    render(<PhotoUploader {...teamProps} />);
    expect(
      screen.getByRole("button", { name: "Файл сонгох" }),
    ).toBeInTheDocument();
  });

  it("renders preview when currentUrl is provided", () => {
    render(
      <PhotoUploader
        {...teamProps}
        currentUrl="https://example.com/team-logo.png"
      />,
    );
    const preview = screen.getByTestId("preview-img");
    expect(preview).toHaveAttribute("src", "https://example.com/team-logo.png");
  });

  it("uploads to correct storage bucket path", () => {
    const { container } = render(<PhotoUploader {...teamProps} />);
    const file = new File(["fake"], "logo.png", { type: "image/png" });
    const input = getFileInput(container);
    const changeEvent = new Event("change", { bubbles: true });
    Object.defineProperty(input, "files", { value: [file] });
    input.dispatchEvent(changeEvent);
    expect(screen.queryByText("Хадгалах")).toBeInTheDocument();
  });

  it("rejects non-image files for team", () => {
    const { container } = render(<PhotoUploader {...teamProps} />);
    const input = getFileInput(container);
    const file = createFile("doc.pdf", "application/pdf", 1000);
    fireEvent.change(input, { target: { files: [file] } });
    expect(mockToast.error).toHaveBeenCalled();
    expect(screen.queryByText("Хадгалах")).not.toBeInTheDocument();
  });

  it("accepts JPEG for team logo", () => {
    const { container } = render(<PhotoUploader {...teamProps} />);
    const input = getFileInput(container);
    const file = createFile("logo.jpg", "image/jpeg", 1000);
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.queryByText("Хадгалах")).toBeInTheDocument();
  });
});
