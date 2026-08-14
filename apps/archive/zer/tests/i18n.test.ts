import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LOCALE,
  LOCALES,
  messages,
  translate,
} from "@/lib/i18n/messages";

test("all supported locales contain the same message keys", () => {
  const keys = Object.keys(messages[DEFAULT_LOCALE]).sort();

  for (const locale of LOCALES) {
    assert.deepEqual(Object.keys(messages[locale]).sort(), keys);
  }
});

test("translations interpolate named values", () => {
  assert.equal(
    translate("mn", "onboarding.selectedModules", { count: 3 }),
    "3 модуль сонгосон",
  );
  assert.equal(
    translate("en", "onboarding.selectedModules", { count: 3 }),
    "3 modules selected",
  );
});

test("the Mongolian catalog uses the corrected navigation terms", () => {
  assert.equal(messages.mn["nav.categories"], "Ангиллууд");
  assert.equal(messages.mn["nav.adjustments"], "Үлдэгдэл залруулах");
  assert.equal(messages.mn["auth.login.google"], "Google-ээр нэвтрэх");
});
