// Mock for server-only — prevents Next.js server-only guard from breaking
// vitest/jsdom tests that import server modules (qpay, etc.)
const noop = {};
export default noop;
