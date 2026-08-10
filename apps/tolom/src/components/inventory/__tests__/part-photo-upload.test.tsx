import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PartPhotoUpload from "@/components/inventory/part-photo-upload";
import { reportServerError } from "@/lib/sentry-report-server";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("heic2any", () => ({
  default: vi
    .fn()
    .mockResolvedValue(new Blob(["heic-converted"], { type: "image/jpeg" })),
}));

const mockFetch = vi.fn();

// jsdom never loads images — fake Image that fires onload when src is set
class MockImage {
  private _src = "";
  width = 0;
  height = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(value: string) {
    this._src = value;
    this.width = 100;
    this.height = 100;
    queueMicrotask(() => this.onload?.());
  }
  get src() {
    return this._src;
  }
}

function makeJpegFile(name = "photo.jpg", size = 1000): File {
  return new File([new ArrayBuffer(size)], name, { type: "image/jpeg" });
}

function cameraInput(): HTMLInputElement {
  const input = document.querySelector(
    'input[type="file"][capture="environment"]',
  );
  if (!input) throw new Error("Expected camera file input in DOM");
  return input as HTMLInputElement;
}

function renderUpload(
  props: Partial<{
    orgId: string;
    partId: string;
    imageUrl: string | null;
    readOnly: boolean;
  }> = {},
) {
  const onImageChange = vi.fn();
  render(
    <PartPhotoUpload
      orgId="org-1"
      partId="part-1"
      imageUrl={null}
      onImageChange={onImageChange}
      {...props}
    />,
  );
  return onImageChange;
}

describe("PartPhotoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("Image", MockImage);
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      writable: true,
      value: vi.fn(() => ({ drawImage: vi.fn() })),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      writable: true,
      value: vi.fn((cb: BlobCallback) =>
        cb(new Blob(["x"], { type: "image/jpeg" })),
      ),
    });
  });

  it("shows placeholder camera icon when no image", () => {
    renderUpload();
    expect(screen.queryByAltText("Part")).not.toBeInTheDocument();
    expect(screen.getByText("Зураг авах")).toBeInTheDocument();
  });

  it("renders the image when imageUrl is provided", () => {
    renderUpload({ imageUrl: "https://cdn.example.com/photo.jpg" });
    const img = screen.getByAltText("Part") as HTMLImageElement;
    expect(img.src).toContain("photo.jpg");
  });

  it("rejects unsupported file types without uploading", async () => {
    const onImageChange = renderUpload();
    const file = new File(["plain"], "notes.txt", { type: "text/plain" });

    await act(async () => {
      fireEvent.change(cameraInput(), { target: { files: [file] } });
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Зөвхөн JPEG, PNG, WebP, HEIC зураг ашиглах боломжтой",
    );
    expect(mockFetch).not.toHaveBeenCalled();
    expect(onImageChange).not.toHaveBeenCalled();
  });

  it("uploads a selected file and calls onImageChange with the returned URL", async () => {
    const onImageChange = renderUpload();
    const file = makeJpegFile();

    let resolveFetch!: (value: {
      ok: boolean;
      json: () => Promise<{ data: { url: string } }>;
    }) => void;
    mockFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    await act(async () => {
      fireEvent.change(cameraInput(), { target: { files: [file] } });
    });

    // Upload in progress — busy state shown
    expect(screen.getByText("Ачаалж байна...")).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalled();

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({
          data: { url: "https://cdn.example.com/photo.jpg" },
        }),
      });
    });

    await waitFor(() => {
      expect(onImageChange).toHaveBeenCalledWith(
        "https://cdn.example.com/photo.jpg",
      );
    });
    expect(toast.success).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/storage/upload",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });

  it("shows error toast and reports the failure when upload fails", async () => {
    const onImageChange = renderUpload();
    const file = makeJpegFile();
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "Storage quota exceeded" } }),
    });

    await act(async () => {
      fireEvent.change(cameraInput(), { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Storage quota exceeded");
    });
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
    expect(onImageChange).not.toHaveBeenCalled();
  });

  it("converts HEIC files to JPEG before upload", async () => {
    const onImageChange = renderUpload();
    const file = new File([new ArrayBuffer(1000)], "photo.heic", {
      type: "image/heic",
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { url: "https://cdn.example.com/heic.jpg" } }),
    });

    await act(async () => {
      fireEvent.change(cameraInput(), { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(onImageChange).toHaveBeenCalledWith(
        "https://cdn.example.com/heic.jpg",
      );
    });
    const heic2any = (await import("heic2any")).default as ReturnType<
      typeof vi.fn
    >;
    expect(heic2any).toHaveBeenCalledWith(
      expect.objectContaining({ blob: file, toType: "image/jpeg" }),
    );
  });

  it("removes the image and calls onImageChange(null)", async () => {
    const onImageChange = renderUpload({
      imageUrl: "https://cdn.example.com/photo.jpg",
    });
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await act(async () => {
      fireEvent.click(screen.getByText("Устгах"));
    });

    await waitFor(() => {
      expect(onImageChange).toHaveBeenCalledWith(null);
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/storage/object?key="),
      { method: "DELETE" },
    );
    const { toast } = await import("sonner");
    expect(toast.success).toHaveBeenCalledWith("Зураг устгагдлаа");
  });

  it("hides action buttons in readOnly mode", () => {
    renderUpload({
      imageUrl: "https://cdn.example.com/photo.jpg",
      readOnly: true,
    });
    expect(screen.queryByText("Зураг авах")).not.toBeInTheDocument();
    expect(screen.queryByText("Устгах")).not.toBeInTheDocument();
  });
});
