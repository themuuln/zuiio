import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "game-001" }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { toast } from "sonner";
const mockToast = vi.mocked(toast);

let PageComponent: React.ComponentType;
beforeAll(async () => {
  const mod = await import("../page");
  PageComponent = mod.default;
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const GAME_ID = "game-001";

const makeGameData = (overrides = {}) => ({
  id: GAME_ID,
  competition_id: "comp-1",
  home_team_season_id: "hts-1",
  away_team_season_id: "ats-1",
  venue_id: "venue-1",
  scheduled_at: "2026-01-15T18:00:00Z",
  status: "league_verified",
  current_period: 4,
  home_score: 78,
  away_score: 65,
  created_at: "2026-01-10T00:00:00Z",
  competitions: { name: "MNBL 2025/2026", season_id: "s-1" },
  home_team_season: { teams: { name: "Khuleguud", short_code: "KHL" } },
  away_team_season: { teams: { name: "SG Apes", short_code: "APE" } },
  venues: { name: "UB Sports Palace", city: "Ulaanbaatar" },
  ...overrides,
});

const makeBoxScore = (overrides = {}) => ({
  score: { home: 38, away: 31 },
  teams: [
    {
      name: "Khuleguud", code: "KHL",
      players: [
        { jerseyNumber: 7, name: "Б.Тэмүүлэн", dnp: false, secondsPlayed: 1440, pts: 24, fgm: 10, fga: 18, tpm: 2, tpa: 5, ftm: 2, fta: 3, oreb: 3, dreb: 5, reb: 8, ast: 7, stl: 2, blk: 1, tov: 3, pf: 2, plusMinus: 12, dnpReason: null },
        { jerseyNumber: 11, name: "О.Гантөгс", dnp: false, secondsPlayed: 1320, pts: 14, fgm: 5, fga: 11, tpm: 3, tpa: 7, ftm: 1, fta: 1, oreb: 1, dreb: 3, reb: 4, ast: 2, stl: 0, blk: 0, tov: 1, pf: 4, plusMinus: 5, dnpReason: null },
      ],
    },
    {
      name: "SG Apes", code: "APE",
      players: [
        { jerseyNumber: 23, name: "Д.Амарбат", dnp: false, secondsPlayed: 1500, pts: 31, fgm: 12, fga: 22, tpm: 4, tpa: 9, ftm: 3, fta: 4, oreb: 4, dreb: 8, reb: 12, ast: 1, stl: 1, blk: 2, tov: 4, pf: 3, plusMinus: -7, dnpReason: null },
      ],
    },
  ],
  warnings: [],
  ...overrides,
});

const makeSubmission = (overrides = {}) => ({
  id: "s-1", game_id: GAME_ID, source_type: "official_score_sheet",
  evidence_url: "ev.pdf", submitted_by: "u1", submitted_at: "2026-01-15T19:00:00Z",
  normalized_payload: {}, confidence: 0.9, status: "approved",
  reviewed_by: null, reviewed_at: null, review_note: null,
  ...overrides,
});

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return {
    qc,
    ...render(
      <QueryClientProvider client={qc}>
        <PageComponent />
      </QueryClientProvider>,
    ),
  };
}

/** Use this in tests that don't need file upload. Sets up basic fetch mocks. */
function mockBasicFetch(overrides?: {
  gameData?: Record<string, unknown>;
  submissions?: Record<string, unknown>[];
}) {
  const gameData = overrides?.gameData ?? makeGameData();
  const submissions = overrides?.submissions ?? [];
  return vi.mocked(globalThis.fetch).mockImplementation((url: string | Request | URL) => {
    if (url === `/admin/api/games/${GAME_ID}`) {
      return Promise.resolve(new Response(JSON.stringify(gameData), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (url === `/admin/api/games/${GAME_ID}/submissions`) {
      return Promise.resolve(new Response(JSON.stringify(submissions), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });
}

async function selectPdf() {
  const input = screen.getByTestId("pdf-file-input") as HTMLInputElement;
  await userEvent.upload(input, new File(["%PDF-1.4"], "report.pdf", { type: "application/pdf" }));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("BoxEntryPage", () => {
  let fetchSpy: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it("shows loading skeleton while game data loads", async () => {
    fetchSpy.mockImplementation(() => new Promise(() => { /* never */ }));
    renderPage();
    expect(screen.getByRole("heading", { name: /импортлох/i })).toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  // ── Game context ──────────────────────────────────────────────────────────

  it("renders game context card with teams, competition, date, venue", async () => {
    mockBasicFetch();
    renderPage();
    expect(await screen.findByText("MNBL 2025/2026")).toBeInTheDocument();
    expect(screen.getByText("Khuleguud")).toBeInTheDocument();
    expect(screen.getByText("SG Apes")).toBeInTheDocument();
    expect(screen.getByText("UB Sports Palace, Ulaanbaatar")).toBeInTheDocument();
    expect(screen.getByText("Албан ёсны")).toBeInTheDocument();
  });

  it("renders venue name when city is null", async () => {
    mockBasicFetch({ gameData: makeGameData({ venues: { name: "Gym 1", city: null } }) });
    renderPage();
    expect(await screen.findByText("Gym 1")).toBeInTheDocument();
  });

  // ── Upload zone ───────────────────────────────────────────────────────────

  it("renders empty upload zone with drag-and-drop prompt", async () => {
    mockBasicFetch();
    renderPage();
    expect(await screen.findByText(/PDF-г энд чирж авчирна уу/i)).toBeInTheDocument();
    expect(screen.getByText(/товшоод файл сонгох/i)).toBeInTheDocument();
    // The hidden text is inside the drop zone — use a more specific query
    expect(screen.getByText(/Зөвхөн FIBA Official Statistics PDF/i)).toBeInTheDocument();
  });

  it("shows file details after selecting a PDF", async () => {
    mockBasicFetch();
    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    await selectPdf();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("allows clearing a selected file with the X button", async () => {
    mockBasicFetch();
    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    await selectPdf();
    await userEvent.click(screen.getByRole("button", { name: /Файл хасах/i }));
    expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
  });

  it("changes border style on drag-over", async () => {
    mockBasicFetch();
    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    // Find the outer card (has border-dashed)
    const outerCard = document.querySelector('[class*="border-dashed"]')!;
    expect(outerCard).toBeInTheDocument();
    expect(outerCard.className).toContain("border-dashed");
    fireEvent.dragOver(outerCard);
    expect(outerCard.className).not.toContain("border-dashed");
  });

  it("rejects a non-PDF file drop with toast error", async () => {
    mockBasicFetch();
    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    const outerCard = document.querySelector('[class*="border-dashed"]')!;
    fireEvent.drop(outerCard, { dataTransfer: { files: [new File(["x"], "img.png", { type: "image/png" })] } });
    expect(mockToast.error).toHaveBeenCalledWith("Зөвхөн PDF файл ачаалах боломжтой");
  });

  // ── File input existence ──────────────────────────────────────────────────

  it("renders hidden file input with PDF accept type", async () => {
    mockBasicFetch();
    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    const input = screen.getByTestId("pdf-file-input") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe("file");
    expect(input.accept).toContain(".pdf");
  });

  // ── Submit button states ──────────────────────────────────────────────────

  it("disables submit button when no file is selected", async () => {
    mockBasicFetch();
    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    const btn = screen.getByRole("button", { name: /PDF-с статистик шинэчлэх/i });
    expect(btn).toBeDisabled();
    await selectPdf();
    expect(btn).not.toBeDisabled();
  });

  // ── Successful submission ─────────────────────────────────────────────────

  it("submits the PDF and shows parsed result with sync badge", async () => {
    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === `/admin/api/games/${GAME_ID}`) {
        return Promise.resolve(new Response(JSON.stringify(makeGameData()), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/submissions`) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/official-stats` && init?.method === "POST") {
        return Promise.resolve(new Response(JSON.stringify({ boxScore: makeBoxScore(), synced: true, submissionId: "sub-1", revisionId: "rev-1" }), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return Promise.reject(new Error(`unexpected: ${url}`));
    });

    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    await selectPdf();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /PDF-с статистик шинэчлэх/i }));

    expect(await screen.findByText("38")).toBeInTheDocument();
    // "31" appears in the scoreboard AND in player stats — use getAllByText
    expect(screen.getAllByText("31").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Статистик шинэчлэгдсэн")).toBeInTheDocument();
    expect(screen.getByText("Тоглолт руу очих")).toBeInTheDocument();
    expect(screen.getByText("Д.Амарбат")).toBeInTheDocument();
    expect(screen.queryByText(/PDF-г энд чирж авчирна уу/i)).not.toBeInTheDocument();
    expect(screen.getByText(/амжилттай импортлогдсон/i)).toBeInTheDocument();
  });

  it("shows warning when there are unmatched players", async () => {
    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === `/admin/api/games/${GAME_ID}`) {
        return Promise.resolve(new Response(JSON.stringify(makeGameData()), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/submissions`) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/official-stats` && init?.method === "POST") {
        return Promise.resolve(new Response(JSON.stringify({ boxScore: makeBoxScore(), synced: true, submissionId: "s2", revisionId: "r2", unmatchedPlayers: [{ teamCode: "KHL", jerseyNumber: 99, name: "Т.Тэст" }] }), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return Promise.reject(new Error(`unexpected: ${url}`));
    });

    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    await selectPdf();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /PDF-с статистик шинэчлэх/i }));

    expect(await screen.findByText(/Тохироогүй тоглогчид/i)).toBeInTheDocument();
    expect(screen.getByText("#99 Т.Тэст (KHL)")).toBeInTheDocument();
  });

  // ── Error states ──────────────────────────────────────────────────────────

  it("shows error toast when API returns error", async () => {
    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === `/admin/api/games/${GAME_ID}`) {
        return Promise.resolve(new Response(JSON.stringify(makeGameData()), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/submissions`) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/official-stats` && init?.method === "POST") {
        return Promise.resolve(new Response(JSON.stringify({ error: "PDF parse failed: no stats found" }), { status: 422, headers: { "Content-Type": "application/json" } }));
      }
      return Promise.reject(new Error(`unexpected: ${url}`));
    });

    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    await selectPdf();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /PDF-с статистик шинэчлэх/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("PDF parse failed: no stats found");
    });
  });

  it("shows generic error when response has no boxScore", async () => {
    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === `/admin/api/games/${GAME_ID}`) {
        return Promise.resolve(new Response(JSON.stringify(makeGameData()), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/submissions`) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/official-stats` && init?.method === "POST") {
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return Promise.reject(new Error(`unexpected: ${url}`));
    });

    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    await selectPdf();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /PDF-с статистик шинэчлэх/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Импорт хийж чадсангүй");
    });
  });

  it("shows error toast on network failure", async () => {
    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === `/admin/api/games/${GAME_ID}`) {
        return Promise.resolve(new Response(JSON.stringify(makeGameData()), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/submissions`) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/official-stats` && init?.method === "POST") {
        return Promise.reject(new TypeError("Failed to fetch"));
      }
      return Promise.reject(new Error(`unexpected: ${url}`));
    });

    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    await selectPdf();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /PDF-с статистик шинэчлэх/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Failed to fetch");
    });
  });

  it("shows generic error when response JSON parsing fails", async () => {
    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === `/admin/api/games/${GAME_ID}`) {
        return Promise.resolve(new Response(JSON.stringify(makeGameData()), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/submissions`) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/official-stats` && init?.method === "POST") {
        return Promise.resolve(new Response("not json", { status: 500 }));
      }
      return Promise.reject(new Error(`unexpected: ${url}`));
    });

    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    await selectPdf();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /PDF-с статистик шинэчлэх/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringMatching(/Unexpected token|not valid JSON/),
      );
    });
  });
  // ── Previous submissions ──────────────────────────────────────────────────

  it("shows previous submissions when they exist", async () => {
    mockBasicFetch({ submissions: [makeSubmission()] });
    renderPage();
    expect(await screen.findByText(/Ымнөх импортууд/i)).toBeInTheDocument();
    expect(screen.getByText("Зөвшөөрсөн")).toBeInTheDocument();
    expect(screen.getByText(/Үзэх/i)).toBeInTheDocument();
  });

  it("hides previous submissions after a new import", async () => {
    let callCount = 0;
    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === `/admin/api/games/${GAME_ID}`) {
        return Promise.resolve(new Response(JSON.stringify(makeGameData()), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/submissions`) {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(new Response(JSON.stringify([makeSubmission()]), { status: 200, headers: { "Content-Type": "application/json" } }));
        }
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/official-stats` && init?.method === "POST") {
        return Promise.resolve(new Response(JSON.stringify({ boxScore: makeBoxScore(), synced: true, submissionId: "s3", revisionId: "r3" }), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return Promise.reject(new Error(`unexpected: ${url}`));
    });

    renderPage();
    expect(await screen.findByText(/Ымнөх импортууд/i)).toBeInTheDocument();
    await selectPdf();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /PDF-с статистик шинэчлэх/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Ымнөх импортууд/i)).not.toBeInTheDocument();
    });
  });

  // ── Loading state on button ───────────────────────────────────────────────

  it("shows loading text on button while submitting", async () => {
    let resolveSubmit: (v: unknown) => void;
    const submitP = new Promise((resolve) => { resolveSubmit = resolve; });

    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === `/admin/api/games/${GAME_ID}`) {
        return Promise.resolve(new Response(JSON.stringify(makeGameData()), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/submissions`) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url === `/admin/api/games/${GAME_ID}/official-stats` && init?.method === "POST") {
        return submitP.then(() => Promise.resolve(new Response(JSON.stringify({ boxScore: makeBoxScore(), synced: true, submissionId: "s4", revisionId: "r4" }), { status: 200, headers: { "Content-Type": "application/json" } })));
      }
      return Promise.reject(new Error(`unexpected: ${url}`));
    });

    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    await selectPdf();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /PDF-с статистик шинэчлэх/i }));

    expect(screen.getByRole("button", { name: /Уншиж байна/i })).toBeDisabled();
    resolveSubmit!(undefined);
    await waitFor(() => {
      expect(screen.getByText("38")).toBeInTheDocument();
    });
  });

  // ── Rights checkbox ──────────────────────────────────────────────────────

  it("shows required rights confirmation checkbox", async () => {
    mockBasicFetch();
    renderPage();
    await screen.findByText(/PDF-г энд чирж авчирна уу/i);
    const cb = screen.getByRole("checkbox");
    expect(cb).toBeRequired();
    expect(screen.getByText(/ашиглах, хадгалах эрхтэйгээ баталгаажуулж/i)).toBeInTheDocument();
  });
});
