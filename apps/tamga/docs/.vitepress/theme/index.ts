import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout),
  enhanceApp: ({ app }) => {
    // Provide project theme data to components
    app.provide("doc-theme", {
      color: "#02569B",
      framework: "Flutter",
      icon: "flutter",
    });
  },
} satisfies Theme;
