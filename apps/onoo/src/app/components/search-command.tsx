"use client";

import { Search, SearchX, Shield, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { Input } from "@/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResultPlayer {
  id: string;
  name: string;
  team: string | null;
  photo_url: string | null;
}

interface SearchResultTeam {
  slug: string;
  name: string;
  short_code: string | null;
}

interface SearchResult {
  players: SearchResultPlayer[];
  teams: SearchResultTeam[];
}

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ---------------------------------------------------------------------------
// SearchCommand
// ---------------------------------------------------------------------------

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, 250);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    fetch(`/api/search/quick?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: SearchResult) => {
        if (!controller.signal.aborted) {
          setResults(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }
        if (!controller.signal.aborted) {
          setResults(null);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to let dialog animation complete
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  const hasResults =
    results &&
    (results.players.length > 0 || results.teams.length > 0);

  const noResults =
    results &&
    debouncedQuery.length >= 2 &&
    results.players.length === 0 &&
    results.teams.length === 0;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && hasResults && results) {
        e.preventDefault();
        const firstPlayer = results.players[0];
        const firstTeam = results.teams[0];
        if (firstPlayer) {
          window.location.href = `/players/${firstPlayer.id}`;
        } else if (firstTeam) {
          window.location.href = `/teams/${firstTeam.slug}`;
        }
      }
    },
    [hasResults, results],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[10%] max-w-lg gap-0 overflow-hidden p-0 sm:top-[15%]"
        showCloseButton
      >
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="sr-only">Хайх</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Тоглогч эсвэл баг хайх..."
              className="border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
              aria-label="Тоглогч эсвэл баг хайх"
            />
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Loading state */}
          {loading && query.length >= 2 && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <span className="animate-pulse">Хайж байна...</span>
            </div>
          )}

          {/* Results */}
          {hasResults && !loading && (
            <div className="space-y-1">
              {/* Players section */}
              {results.players.length > 0 && (
                <div>
                  <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Тоглогчид
                  </p>
                  <ul role="listbox" aria-label="Тоглогчдын үр дүн">
                    {results.players.map((player) => (
                      <li key={player.id}>
                        <Link
                          href={`/players/${player.id}`}
                          onClick={() => onOpenChange(false)}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          role="option"
                        >
                          {player.photo_url ? (
                            <Image
                              src={player.photo_url}
                              alt=""
                              width={32}
                              height={32}
                              className="size-8 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                              <Users className="size-3.5" aria-hidden="true" />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {player.name}
                            </p>
                            {player.team && (
                              <p className="truncate text-xs text-muted-foreground">
                                {player.team}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Teams section */}
              {results.teams.length > 0 && (
                <div>
                  <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Багууд
                  </p>
                  <ul role="listbox" aria-label="Багуудын үр дүн">
                    {results.teams.map((team) => (
                      <li key={team.slug}>
                        <Link
                          href={`/teams/${team.slug}`}
                          onClick={() => onOpenChange(false)}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          role="option"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                            <Shield className="size-3.5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {team.name}
                            </p>
                            {team.short_code && (
                              <p className="truncate text-xs text-muted-foreground">
                                {team.short_code}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {noResults && !loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <SearchX className="size-8" aria-hidden="true" />
              <p>Илэрц олдсонгүй</p>
            </div>
          )}

          {/* Empty state — prompt */}
          {!results && query.length < 2 && !loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <p>Тоглогч эсвэл баг нэрээр хайна уу</p>
              <p className="text-xs">
                Дор хаяж 2 тэмдэгт бичнэ үү
              </p>
            </div>
          )}
        </div>

        {/* Keyboard hint footer */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <span className="mr-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</span>
          нэвтрэх
          <span className="mx-1.5">·</span>
          <span className="mr-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</span>
          хаах
        </div>
      </DialogContent>
    </Dialog>
  );
}
