import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorefrontAiChat } from "./ai-chat-widget";

const mockFetch = vi.fn();

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body,
  };
}

function sseResponse(chunks: string[], reply: string) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`),
        );
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ done: true, reply })}\n\n`),
      );
      controller.close();
    },
  });
  return {
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "text/event-stream" }),
    body,
    json: async () => ({ reply }),
  };
}

function sseErrorResponse(error: string) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ error })}\n\n`),
      );
      controller.close();
    },
  });
  return {
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "text/event-stream" }),
    body,
    json: async () => ({ error }),
  };
}

describe("StorefrontAiChat", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function openWidget() {
    render(<StorefrontAiChat slug="storefront-e2e-test" orgName="Shop" />);
    fireEvent.click(screen.getByRole("button", { name: "AI туслах чат нээх" }));
  }

  it("opens the dialog with welcome text and suggestions", () => {
    openWidget();
    expect(
      screen.getByRole("dialog", { name: "AI туслах" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Сайн байна уу/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Бүтээгдэхүүн санал болго/ }),
    ).toBeInTheDocument();
  });

  it("closes the dialog when the launcher is clicked again", () => {
    openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: "AI туслах чатыг хаах" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "AI туслах" }),
    ).not.toBeInTheDocument();
  });

  it("sends the message and renders the reply with a clickable product link", async () => {
    const reply =
      "Танд 2 утас байна.\nДэлгэрэнгүй: https://shop.example.mn/storefront-e2e-test/products/p-1";
    mockFetch.mockResolvedValue(
      sseResponse(
        [
          "Танд 2 утас байна.\nДэлгэрэнгүй: ",
          "https://shop.example.mn/storefront-e2e-test/products/p-1",
        ],
        reply,
      ),
    );

    openWidget();
    fireEvent.change(screen.getByLabelText("Мессеж"), {
      target: { value: "Утас байна уу?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Илгээх" }));

    expect(await screen.findByText("Утас байна уу?")).toBeInTheDocument();
    expect(await screen.findByText(/Танд 2 утас байна/)).toBeInTheDocument();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://shop.example.mn/storefront-e2e-test/products/p-1",
    );

    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.slug).toBe("storefront-e2e-test");
    expect(body.messages.at(-1).content).toBe("Утас байна уу?");
    expect(body.baseUrl).toBe("http://localhost:3000");
  });

  it("shows the error message from a mid-stream error event", async () => {
    mockFetch.mockResolvedValue(
      sseErrorResponse(
        "Хэт олон хүсэлт илгээсэн байна. Түр хүлээгээд дахин оролдоно уу.",
      ),
    );

    openWidget();
    fireEvent.change(screen.getByLabelText("Мессеж"), {
      target: { value: "Утас байна уу?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Илгээх" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Хэт олон хүсэлт илгээсэн байна.");
    // The user message stays visible even though the reply failed.
    expect(screen.getByText("Утас байна уу?")).toBeInTheDocument();
  });

  it("sends a suggestion chip message when clicked", async () => {
    mockFetch.mockResolvedValue(
      sseResponse(["Энд 3 ангилал байна."], "Энд 3 ангилал байна."),
    );

    openWidget();
    fireEvent.click(
      screen.getByRole("button", { name: /Хямдралтай бүтээгдэхүүн байна уу/ }),
    );

    expect(await screen.findByText(/Энд 3 ангилал байна/)).toBeInTheDocument();
    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.messages.at(-1).content).toBe(
      "Хямдралтай бүтээгдэхүүн байна уу?",
    );
  });

  it("shows the config error message on 503", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(503, { error: "AI туслах тохиргоогүй байна." }),
    );

    openWidget();
    fireEvent.change(screen.getByLabelText("Мессеж"), {
      target: { value: "Утас байна уу?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Илгээх" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("AI туслах тохиргоогүй байна.");
    // The user message stays visible even though the reply failed.
    expect(screen.getByText("Утас байна уу?")).toBeInTheDocument();
  });

  it("shows a generic error on a failed request", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    openWidget();
    fireEvent.change(screen.getByLabelText("Мессеж"), {
      target: { value: "Сайн уу?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Илгээх" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Хариулт авахад алдаа гарлаа. Дахин оролдоно уу.",
    );
  });

  it("renders a markdown reply without raw syntax characters", async () => {
    const reply =
      "**Шампунь**\n1. **Kerasys Шампунь** – Тодорхойлолт\n   Дэлгэрэнгүй: https://shop.example.mn/storefront-e2e-test/products/p-1";
    mockFetch.mockResolvedValue(
      sseResponse(
        [
          "**Шампунь**\n1. **Kerasys Шампунь** – Тодорхойлолт\n   Дэлгэрэнгүй: ",
          "https://shop.example.mn/storefront-e2e-test/products/p-1",
        ],
        reply,
      ),
    );

    openWidget();
    fireEvent.change(screen.getByLabelText("Мессеж"), {
      target: { value: "Шампунь санал болго" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Илгээх" }));

    const bold = await screen.findByText("Шампунь");
    expect(bold.tagName).toBe("STRONG");
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://shop.example.mn/storefront-e2e-test/products/p-1",
    );
  });

  it("aborts the in-flight request when the widget unmounts", async () => {
    const signals: (AbortSignal | undefined)[] = [];
    mockFetch.mockImplementation(
      (_url: string, init?: { signal?: AbortSignal }) => {
        signals.push(init?.signal);
        return new Promise(() => {}); // never resolves
      },
    );

    const { unmount } = render(
      <StorefrontAiChat slug="storefront-e2e-test" orgName="Shop" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "AI туслах чат нээх" }));
    fireEvent.change(screen.getByLabelText("Мессеж"), {
      target: { value: "Сайн уу?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Илгээх" }));

    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(signals[0]?.aborted).toBe(false);

    unmount();
    expect(signals[0]?.aborted).toBe(true);
  });

  it("treats an AbortError as a cancellation, not a failure", async () => {
    mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    openWidget();
    fireEvent.change(screen.getByLabelText("Мессеж"), {
      target: { value: "Сайн уу?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Илгээх" }));

    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders tokens progressively while the stream is in flight", async () => {
    const encoder = new TextEncoder();
    const reply = "Эхний хэсэг";
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ token: "Эхний " })}\n\n`),
        );
        await new Promise((r) => setTimeout(r, 60));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ token: "хэсэг" })}\n\n`),
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, reply })}\n\n`),
        );
        controller.close();
      },
    });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/event-stream" }),
      body,
      json: async () => ({ reply }),
    });

    openWidget();
    fireEvent.change(screen.getByLabelText("Мессеж"), {
      target: { value: "Сайн уу?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Илгээх" }));

    // First token renders before the stream completes.
    const partial = await screen.findByText("Эхний");
    expect(partial.textContent).toBe("Эхний");
    expect(screen.queryByText("Эхний хэсэг")).not.toBeInTheDocument();

    // Completed reply lands in the message list.
    expect(await screen.findByText("Эхний хэсэг")).toBeInTheDocument();
  });
});
