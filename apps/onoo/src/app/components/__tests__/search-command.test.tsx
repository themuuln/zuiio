/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock @/components/ui (Dialog, Input, etc.) - avoids lucide-react dependency chain
vi.mock("@/components/ui", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
  }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock lucide-react
vi.mock("lucide-react", () => {
  const Icon = ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  );
  return { Search: Icon, SearchX: Icon, Shield: Icon };
});

// Mock PlayerAvatar
vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({
    photoUrl,
    name,
    primaryColor,
    size,
  }: {
    photoUrl?: string | null;
    name: string;
    primaryColor?: string | null;
    size?: string;
  }) => (
    <div
      data-testid="player-avatar"
      data-photo-url={photoUrl ?? ""}
      data-name={name}
      data-size={size}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} data-testid="avatar-img" />
      ) : (
        <span data-testid="avatar-initials">{name.charAt(0)}</span>
      )}
    </div>
  ),
}));

import { SearchCommand } from "../search-command";

const mockPlayers = [
  {
    id: "player-1",
    name: "Бат-Эрдэнэ",
    team: "Хасууд",
    photo_url: "https://example.com/player1.jpg",
  },
  { id: "player-2", name: "Болд", team: "Арслангууд", photo_url: null },
];

const mockTeams = [{ slug: "khasuud", name: "Хасууд", short_code: "ХАС" }];

const defaultResults = { players: mockPlayers, teams: mockTeams };

describe("SearchCommand", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  it("renders when open is true", () => {
    render(<SearchCommand open={true} onOpenChange={onOpenChange} />);
    expect(
      screen.getByPlaceholderText("Тоглогч эсвэл баг хайх..."),
    ).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <SearchCommand open={false} onOpenChange={onOpenChange} />,
    );
    expect(container.querySelector('[data-testid="dialog"]')).toBeNull();
  });

  it("fetches and displays search results on query", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(defaultResults),
    } as Response);

    render(<SearchCommand open={true} onOpenChange={onOpenChange} />);
    const input = screen.getByPlaceholderText("Тоглогч эсвэл баг хайх...");
    fireEvent.change(input, { target: { value: "Бат" } });

    await waitFor(() =>
      expect(screen.getByText("Тоглогчид")).toBeInTheDocument(),
    );
    expect(screen.getByText("Бат-Эрдэнэ")).toBeInTheDocument();
    expect(screen.getByText("Болд")).toBeInTheDocument();
  });

  it("renders PlayerAvatar with photo for players with photo_url", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(defaultResults),
    } as Response);

    render(<SearchCommand open={true} onOpenChange={onOpenChange} />);
    const input = screen.getByPlaceholderText("Тоглогч эсвэл баг хайх...");
    fireEvent.change(input, { target: { value: "Бат" } });

    await waitFor(() =>
      expect(screen.getAllByTestId("player-avatar").length).toBe(2),
    );
    const avatars = screen.getAllByTestId("player-avatar");
    expect(avatars[0]).toHaveAttribute(
      "data-photo-url",
      "https://example.com/player1.jpg",
    );
    expect(avatars[0]).toHaveAttribute("data-name", "Бат-Эрдэнэ");
    expect(avatars[0]).toHaveAttribute("data-size", "sm");
  });

  it("renders PlayerAvatar with initials for players without photo", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(defaultResults),
    } as Response);

    render(<SearchCommand open={true} onOpenChange={onOpenChange} />);
    const input = screen.getByPlaceholderText("Тоглогч эсвэл баг хайх...");
    fireEvent.change(input, { target: { value: "Бат" } });

    await waitFor(() =>
      expect(screen.getAllByTestId("player-avatar").length).toBe(2),
    );
    const avatars = screen.getAllByTestId("player-avatar");
    expect(avatars[1]).toHaveAttribute("data-photo-url", "");
    expect(avatars[1]).toHaveAttribute("data-name", "Болд");
  });

  it("shows empty state when no results", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ players: [], teams: [] }),
    } as Response);

    render(<SearchCommand open={true} onOpenChange={onOpenChange} />);
    const input = screen.getByPlaceholderText("Тоглогч эсвэл баг хайх...");
    fireEvent.change(input, { target: { value: "xxx" } });

    await waitFor(() =>
      expect(screen.getByText("Илэрц олдсонгүй")).toBeInTheDocument(),
    );
  });
});
