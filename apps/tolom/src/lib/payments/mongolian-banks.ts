/** Canonical catalog of major Mongolian banks for transfer payments. */
export const MONGOLIAN_BANK_IDS = [
  "khanbank",
  "tdb",
  "golomt",
  "xacbank",
  "state_bank",
  "capitron",
  "bogd",
  "mbank",
  "arig",
  "ckbank",
  "nib",
  "transbank",
] as const;

export type MongolianBankId = (typeof MONGOLIAN_BANK_IDS)[number];

export interface MongolianBank {
  id: MongolianBankId;
  nameEn: string;
  nameMn: string;
  logo: string;
  /** Brand accent for fallback UI when logo fails to load. */
  brandColor: string;
}

export const MONGOLIAN_BANKS: MongolianBank[] = [
  {
    id: "khanbank",
    nameEn: "Khan Bank",
    nameMn: "Хаан банк",
    logo: "/khanbank-logo.png",
    brandColor: "#00A651",
  },
  {
    id: "tdb",
    nameEn: "Trade and Development Bank",
    nameMn: "ХХБ",
    logo: "/tdb-logo.png",
    brandColor: "#003DA5",
  },
  {
    id: "golomt",
    nameEn: "Golomt Bank",
    nameMn: "Голомт банк",
    logo: "/banks/golomt.svg",
    brandColor: "#E31837",
  },
  {
    id: "xacbank",
    nameEn: "XacBank",
    nameMn: "Хас банк",
    logo: "/banks/xacbank.svg",
    brandColor: "#F57C00",
  },
  {
    id: "state_bank",
    nameEn: "State Bank",
    nameMn: "Төрийн банк",
    logo: "/banks/state-bank.svg",
    brandColor: "#1B3A6B",
  },
  {
    id: "capitron",
    nameEn: "Capitron Bank",
    nameMn: "Капитрон банк",
    logo: "/banks/capitron.svg",
    brandColor: "#6B2D8B",
  },
  {
    id: "bogd",
    nameEn: "Bogd Bank",
    nameMn: "Богд банк",
    logo: "/banks/bogd.svg",
    brandColor: "#00897B",
  },
  {
    id: "mbank",
    nameEn: "M Bank",
    nameMn: "М банк",
    logo: "/banks/mbank.svg",
    brandColor: "#C2185B",
  },
  {
    id: "arig",
    nameEn: "Arig Bank",
    nameMn: "Ариг банк",
    logo: "/banks/arig.svg",
    brandColor: "#2E7D32",
  },
  {
    id: "ckbank",
    nameEn: "Chinggis Khaan Bank",
    nameMn: "Чингис хаан банк",
    logo: "/banks/ckbank.svg",
    brandColor: "#B8860B",
  },
  {
    id: "nib",
    nameEn: "NIB Bank",
    nameMn: "НИБ банк",
    logo: "/banks/nib.svg",
    brandColor: "#0D47A1",
  },
  {
    id: "transbank",
    nameEn: "TransBank",
    nameMn: "Транс банк",
    logo: "/banks/transbank.svg",
    brandColor: "#455A64",
  },
];

const BANK_BY_ID = new Map(MONGOLIAN_BANKS.map((bank) => [bank.id, bank]));

export function getMongolianBank(id: string): MongolianBank | undefined {
  return BANK_BY_ID.get(id as MongolianBankId);
}

export function isMongolianBankId(id: string): id is MongolianBankId {
  return BANK_BY_ID.has(id as MongolianBankId);
}
