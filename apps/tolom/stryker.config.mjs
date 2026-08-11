/**
 * Stryker mutation-testing config — scoped trial on the @zuiio/core
 * validation layer (the functions behind Mongolian plate/phone/VIN/currency
 * handling). Answers: "would our tests catch a bug injected here?"
 *
 * Run: pnpm test:mutation
 * Full report: reports/mutation/index.html
 */
export default {
  testRunner: "vitest",
  // pnpm's strict node_modules layout defeats plugin auto-discovery — load
  // the vitest runner explicitly.
  plugins: ["@stryker-mutator/vitest-runner"],
  mutate: ["src/lib/zuiio/core.ts"],
  // Oracle: the property-based tests assert invariants, not examples — a
  // mutant that example tests miss usually breaks an invariant.
  testFiles: ["src/lib/__tests__/validators-property.test.ts"],
  // inPlace skips the sandbox tsconfig preprocessor, which crashes under the
  // repo's TypeScript 7 (parseConfigFileTextToJson was removed).
  inPlace: true,
  concurrency: 4,
  reporters: ["clear-text", "progress", "html"],
  htmlReporter: { fileName: "reports/mutation/index.html" },
  coverageAnalysis: "all",
  disableTypeChecks: true,
};
