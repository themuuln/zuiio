"use client";

import {
  ChevronRight,
  Gamepad2,
  ScrollText,
  Search,
  SearchX,
  Shield,
  Star,
  Trophy,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlayerAvatar } from "@/components/player-avatar";
import { Kbd } from "@/components/ui/kbd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/ui";

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
// Quick link type for empty state
// ---------------------------------------------------------------------------

interface QuickLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const QUICK_LINKS: QuickLink[] = [
  {
    href: "/games",
    label: "Тоглолтууд",
    icon: <Gamepad2 className="size-4" aria-hidden="true" />,
  },
  {
    href: "/players",
    label: "Тоглогчид",
    icon: <Users className="size-4" aria-hidden="true" />,
  },
  {
    href: "/standings",
    label: "Шалгуур",
    icon: <ScrollText className="size-4" aria-hidden="true" />,
  },
  {
    href: "/leaders",
    label: "Тэргүүлэгчид",
    icon: <Star className="size-4" aria-hidden="true" />,
  },
  {
    href: "/teams",
    label: "Багууд",
    icon: <Shield className="size-4" aria-hidden="true" />,
  },
  {
    href: "/academy",
    label: "Академи",
    icon: <Trophy className="size-4" aria-hidden="true" />,
  },
];

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
// Highlight matching text
// ---------------------------------------------------------------------------

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim() || query.length < 2) {
    return <>{text}</>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  if (parts.length === 1) return <>{text}</>;

  // parts are stable-ordered substrings from a single split — index is the correct key
  // biome-ignore lint/suspicious/noArrayIndexKey: see above
  const rendered = parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={`${i}-${part}`}
        className="rounded-sm bg-[var(--brand-sports)]/20 text-[var(--brand-sports)] font-semibold"
      >
        {part}
      </mark>
    ) : (
      <span key={`${i}-${part}`}>{part}</span>
    ),
  );

  return <>{rendered}</>;
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const itemRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());

  const debouncedQuery = useDebounce(query, 250);

  // Build flat items array for keyboard navigation
  const flatItems = (() => {
    if (!results) return [];
    const items: Array<{
      type: "player" | "team";
      href: string;
      id: string;
    }> = [];
    for (const p of results.players) {
      items.push({ type: "player", href: `/players/${p.id}`, id: p.id });
    }
    for (const t of results.teams) {
      items.push({ type: "team", href: `/teams/${t.slug}`, id: t.slug });
    }
    return items;
  })();

  const hasResults =
    results && (results.players.length > 0 || results.teams.length > 0);

  const noResults =
    results &&
    debouncedQuery.length >= 2 &&
    results.players.length === 0 &&
    results.teams.length === 0;

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      setSelectedIndex(-1);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSelectedIndex(-1);

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
        if (err instanceof DOMException && err.name === "AbortError") {
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
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      setSelectedIndex(-1);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0) {
      const el = itemRefs.current.get(selectedIndex);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Navigate to selected item
  const navigateToSelected = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
      const item = flatItems[selectedIndex];
      if (item) {
        window.location.href = item.href;
      }
    } else if (hasResults && results) {
      // Fall back to first result
      const firstPlayer = results.players[0];
      const firstTeam = results.teams[0];
      if (firstPlayer) {
        window.location.href = `/players/${firstPlayer.id}`;
      } else if (firstTeam) {
        window.location.href = `/teams/${firstTeam.slug}`;
      }
    }
  }, [selectedIndex, flatItems, hasResults, results]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setSelectedIndex((prev) => {
            if (flatItems.length === 0) return -1;
            return prev < flatItems.length - 1 ? prev + 1 : 0;
          });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setSelectedIndex((prev) => {
            if (flatItems.length === 0) return -1;
            return prev > 0 ? prev - 1 : flatItems.length - 1;
          });
          break;
        }
        case "Enter": {
          e.preventDefault();
          navigateToSelected();
          break;
        }
      }
    },
    [flatItems.length, navigateToSelected],
  );

  // Mouse enter => update selected index
  const handleItemMouseEnter = useCallback(
    (index: number) => {
      setSelectedIndex(index);
    },
    [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[10%] max-w-lg gap-0 overflow-hidden p-0 sm:top-[15%]"
        showCloseButton={false}
      >
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="sr-only">Хайх</DialogTitle>
          <div className="flex items-center gap-3">
            <Search
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Тоглогч, баг эсвэл командаар хайх..."
              className="border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
              aria-label="Тоглогч эсвэл баг хайх"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults(null);
                  setSelectedIndex(-1);
                  inputRef.current?.focus();
                }}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Хайлтыг цэвэрлэх"
              >
                <SearchX className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div
          ref={resultsRef}
          className="max-h-[55vh] overflow-y-auto overscroll-contain"
        >
          {/* Loading state */}
          {loading && query.length >= 2 && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              <span className="animate-pulse">Хайж байна...</span>
            </div>
          )}

          {/* Results */}
          {hasResults && !loading && (
            <div className="p-1.5">
              {/* Players section */}
              {results.players.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <User className="size-3" aria-hidden="true" />
                    <span>Тоглогчид</span>
                    <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-muted-foreground/60">
                      {results.players.length}
                    </span>
                  </div>
                  <ul aria-label="Тоглогчдын үр дүн">
                    {results.players.map((player, idx) => {
                      const flatIdx = idx;
                      return (
                        <li key={player.id}>
                          <Link
                            ref={(el) => {
                              if (el)
                                itemRefs.current.set(flatIdx, el as HTMLAnchorElement);
                              else itemRefs.current.delete(flatIdx);
                            }}
                            href={`/players/${player.id}`}
                            onClick={() => onOpenChange(false)}
                            onMouseEnter={() => handleItemMouseEnter(flatIdx)}
                            data-selected={
                              selectedIndex === flatIdx ? true : undefined
                            }
                            className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected]:bg-[var(--brand-sports)]/12 data-[selected]:text-[var(--brand-sports)] data-[selected]:font-medium"
                            role="option"
                            aria-selected={selectedIndex === flatIdx}
                          >
                            <PlayerAvatar
                              photoUrl={player.photo_url}
                              name={player.name}
                              primaryColor="#1e293b"
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate">
                                <HighlightMatch
                                  text={player.name}
                                  query={debouncedQuery}
                                />
                              </p>
                              {player.team && (
                                <p className="truncate text-xs text-muted-foreground">
                                  <HighlightMatch
                                    text={player.team}
                                    query={debouncedQuery}
                                  />
                                </p>
                              )}
                            </div>
                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 data-[selected]:text-[var(--brand-sports)]/40" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Section separator */}
              {results.players.length > 0 && results.teams.length > 0 && (
                <div
                  className="my-1 ml-12 h-px bg-border/50"
                  aria-hidden="true"
                />
              )}

              {/* Teams section */}
              {results.teams.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Shield className="size-3" aria-hidden="true" />
                    <span>Багууд</span>
                    <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-muted-foreground/60">
                      {results.teams.length}
                    </span>
                  </div>
                  <ul aria-label="Багуудын үр дүн">
                    {results.teams.map((team, idx) => {
                      const flatIdx = results.players.length + idx;
                      return (
                        <li key={team.slug}>
                          <Link
                            ref={(el) => {
                              if (el)
                                itemRefs.current.set(
                                  flatIdx,
                                  el as HTMLAnchorElement,
                                );
                              else itemRefs.current.delete(flatIdx);
                            }}
                            href={`/teams/${team.slug}`}
                            onClick={() => onOpenChange(false)}
                            onMouseEnter={() =>
                              handleItemMouseEnter(flatIdx)
                            }
                            data-selected={
                              selectedIndex === flatIdx ? true : undefined
                            }
                            className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected]:bg-[var(--brand-sports)]/12 data-[selected]:text-[var(--brand-sports)] data-[selected]:font-medium"
                            role="option"
                            aria-selected={selectedIndex === flatIdx}
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-border">
                              <Shield
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate">
                                <HighlightMatch
                                  text={team.name}
                                  query={debouncedQuery}
                                />
                              </p>
                              {team.short_code && (
                                <p className="truncate text-xs text-muted-foreground">
                                  <HighlightMatch
                                    text={team.short_code}
                                    query={debouncedQuery}
                                  />
                                </p>
                              )}
                            </div>
                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 data-[selected]:text-[var(--brand-sports)]/40" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {noResults && !loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <SearchX className="size-8 text-muted-foreground/40" aria-hidden="true" />
              <p>Илэрц олдсонгүй</p>
              <p className="text-xs text-muted-foreground/60">
                &ldquo;{debouncedQuery}&rdquo; тоглогч эсвэл баг олдсонгүй
              </p>
            </div>
          )}

          {/* Empty state — prompt + quick links */}
          {!results && query.length < 2 && !loading && (
            <div className="px-3 py-4">
              <p className="text-center text-sm text-muted-foreground">
                Тоглогч эсвэл баг нэрээр хайна уу
              </p>
              <p className="mt-0.5 text-center text-xs text-muted-foreground/60">
                Дор хаяж 2 тэмдэгт бичнэ үү
              </p>

              <ul
                className="mx-auto mt-5 grid grid-cols-2 gap-1.5"
                aria-label="Түргэн холбоос"
              >
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="text-muted-foreground/70">
                        {link.icon}
                      </span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Keyboard hint footer */}
        <div className="flex items-center justify-between border-t px-4 py-2.5">
          <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
            {flatItems.length > 0 ? (
              <>
                <span className="flex items-center gap-1">
                  <Kbd>↑↓</Kbd>
                  шилжих
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>↵</Kbd>
                  нэвтрэх
                </span>
              </>
            ) : (
              <span />
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
            <Kbd>
              <abbr title="Command">⌘</abbr>K
            </Kbd>
            хаах
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
