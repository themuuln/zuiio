import "@testing-library/jest-dom/vitest";

// Mock navigator.sendBeacon for ViewBeacon component tests
Object.defineProperty(navigator, "sendBeacon", {
  value: vi.fn().mockReturnValue(true),
  writable: true,
  configurable: true,
});
