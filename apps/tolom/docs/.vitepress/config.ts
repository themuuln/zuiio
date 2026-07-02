import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-mermaid-viewer";
const sidebar = [
  {
    text: "Getting Started",
    items: [
      { text: "Installation", link: "/installation.html" },
      { text: "Quick Start", link: "/getting-started.html" },
    ],
  },
  {
    text: "Architecture",
    items: [{ text: "Overview", link: "/architecture.html" }],
  },
  { text: "Routes", items: [{ text: "Overview", link: "/routes/" }] },
  { text: "Components", items: [{ text: "Overview", link: "/components/" }] },
  { text: "API Reference", items: [{ text: "Overview", link: "/api/" }] },
  {
    text: "Deployment",
    items: [{ text: "Environment", link: "/deployment/environment.html" }],
  },
  { text: "Features", items: [{ text: "api", link: "/features/api.html" }] },
];
export default withMermaid(
  defineConfig({
    title: "tolom",
    description: "Documentation",
    lastUpdated: true,
    mermaid: { theme: "default" },
    themeConfig: {
      nav: [
        { text: "Home", link: "/" },
        { text: "Getting Started", link: "/getting-started.html" },
      ],
      sidebar: { "/": sidebar },
      socialLinks: [
        { icon: "github", link: "https://github.com/themuuln/tolom.git" },
      ],
      footer: {
        message: "Generated with Documentizer",
        copyright: "${new Date().getFullYear()} tolom",
      },
    },
  }),
);
