"use client";


/**
 * Printable paper scoresheet for game-day fallback.
 * Open /tracker/paper, print on A4 portrait.
 *
 * Sections:
 *  1. Game info (teams, date, venue, period count)
 *  2. Per-period score grid
 *  3. Per-player stat tally rows
 *
 * All fields are blank — designed to be filled by hand.
 */

const STAT_COLUMNS = [
  "1P",
  "2P",
  "3P",
  "FT",
  "ОБ",
  "ДБ",
  "ОХ",
  "БЗ",
  "ХЦ",
  "ТХ",
  "Нийт",
] as const;

const STAT_LABELS: Record<string, string> = {
  "1P": "1-ийн шидэлт",
  "2P": "2-ын шидэлт",
  "3P": "3-ын шидэлт",
  FT: "Эрх чөлөөт",
  ОБ: "Давсан",
  ДБ: "Хамгаалсан",
  ОХ: "Булаалган",
  БЗ: "Блок",
  ХЦ: "Эвдүүлэх",
  ТХ: "Түр зогсоол",
  Нийт: "Нийт",
};

const MAX_PLAYERS = 12;

function InfoRow({ label }: { label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-24 shrink-0 text-xs font-medium">{label}</span>
      <span className="border-b border-black/30 flex-1" />
    </div>
  );
}

export default function PaperScoresheetPage() {
  return (
    <main className="mx-auto max-w-[210mm] bg-white p-6 text-black print:p-0 print:shadow-none">
      {/* ── Screen-only print button ── */}
      <div className="mb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-black/80"
        >
          Хэвлэх (Print)
        </button>
      </div>

      {/* ── Header ── */}
      <header className="mb-4 border-b-2 border-black pb-3">
        <h1 className="text-center text-lg font-bold">ОНОО — ТОГЛОЛТЫН БҮРТГЭЛ</h1>
        <p className="mt-1 text-center text-xs text-black/60">
          Сагсан бөмбөгийн тоглолтын цахим бүртгэлийн хуудас
        </p>
      </header>

      {/* ── Game info ── */}
      <section className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1">
        <InfoRow label="Огноо" />
        <InfoRow label="Байршил" />
        <InfoRow label="Эсрэг баг" />
        <InfoRow label="Үеийн тоо" />
        <InfoRow label="Өрсөлдөгч баг" />
        <InfoRow label="Үеийн минут" />
      </section>

      {/* ── Period score grid ── */}
      <section className="mb-4">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-wide">
          Үе бүрийн оноо
        </h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-black/40 px-2 py-1 text-left">Баг</th>
              <th className="border border-black/40 px-2 py-1 text-center">1-р үе</th>
              <th className="border border-black/40 px-2 py-1 text-center">2-р үе</th>
              <th className="border border-black/40 px-2 py-1 text-center">3-р үе</th>
              <th className="border border-black/40 px-2 py-1 text-center">4-р үе</th>
              <th className="border border-black/40 px-2 py-1 text-center">Нэмэлт</th>
              <th className="border border-black/40 px-2 py-1 text-center font-bold">
                Нийт
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black/40 px-2 py-3 font-medium">
                {/* Home team name */}
              </td>
              {Array.from({ length: 6 }).map((_, i) => (
                <td key={i} className="border border-black/40 px-2 py-3" />
              ))}
            </tr>
            <tr>
              <td className="border border-black/40 px-2 py-3 font-medium">
                {/* Away team name */}
              </td>
              {Array.from({ length: 6 }).map((_, i) => (
                <td key={i} className="border border-black/40 px-2 py-3" />
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Player stat tally ── */}
      <section>
        <h2 className="mb-1 text-xs font-bold uppercase tracking-wide">
          Тоглогчдын статистик
        </h2>
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="border border-black/40 px-1 py-1 text-left w-8">#</th>
              <th className="border border-black/40 px-1 py-1 text-left w-28">Нэр</th>
              {STAT_COLUMNS.map((col) => (
                <th
                  key={col}
                  className="border border-black/40 px-1 py-1 text-center"
                  title={STAT_LABELS[col]}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: MAX_PLAYERS }).map((_, i) => (
              <tr key={i}>
                <td className="border border-black/40 px-1 py-2 text-center">
                  {i + 1}
                </td>
                <td className="border border-black/40 px-1 py-2">
                  {/* Player name */}
                </td>
                {STAT_COLUMNS.map((col) => (
                  <td key={col} className="border border-black/40 px-1 py-2" />
                ))}
              </tr>
            ))}
            {/* Totals row */}
            <tr className="font-bold">
              <td
                colSpan={2}
                className="border border-black/40 px-1 py-2 text-right"
              >
                Нийт
              </td>
              {STAT_COLUMNS.map((col) => (
                <td key={col} className="border border-black/40 px-1 py-2" />
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-6 grid grid-cols-2 gap-8 text-xs">
        <div>
          <span className="font-medium">Бүртгэгч: </span>
          <span className="border-b border-black/30 inline-block w-40" />
        </div>
        <div>
          <span className="font-medium">Шүүгч: </span>
          <span className="border-b border-black/30 inline-block w-40" />
        </div>
      </footer>

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          main {
            width: 210mm;
            min-height: 297mm;
            padding: 12mm;
            box-shadow: none;
          }
          table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}
