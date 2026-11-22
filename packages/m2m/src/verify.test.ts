import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type JWK,
  type JWTVerifyGetKey,
  SignJWT,
} from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import {
  clearJwksCache,
  DEFAULT_ALLOWED_ISSUERS,
  verifyMachineToken,
} from "./verify";

const ISSUER = "https://id.zuiio.app";
const LEGACY_ISSUER = "https://id.zuiiotech.com";
const AUDIENCE = "agent-gateway";
const KID = "test-machine-key";

let privateKey: CryptoKey;
let publicJwk: JWK;
let jwks: JWTVerifyGetKey;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

beforeAll(async () => {
  const pair = await generateKeyPair("RS256", { extractable: true });
  privateKey = pair.privateKey as CryptoKey;
  publicJwk = {
    ...(await exportJWK(pair.publicKey)),
    kid: KID,
    alg: "RS256",
    use: "sig",
  };
  jwks = createLocalJWKSet({ keys: [publicJwk] });
});

interface MintOverrides {
  iss?: string;
  aud?: string;
  /** `null` omits the claim entirely. */
  scope?: string | null;
  sub?: string;
  iat?: number;
  exp?: number;
  /** `null` omits the header parameter. */
  kid?: string | null;
}

async function mint(overrides: MintOverrides = {}): Promise<string> {
  const issuedAt = overrides.iat ?? nowSeconds();
  const claims: Record<string, unknown> = {};
  if (overrides.scope !== null) {
    claims.scope = overrides.scope ?? "agent:invoke";
  }
  return new SignJWT(claims)
    .setProtectedHeader({
      alg: "RS256",
      typ: "JWT",
      ...(overrides.kid === null ? {} : { kid: overrides.kid ?? KID }),
    })
    .setIssuer(overrides.iss ?? ISSUER)
    .setSubject(overrides.sub ?? "client:svc-alpha")
    .setAudience(overrides.aud ?? AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(overrides.exp ?? issuedAt + 3600)
    .sign(privateKey);
}

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Token with an `alg: none` header — the classic unsecured-JWT downgrade. */
function unsecuredToken(): string {
  const issuedAt = nowSeconds();
  const header = base64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: ISSUER,
      sub: "client:svc-alpha",
      aud: AUDIENCE,
      scope: "agent:invoke",
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );
  return `${header}.${payload}.`;
}

describe("verifyMachineToken", () => {
  it("accepts a valid token and reports its client", async () => {
    const result = await verifyMachineToken(await mint(), {
      expectedAudience: AUDIENCE,
      requiredScope: "agent:invoke",
      jwks,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.clientId).toBe("svc-alpha");
    expect(result.claims.iss).toBe(ISSUER);
    expect(result.claims.sub).toBe("client:svc-alpha");
    expect(result.claims.aud).toBe(AUDIENCE);
    expect(result.claims.scope).toBe("agent:invoke");
    expect(typeof result.claims.exp).toBe("number");
  });

  it("accepts both issuer hosts by default", async () => {
    expect(DEFAULT_ALLOWED_ISSUERS).toContain(ISSUER);
    expect(DEFAULT_ALLOWED_ISSUERS).toContain(LEGACY_ISSUER);

    const legacy = await verifyMachineToken(
      await mint({ iss: LEGACY_ISSUER }),
      {
        expectedAudience: AUDIENCE,
        jwks,
      },
    );
    expect(legacy.ok).toBe(true);
  });

  it("rejects an expired token", async () => {
    const issuedAt = nowSeconds() - 3600;
    const result = await verifyMachineToken(
      await mint({ iat: issuedAt, exp: issuedAt + 60 }),
      { expectedAudience: AUDIENCE, jwks },
    );
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects the wrong audience", async () => {
    const result = await verifyMachineToken(await mint({ aud: "zer" }), {
      expectedAudience: AUDIENCE,
      jwks,
    });
    expect(result).toEqual({ ok: false, reason: "wrong_audience" });
  });

  it("rejects an untrusted issuer", async () => {
    const result = await verifyMachineToken(
      await mint({ iss: "https://id.attacker.example" }),
      { expectedAudience: AUDIENCE, jwks },
    );
    expect(result).toEqual({ ok: false, reason: "wrong_issuer" });
  });

  it("rejects a tampered signature", async () => {
    const token = await mint();
    const [header, payload, signature] = token.split(".");
    const flipped = `${signature?.slice(0, 8)}${signature?.at(8) === "A" ? "B" : "A"}${signature?.slice(9)}`;
    const tampered = `${header}.${payload}.${flipped}`;

    const result = await verifyMachineToken(tampered, {
      expectedAudience: AUDIENCE,
      jwks,
    });
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects a token without the required scope", async () => {
    const withoutScope = await verifyMachineToken(await mint({ scope: null }), {
      expectedAudience: AUDIENCE,
      requiredScope: "orders:write",
      jwks,
    });
    expect(withoutScope).toEqual({ ok: false, reason: "missing_scope" });

    const otherScope = await verifyMachineToken(
      await mint({ scope: "agent:invoke orders:read" }),
      { expectedAudience: AUDIENCE, requiredScope: "orders:write", jwks },
    );
    expect(otherScope).toEqual({ ok: false, reason: "missing_scope" });
  });

  it("rejects an alg: none token", async () => {
    const result = await verifyMachineToken(unsecuredToken(), {
      expectedAudience: AUDIENCE,
      jwks,
    });
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects a malformed token", async () => {
    const result = await verifyMachineToken("not-a-jwt", {
      expectedAudience: AUDIENCE,
      jwks,
    });
    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects a payload with Zuiio ID claims missing", async () => {
    const issuedAt = nowSeconds();
    const token = await new SignJWT({ scope: "agent:invoke" })
      .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: KID })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + 3600)
      .sign(privateKey);

    const result = await verifyMachineToken(token, {
      expectedAudience: AUDIENCE,
      jwks,
    });
    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("fetches the remote JWKS once across two verifies", async () => {
    clearJwksCache();
    let fetches = 0;
    const fetchImpl = async (): Promise<Response> => {
      fetches += 1;
      return new Response(JSON.stringify({ keys: [publicJwk] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const options = {
      expectedAudience: AUDIENCE,
      jwksUrl: "https://id.zuiio.app/api/oauth/jwks",
      fetchImpl,
    };

    const first = await verifyMachineToken(await mint(), options);
    const second = await verifyMachineToken(await mint(), options);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(fetches).toBe(1);

    clearJwksCache();
  });

  it("reports jwks_unavailable when the JWKS cannot be fetched", async () => {
    clearJwksCache();
    const fetchImpl = async (): Promise<Response> => {
      throw new TypeError("network down");
    };

    const result = await verifyMachineToken(await mint(), {
      expectedAudience: AUDIENCE,
      jwksUrl: "https://id.zuiio.app/api/oauth/jwks",
      fetchImpl,
    });
    expect(result).toEqual({ ok: false, reason: "jwks_unavailable" });

    clearJwksCache();
  });
});
