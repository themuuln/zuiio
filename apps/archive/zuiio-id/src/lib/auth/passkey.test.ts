import { describe, expect, it } from "vitest";
import { getPasskeyErrorMessage, isPasskeyCancellation } from "./passkey";

describe("passkey errors", () => {
  it("treats browser cancellation as a dismissed ceremony", () => {
    expect(isPasskeyCancellation({ name: "NotAllowedError" })).toBe(true);
    expect(
      isPasskeyCancellation({
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: { name: "NotAllowedError" },
      }),
    ).toBe(true);
    expect(isPasskeyCancellation({ code: "ERROR_CEREMONY_ABORTED" })).toBe(
      true,
    );
  });

  it("does not hide real passkey failures as cancellations", () => {
    expect(
      isPasskeyCancellation({ code: "webauthn_verification_failed" }),
    ).toBe(false);
  });

  it("returns actionable messages for common passkey failures", () => {
    expect(getPasskeyErrorMessage({ code: "passkey_disabled" })).toContain(
      "идэвхгүй",
    );
    expect(
      getPasskeyErrorMessage({ code: "webauthn_credential_exists" }),
    ).toContain("аль хэдийн");
    expect(getPasskeyErrorMessage({ code: "ERROR_INVALID_RP_ID" })).toContain(
      "домэйны тохиргоо",
    );
  });

  it("uses a safe generic message for unknown errors", () => {
    expect(getPasskeyErrorMessage(new Error("internal detail"))).not.toContain(
      "internal detail",
    );
  });
});
