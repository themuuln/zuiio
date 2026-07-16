export type ProductId =
  | "zer"
  | "tolom"
  | "tamga"
  | "onoo"
  | "tumurch"
  | "zraf"
  | "zoa"
  | "zatly"
  | "khosuud"
  | "zerbu"
  | "zunch"
  | "card"
  | "zill";

export type ProductAuthMode = "sso" | "none";

export interface SsoProduct {
  id: ProductId;
  displayName: string;
  authMode: ProductAuthMode;
  appRoots: readonly string[];
  callbackPath: "/auth/callback";
  ssoStartPath: "/auth/sso";
  logoUrl?: string;
  mobileCallbackUrl?: `zuiio-${string}://auth/callback`;
  mobileStartUrl?: `zuiio-${string}://auth/start`;
}

  {
    id: "zer",
    displayName: "Zer",
    authMode: "sso",
    appRoots: ["apps/zer", "apps/zer-app"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
    logoUrl: "https://zer.zuiiotech.com/favicon.ico",
    mobileCallbackUrl: "zuiio-zer://auth/callback",
    mobileStartUrl: "zuiio-zer://auth/start",
  },
  {
    id: "tolom",
    displayName: "Tolom",
    authMode: "sso",
    appRoots: ["apps/tolom", "apps/tolom-mobile"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
    logoUrl: "https://tolom.zuiiotech.com/favicon.ico",
    mobileCallbackUrl: "zuiio-tolom://auth/callback",
    mobileStartUrl: "zuiio-tolom://auth/start",
  },
  {
    id: "tamga",
    displayName: "Tamga",
    authMode: "sso",
    appRoots: ["apps/tamga", "apps/tamga-web"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
    mobileCallbackUrl: "zuiio-tamga://auth/callback",
    mobileStartUrl: "zuiio-tamga://auth/start",
  },
  {
    id: "onoo",
    displayName: "Onöö",
    authMode: "sso",
    appRoots: ["apps/onoo", "apps/onoo-app"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
    mobileCallbackUrl: "zuiio-onoo://auth/callback",
    mobileStartUrl: "zuiio-onoo://auth/start",
  },
  {
    id: "tumurch",
    displayName: "Tumurch",
    authMode: "sso",
    appRoots: ["apps/tumurch", "apps/tumurch-rn"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
    mobileCallbackUrl: "zuiio-tumurch://auth/callback",
    mobileStartUrl: "zuiio-tumurch://auth/start",
  },
  {
    id: "zraf",
    displayName: "Zraf",
    authMode: "sso",
    appRoots: ["apps/zraf", "apps/zraf-web"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
    mobileCallbackUrl: "zuiio-zraf://auth/callback",
    mobileStartUrl: "zuiio-zraf://auth/start",
  },
  {
    id: "zoa",
    displayName: "Zoa",
    authMode: "sso",
    appRoots: ["apps/zoa/apps/web", "apps/zoa/apps/mobile"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
    mobileCallbackUrl: "zuiio-zoa://auth/callback",
    mobileStartUrl: "zuiio-zoa://auth/start",
  },
  {
    id: "zatly",
    displayName: "Zatly",
    authMode: "sso",
    appRoots: ["apps/zatly"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
  },
  {
    id: "khosuud",
    displayName: "Khosuud",
    authMode: "sso",
    appRoots: ["apps/khosuud"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
    mobileCallbackUrl: "zuiio-khosuud://auth/callback",
    mobileStartUrl: "zuiio-khosuud://auth/start",
  },
  {
    id: "zerbu",
    displayName: "Zerbu",
    authMode: "sso",
    appRoots: ["apps/zerbu"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
  },
  {
    id: "zunch",
    displayName: "Zunch",
    authMode: "sso",
    appRoots: ["apps/zunch"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
    mobileCallbackUrl: "zuiio-zunch://auth/callback",
    mobileStartUrl: "zuiio-zunch://auth/start",
  },
  {
    id: "card",
    displayName: "Card",
    authMode: "none",
    appRoots: ["apps/card"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
  },
  {
    id: "zill",
    displayName: "Zill",
    authMode: "none",
    appRoots: ["apps/zill"],
    callbackPath: "/auth/callback",
    ssoStartPath: "/auth/sso",
  },
] as const satisfies readonly SsoProduct[];

export function getSsoProduct(id: ProductId): SsoProduct {
  const product = SSO_PRODUCTS.find((candidate) => candidate.id === id);

  if (!product) {
    throw new Error(`Unknown Zuiio product: ${id}`);
  }

  return product;
}
