import { afterEach, describe, expect, it, vi } from "vitest";
import { playReadyNotification } from "./ready-notification";

describe("playReadyNotification", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing during server rendering", () => {
    expect(() => playReadyNotification()).not.toThrow();
  });

  it("plays and closes a short two-tone notification in the browser", () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const oscillator = {
      type: "",
      frequency: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn((event: string, callback: () => void) => {
        if (event === "ended") callback();
      }),
    };
    const gain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    const context = {
      currentTime: 10,
      destination: {},
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gain),
      resume: vi.fn().mockResolvedValue(undefined),
      close,
    };
    const AudioContext = vi.fn(function MockAudioContext() {
      return context;
    });
    vi.stubGlobal("window", { AudioContext });

    playReadyNotification();

    expect(AudioContext).toHaveBeenCalledOnce();
    expect(oscillator.start).toHaveBeenCalledWith(10);
    expect(oscillator.stop).toHaveBeenCalledWith(10.35);
    expect(close).toHaveBeenCalledOnce();
  });
});
