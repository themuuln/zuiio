import postcssFixParent from "./postcss-fix-parent.mjs";

const config = {
  plugins: ["@tailwindcss/postcss", postcssFixParent],
};

export default config;
