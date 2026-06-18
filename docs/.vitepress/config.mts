import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-mermaid-viewer";
const sidebar = [
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
        { text: "Getting Started", link: "/getting-started.html" },
      ],
      sidebar: { "/": sidebar },
      socialLinks: [{ icon: "github", link: "#" }],
      footer: {
        message: "Generated with Documentizer",
        copyright: "${new Date().getFullYear()} zer",
      },
    },
  }),
);
