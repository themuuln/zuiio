/**
 * PostCSS plugin that replaces the `:parent` pseudo-class with `:has(*)`
 * in generated CSS. `:parent` is not a valid CSS pseudo-class and causes
 * lightningcss parsing errors in Next.js/Turbopack.
 */
export default function postcssFixParent() {
  return {
    postcssPlugin: "postcss-fix-parent",
    OnceExit(root) {
      root.walkRules((rule) => {
        if (rule.selector && rule.selector.includes(":parent")) {
          rule.selector = rule.selector.replace(/:parent(?=[\s>~+:[#.])/g, ":has(*)");
        }
      });
    },
  };
}
postcssFixParent.postcss = true;
