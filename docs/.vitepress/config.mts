import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-mermaid-viewer";
const guideSidebar = {
  text: "Гарын авлага",
  collapsed: false,
  items: [
    {
      text: "Эхлэх",
      items: [
        { text: "Танилцуулга", link: "/guide/index.html" },
        { text: "Эхлэх заавар", link: "/guide/getting-started.html" },
        { text: "Түгээмэл асуултууд", link: "/guide/faq.html" },
      ],
    },
    {
      text: "Модулиуд",
      items: [
        { text: "Борлуулалт", link: "/guide/features/sales.html" },
        { text: "Худалдан авалт", link: "/guide/features/purchases.html" },
        { text: "Бараа материал", link: "/guide/features/inventory.html" },
        { text: "Санхүүгийн бүртгэл", link: "/guide/features/accounting.html" },
        { text: "Зарлага", link: "/guide/features/expenses.html" },
        { text: "Буцаалт", link: "/guide/features/returns.html" },
        { text: "Нэхэмжлэх", link: "/guide/features/invoices.html" },
        { text: "Үнийн санал", link: "/guide/features/quotations.html" },
        { text: "Хямдрал", link: "/guide/features/discounts.html" },
        { text: "Шимтгэл", link: "/guide/features/commissions.html" },
        { text: "Тайлан", link: "/guide/features/reports.html" },
        { text: "Дэлгүүр (POS)", link: "/guide/features/shop.html" },
        { text: "Тохиргоо", link: "/guide/features/settings.html" },
      ],
    },
  ],
};

const devSidebar = [
  {
    text: "Getting Started",
    items: [
      { text: "Quick Start", link: "/getting-started.html" },
      { text: "Configuration", link: "/configuration.html" },
    ],
  },
  {
    text: "Architecture",
    items: [
      { text: "Overview", link: "/architecture/index.html" },
      { text: "Project Structure", link: "/architecture/structure.html" },
      { text: "Data Flow", link: "/architecture/data-flow.html" },
    ],
  },
  {
    text: "Features",
    items: [{ text: "Overview", link: "/features/index.html" }],
  },
  { text: "Routes", items: [{ text: "All Routes", link: "/routes/" }] },
  {
    text: "Deployment",
    items: [
      { text: "Overview", link: "/deployment/index.html" },
      { text: "Docker", link: "/deployment/docker.html" },
    ],
  },
  {
    text: "Testing",
    items: [{ text: "Overview", link: "/testing/index.html" }],
  },
];
export default withMermaid(
  defineConfig({
    title: "zer",
    description: "Documentation",
    lastUpdated: true,
    mermaid: { theme: "default" },
    themeConfig: {
      nav: [
        { text: "Home", link: "/" },
        { text: "Гарын авлага", link: "/guide/" },
        { text: "Getting Started", link: "/getting-started.html" },
      ],
      sidebar: {
        "/": devSidebar,
        "/guide/": [guideSidebar],
      },
      socialLinks: [{ icon: "github", link: "#" }],
      footer: {
        message: "Generated with Documentizer",
        copyright: "${new Date().getFullYear()} zer",
      },
    },
  }),
);
