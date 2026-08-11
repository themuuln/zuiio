import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorefrontAiChat } from "./ai-chat-widget";

const mockFetch = vi.fn();

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
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
    mockFetch.mockResolvedValue(jsonResponse(200, { reply }));

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

  it("sends a suggestion chip message when clicked", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(200, { reply: "Энд 3 ангилал байна." }),
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
});
