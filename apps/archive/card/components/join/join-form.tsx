"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DISPLAY_NAME_MIN_LENGTH, DISPLAY_NAME_MAX_LENGTH } from "@/lib/constants";

interface JoinFormProps {
  roomCode: string;
}

export function JoinForm({ roomCode }: JoinFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-focus the input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const validateClientSide = useCallback(
    (name: string): string | null => {
      const trimmed = name.trim();

      if (trimmed.length === 0) {
        return "Display name is required";
      }

      if (trimmed.length < DISPLAY_NAME_MIN_LENGTH) {
        return `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters`;
      }

      if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
        return `Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters`;
      }

      // Check for whitespace-only
      if (name.trim().length === 0) {
        return "Display name cannot be only whitespace";
      }

      return null;
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // Client-side validation
      const validationError = validateClientSide(displayName);
      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(`/api/rooms/${roomCode}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: displayName.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to join room");
          setLoading(false);
          return;
        }

        // Successful join — reload the page to trigger lobby display
        window.location.reload();
      } catch {
        setError("Failed to connect. Please try again.");
        setLoading(false);
      }
    },
    [displayName, roomCode, validateClientSide]
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Join Room</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your name to join <span className="font-mono font-bold">{roomCode}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="display-name" className="sr-only">
              Display name
            </label>
            <input
              ref={inputRef}
              id="display-name"
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError(null);
              }}
              maxLength={DISPLAY_NAME_MAX_LENGTH + 10} // allow a bit more for typing
              disabled={loading}
              className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              {DISPLAY_NAME_MIN_LENGTH}–{DISPLAY_NAME_MAX_LENGTH} characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Joining...
              </span>
            ) : (
              "Join"
            )}
          </button>

          {error && (
            <p className="text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
