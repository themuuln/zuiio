import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-mermaid-viewer";
const sidebar = [{"text":"Getting Started","items":[{"text":"Installation","link":"/installation.html"},{"text":"Quick Start","link":"/getting-started.html"}]},{"text":"Architecture","items":[{"text":"Overview","link":"/architecture.html"}]},{"text":"Routes","items":[{"text":"Overview","link":"/routes/"}]},{"text":"Components","items":[{"text":"Overview","link":"/components/"}]},{"text":"Deployment","items":[{"text":"Environment","link":"/deployment/environment.html"}]}];
export default withMermaid(
  defineConfig({
    title: "zer",
    description: "Documentation",
    lastUpdated: true,
    mermaid: { theme: "default" },
    themeConfig: {
      nav: [{ text: "Home", link: "/" }, { text: "Getting Started", link: "/getting-started.html" }],
      sidebar: { "/": sidebar },
      socialLinks: [{ icon: "github", link: "#" }],
      footer: { message: "Generated with Documentizer", copyright: "${new Date().getFullYear()} zer" },
    },
  })
);
