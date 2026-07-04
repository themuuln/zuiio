import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-mermaid-viewer";
const sidebar = [{"text":"Getting Started","items":[{"text":"Installation","link":"/installation.html"},{"text":"Quick Start","link":"/getting-started.html"}]},{"text":"Architecture","items":[{"text":"Overview","link":"/architecture.html"},{"text":"Project Structure","link":"/architecture/structure.html"},{"text":"State Management","link":"/architecture/state-management.html"},{"text":"Navigation","link":"/architecture/navigation.html"}]},{"text":"Data Layer","items":[{"text":"Models","link":"/data-layer/models.html"},{"text":"Repositories","link":"/data-layer/repositories.html"},{"text":"Data Sources","link":"/data-layer/data-sources.html"}]},{"text":"Testing","items":[{"text":"Testing","link":"/testing/"}]},{"text":"Deployment","items":[{"text":"Build & Release","link":"/deployment/build.html"}]}];
export default withMermaid(
  defineConfig({
    title: "tamga-docs",
    description: "Documentation",
    lastUpdated: true,
    mermaid: { theme: "default" },
    themeConfig: {
      nav: [{ text: "Home", link: "/" }, { text: "Getting Started", link: "/getting-started.html" }],
      sidebar: { "/": sidebar },
      socialLinks: [{ icon: "github", link: "https://github.com/themuuln/tamga.git" }],
      footer: { message: "Generated with Documentizer", copyright: "${new Date().getFullYear()} tamga-docs" },
    },
  })
);
