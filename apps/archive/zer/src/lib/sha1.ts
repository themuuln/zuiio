/**
 * Compact, dependency-free SHA-1 (hex digest).
 *
 * Used to derive the custom-domain verification token in both server
 * actions and client components, so the token can be displayed before
 * any server round-trip. Implemented in plain JS because WebCrypto does
 * not expose SHA-1 in every runtime.
 */

const HEX = "0123456789abcdef";

function rotl(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

/** @returns the SHA-1 hex digest of `input` (UTF-8 encoded). */
export function sha1Hex(input: string): string {
  // UTF-8 encode
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i += 1) {
    const code = input.codePointAt(i) ?? 0;
    if (code > 0xffff) i += 1; // surrogate pair consumed
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }

  // Pad to 64-byte blocks (big-endian bit length in the last 8 bytes)
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let shift = 56; shift >= 0; shift -= 8) {
    bytes.push((bitLen / 2 ** shift) & 0xff);
  }

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Array<number>(80);
  for (let block = 0; block < bytes.length; block += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] =
        (bytes[block + i * 4] << 24) |
        (bytes[block + i * 4 + 1] << 16) |
        (bytes[block + i * 4 + 2] << 8) |
        bytes[block + i * 4 + 3];
    }
    for (let i = 16; i < 80; i += 1) {
      w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i += 1) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (rotl(a, 5) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  return [h0, h1, h2, h3, h4]
    .map((h) =>
      [28, 24, 20, 16, 12, 8, 4, 0]
        .map((shift) => HEX[(h >>> shift) & 0xf])
        .join(""),
    )
    .join("");
}
