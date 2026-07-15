/** Truncate text to maxLength, appending ellipsis if truncated. */
export function truncate(text: string, maxLength: number, suffix = "…"): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/** Capitalize first letter: "hello" → "Hello" */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Convert to camelCase: "hello-world" → "helloWorld", "hello_world" → "helloWorld" */
export function camelCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toLowerCase());
}

/** Convert to snake_case: "helloWorld" → "hello_world" */
export function snakeCase(text: string): string {
  return text
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
    .replace(/-/g, "_");
}

/** Convert to kebab-case: "helloWorld" → "hello-world" */
export function kebabCase(text: string): string {
  return snakeCase(text).replace(/_/g, "-");
}
