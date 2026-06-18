/**
 * CodeceptJS + AI sample test for login flow.
 *
 * Uses the Playwright helper under the hood.
 * The `heal` plugin automatically retries failed steps with AI.
 *
 * Run: npx codeceptjs run --ai
 */

Feature("Login");

Before(({ I }) => {
  I.amOnPage("/login");
});

Scenario("Login with valid credentials", ({ I }) => {
  I.fillField('input[name="email"]', "themuuln1@gmail.com");
  I.fillField('input[name="password"]', "Tolom!11");
  I.click('button[type="submit"]');
  I.waitForURL(/\/$/, {});
  I.seeInCurrentUrl("/");
});

Scenario("Shows validation error with empty fields", ({ I }) => {
  I.click('button[type="submit"]');
  I.see("шаардлагатай");
});
