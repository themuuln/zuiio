import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nextConfig = require("eslint-config-next/core-web-vitals");

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      "prefer-const": "warn",
      "no-console": "off",
    },
  },
];

export default eslintConfig;
