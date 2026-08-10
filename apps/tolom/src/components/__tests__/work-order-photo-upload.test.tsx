import { act, render, screen, waitFor } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkOrderPhotoUpload from "@/components/work-order-photo-upload";
import { reportServerError } from "@/lib/sentry-report-server";

const t = vi.hoisted(() => (key: string) => key);
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const mockMutateAsync = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: "att-1" }),
);
vi.mock("@/lib/queries/use-work-order-attachments", () => ({
  useCreateAttachment: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// The real dropzone accept filter would silently discard unsupported files
// before onDrop — mock it so the component's own validation branches run.
const dropzoneState = vi.hoisted(() => ({
  onDrop: null as null | ((accepted: File[]) => void),
}));
vi.mock("react-dropzone", () => ({
  useDropzone: ({ onDrop }: { onDrop: (accepted: File[]) => void }) => {
    dropzoneState.onDrop = onDrop;
    return {
      getRootProps: () => ({ className: "" }),
      getInputProps: () => ({ type: "file" }),
      isDragActive: false,
    };
  },
}));

const mockFetch = vi.fn();

function makeFile(name: string, type: string, size = 1000): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

async function dropFile(file: File) {
  await act(async () => {
    dropzoneState.onDrop?.([file]);
  });
}

function renderUpload() {
  render(<WorkOrderPhotoUpload orgId="org-1" workOrderId="wo-1" />);
}

describe("WorkOrderPhotoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("renders the attach button", () => {
    renderUpload();
    expect(screen.getByText("addPhoto")).toBeInTheDocument();
  });

  it("rejects oversized files without uploading", async () => {
    renderUpload();
    await dropFile(makeFile("big.jpg", "image/jpeg", 11 * 1024 * 1024));

    expect(toast.error).toHaveBeenCalledWith("fileTooLarge");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("rejects unsupported file types without uploading", async () => {
    renderUpload();
    await dropFile(makeFile("notes.txt", "text/plain"));

    expect(toast.error).toHaveBeenCalledWith("invalidFileType");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("uploads a photo and creates the attachment record", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { url: "https://cdn.example.com/photo.jpg" },
      }),
    });
    renderUpload();
    await dropFile(makeFile("photo.jpg", "image/jpeg"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        file_name: "photo.jpg",
        file_size: 1000,
        mime_type: "image/jpeg",
        storage_path: "https://cdn.example.com/photo.jpg",
        file_type: "photo",
      });
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/storage/upload",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });

  it("creates a document record for PDF uploads", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { url: "https://cdn.example.com/doc.pdf" } }),
    });
    renderUpload();
    await dropFile(makeFile("invoice.pdf", "application/pdf"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          file_type: "document",
          mime_type: "application/pdf",
        }),
      );
    });
  });

  it("shows the error toast and reports the failure when the upload API fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "Storage quota exceeded" } }),
    });
    renderUpload();
    await dropFile(makeFile("photo.jpg", "image/jpeg"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Storage quota exceeded");
    });
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
