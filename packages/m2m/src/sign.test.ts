import {
  createLocalJWKSet,
  decodeJwt,
  decodeProtectedHeader,
  exportJWK,
  generateKeyPair,
  type JWK,
  type JWTVerifyGetKey,
} from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_ISSUER,
  DEFAULT_TTL_SECONDS,
  deriveMachineKeyId,
  signMachineToken,
} from "./sign";
import { verifyMachineToken } from "./verify";

const AUDIENCE = "agent-gateway";
const ISSUER = "https://id.zuiio.app";
const NOW = 1_700_000_000;

/**
 * Public modulus of a throwaway key with the `kid` Zuiio ID derives for it
 * (`SHA-256("<n>.<e>")`, base64url, first 22 chars), computed outside this
 * package.
 */
const FIXTURE_RSA_JWK: JWK = {
  kty: "RSA",
  e: "AQAB",
  n: "05LqC_sLttBtX6kGEAkugbkxr1GbOewtkhk40D7GJbJOK6IC2hl5X9ci9YvWn5XaZqbcyYw8OUvql02u60rWLc3Wq6MCGKfxsxGosmTyL731WhmPTOnNX7CdmAQ6K-0lUKRy-mlQOzSLRmakv-h7OMj8l_j23jy3hVvEYsxZjnysCJqXAhxkFg08edg9VXg2qFKFa9ULmxg8GOMzVz8l2psfntVA0oO2YvhvZfZHmxneoUXZvElOgnQ62rJCOhuAfRuy3SXd5oUfZXjsvZpmPnPw3QKRc8dMjfqVQXBmnOWhShxh5vRiq4O8EbrWcqUAfc4D_zlvpMeMXhbrGY2C1w",
};
const FIXTURE_KID = "jMM6QpMeUk0bQ4pto6D3-w";

let privateJwk: JWK;
let publicJwk: JWK;
let jwks: JWTVerifyGetKey;

/** Recomputed from the documented formula, not from this package's internals. */
async function kidFromModulus(jwk: JWK): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${jwk.n}.${jwk.e}`),
  );
  const binary = String.fromCharCode(...new Uint8Array(digest));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, 22);
}

beforeAll(async () => {
  const pair = await generateKeyPair("RS256", { extractable: true });
  privateJwk = await exportJWK(pair.privateKey);
  publicJwk = {
    ...(await exportJWK(pair.publicKey)),
    kid: await kidFromModulus(privateJwk),
    alg: "RS256",
    use: "sig",
  };
  jwks = createLocalJWKSet({ keys: [publicJwk] });
});

describe("signMachineToken", () => {
  it("round-trips through verifyMachineToken", async () => {
    const token = await signMachineToken(
      {
        clientId: "svc-alpha",
        audience: AUDIENCE,
        scope: "agent:invoke orders:read",
      },
      { signingKey: privateJwk },
    );

    const result = await verifyMachineToken(token, {
      expectedAudience: AUDIENCE,
      requiredScope: "agent:invoke",
      jwks,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.clientId).toBe("svc-alpha");
    expect(result.claims.scope).toBe("agent:invoke orders:read");
  });

  it("mints exactly the Zuiio ID claim set", async () => {
    const token = await signMachineToken(
      { clientId: "svc-alpha", audience: AUDIENCE, scope: "agent:invoke" },
      { signingKey: privateJwk, now: NOW },
    );

    const header = decodeProtectedHeader(token);
    expect(header.alg).toBe("RS256");
    expect(header.typ).toBe("JWT");
    expect(header.kid).toBe(await kidFromModulus(privateJwk));

    const claims = decodeJwt(token);
    expect(Object.keys(claims).sort()).toEqual(
      ["aud", "exp", "iat", "iss", "jti", "scope", "sub"].sort(),
    );
    expect(claims.iss).toBe(DEFAULT_ISSUER);
    expect(claims.sub).toBe("client:svc-alpha");
    expect(claims.aud).toBe(AUDIENCE);
    expect(claims.scope).toBe("agent:invoke");
    expect(claims.iat).toBe(NOW);
    expect(claims.exp).toBe(NOW + DEFAULT_TTL_SECONDS);
    expect(claims.jti).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("honours a custom issuer, lifetime and scope-less request", async () => {
    const token = await signMachineToken(
      {
        clientId: "svc-beta",
        audience: "zer",
        issuer: ISSUER,
        expiresInSeconds: 120,
      },
      { signingKey: privateJwk, now: NOW },
    );

    const claims = decodeJwt(token);
    expect(claims.iss).toBe(ISSUER);
    expect(claims.aud).toBe("zer");
    expect(claims.exp).toBe(NOW + 120);
    expect(claims.scope).toBeUndefined();
    expect(claims.sub).toBe("client:svc-beta");
  });

  it("derives the kid zuiio-id publishes for a known key", async () => {
    expect(await deriveMachineKeyId(FIXTURE_RSA_JWK)).toBe(FIXTURE_KID);
    expect(
      await deriveMachineKeyId({ kty: "oct", k: "c2VjcmV0" }),
    ).toBeUndefined();
  });

  it("omits the kid header for a bare CryptoKey", async () => {
    const pair = await generateKeyPair("RS256", { extractable: true });
    const token = await signMachineToken(
      { clientId: "svc-alpha", audience: AUDIENCE },
      { signingKey: pair.privateKey, now: NOW },
    );
    expect(decodeProtectedHeader(token).kid).toBeUndefined();
  });

  it("uses an explicit kid when given", async () => {
    const token = await signMachineToken(
      { clientId: "svc-alpha", audience: AUDIENCE },
      { signingKey: privateJwk, kid: "rotated-key-2", now: NOW },
    );
    expect(decodeProtectedHeader(token).kid).toBe("rotated-key-2");
  });

  it("rejects missing required input", async () => {
    await expect(
      signMachineToken(
        { clientId: "", audience: AUDIENCE },
        { signingKey: privateJwk },
      ),
    ).rejects.toThrow(/clientId is required/);
    await expect(
      signMachineToken(
        { clientId: "svc-alpha", audience: AUDIENCE, expiresInSeconds: 0 },
        { signingKey: privateJwk },
      ),
    ).rejects.toThrow(/expiresInSeconds/);
  });
});

describe("sign/verify contract", () => {
  it("rejects a token minted for another audience at the verifier", async () => {
    const token = await signMachineToken(
      { clientId: "svc-alpha", audience: "zer" },
      { signingKey: privateJwk, now: NOW },
    );
    expect(
      await verifyMachineToken(token, { expectedAudience: AUDIENCE, jwks }),
    ).toEqual({ ok: false, reason: "wrong_audience" });
  });
});
