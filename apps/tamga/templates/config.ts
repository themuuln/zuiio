import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-mermaid-viewer";

export default withMermaid(
  defineConfig({
    title: "{{PROJECT_NAME}}",
    description: "Documentation",
    lastUpdated: true,
    // ❌ Do NOT use cleanUrls — breaks sidebar active link highlighting

    // Mermaid config
    mermaid: {
      theme: "default",
    },

    themeConfig: {
      // Use .html extensions in ALL sidebar links
      sidebar: {
        "/": [
          {
            text: "Introduction",
            items: [
              { text: "Home", link: "/" },
              { text: "Getting Started", link: "/getting-started.html" },
            ],
          },
          {
            text: "Architecture",
            items: [
              { text: "Overview", link: "/architecture.html" },
            ],
          },
          {
            text: "Features",
            items: [
              { text: "Overview", link: "/features/" },
            ],
          },
          {
            text: "API Reference",
            items: [
              { text: "Overview", link: "/api/" },
            ],
          },
        ],
      },
    },
  })
);
