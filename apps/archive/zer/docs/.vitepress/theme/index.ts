import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout),
  enhanceApp: ({ app }) => {
    // Provide project theme data to components
    app.provide("doc-theme", {
      color: "#000000",
      framework: "Next.js",
      icon: "nextjs",
    });
  },
} satisfies Theme;
