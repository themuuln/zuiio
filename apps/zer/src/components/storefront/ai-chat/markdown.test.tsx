import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownText } from "./markdown";

function renderMd(text: string) {
  const { container } = render(<MarkdownText text={text} />);
  return container;
}

describe("MarkdownText", () => {
  it("renders bold text without literal asterisks", () => {
    const container = renderMd("**Шампунь** санал болгож байна");

    expect(container.querySelector("strong")?.textContent).toBe("Шампунь");
    expect(container.textContent).not.toContain("**");
    expect(screen.getByText(/санал болгож байна/)).toBeInTheDocument();
  });

  it("renders italic and inline code", () => {
    const container = renderMd("*зөөлөн* найрлага, `sku-123` код");

    expect(container.querySelector("em")?.textContent).toBe("зөөлөн");
    expect(container.querySelector("code")?.textContent).toBe("sku-123");
    expect(container.textContent).not.toContain("*зөөлөн*");
    expect(container.textContent).not.toContain("`sku-123`");
  });

  it("renders a markdown link as an anchor", () => {
    const container = renderMd("[Дэлгэрэнгүй](https://bujin.mn/p/1)");

    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "https://bujin.mn/p/1");
    expect(link?.textContent).toBe("Дэлгэрэнгүй");
  });

  it("does not link javascript: markdown links", () => {
    const container = renderMd("[холбоос](javascript:alert(1))");

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("javascript:alert(1)");
  });

  it("linkifies bare http(s) URLs", () => {
    const container = renderMd("Дэлгэрэнгүй: https://bujin.mn/p/1");

    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "https://bujin.mn/p/1");
    expect(link?.textContent).toBe("https://bujin.mn/p/1");
  });

  it("escapes HTML instead of executing it", () => {
    const container = renderMd("<script>alert(1)</script> бүтээгдэхүүн");

    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });

  it("renders bullet lists", () => {
    const container = renderMd("- Үсний арчилгаа\n- Биеийн арчилгаа");

    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("ul")).not.toBeNull();
    expect(container.textContent).not.toContain("- Үсний арчилгаа");
  });

  it("renders ordered lists with indented continuation lines", () => {
    const container = renderMd(
      "1. **Kerasys Шампунь** – Тодорхойлолт\n   Дэлгэрэнгүй: https://bujin.mn/p/1\n2. **Ecopure** – Тодорхойлолт",
    );

    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(2);
    expect(container.querySelector("ol")).not.toBeNull();
    expect(items[0]?.querySelector("strong")?.textContent).toBe(
      "Kerasys Шампунь",
    );
    const link = items[0]?.querySelector("a");
    expect(link).toHaveAttribute("href", "https://bujin.mn/p/1");
    expect(container.textContent).not.toContain("1.");
    expect(container.textContent).not.toContain("2.");
  });

  it("renders headings", () => {
    const container = renderMd("## Шампунь\n\nМэдээлэл");

    expect(container.querySelector("h3")?.textContent).toBe("Шампунь");
    expect(container.querySelector("p")?.textContent).toBe("Мэдээлэл");
  });

  it("renders the real assistant reply without raw markdown syntax", () => {
    const reply = `Таны хэрэгцээнд тохирох бүтээгдэхүүн санал болгохын тулд манай каталогийн хэдэн алдартай бүтээгдэхүүнийг танилцуулъя. 🛍️

**Манай дэлгүүрээс санал болгох бүтээгдэхүүнүүд:**

**🧴 Шампунь**
1. **Kerasys Cherry Blossom Шампунь 1.5л** – Том савлагаатай, үсэд зөөлөн тусламж үзүүлэх алдартай шампунь.
   Дэлгэрэнгүй: https://bujin.mn/bujin-beauty/products/728a6557-f996-41a5-be8a-e23b17d01db2
2. **Ecopure Шампунь** – Байгалийн гаралтай, зөөлөн найрлагатай.
   Дэлгэрэнгүй: https://bujin.mn/bujin-beauty/products/5b93532a-a6ca-48b3-8a78-b3ac191273eb

📋 Манай дэлгүүрт нийт **20 бүтээгдэхүүн** байгаа бөгөөд Шампунь, Кондиционер, Биеийн арчилгаа гэсэн ангиллаар хуваагддаг.

Та ямар төрлийн бүтээгдэхүүн сонирхож байна вэ? Тухайлбал:
- Үсний арчилгаа (шампунь/кондиционер) уу?
- Биеийн арчилгаа уу?`;

    const container = renderMd(reply);

    expect(container.textContent).not.toContain("**");
    expect(container.textContent).not.toContain("1. **");
    expect(container.textContent).not.toContain("2. **");
    expect(container.querySelectorAll("li")).toHaveLength(4);
    expect(container.querySelectorAll("a")).toHaveLength(2);
    expect(container.querySelector("a")).toHaveAttribute(
      "href",
      "https://bujin.mn/bujin-beauty/products/728a6557-f996-41a5-be8a-e23b17d01db2",
    );
  });
});
