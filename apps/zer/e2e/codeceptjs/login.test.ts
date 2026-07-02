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
  I.waitForElement('input[name="email"]', 10);
});

Scenario("Login with valid credentials", ({ I }) => {
  I.fillField('input[name="email"]', "themuuln1@gmail.com");
  I.fillField('input[name="password"]', "Tolom!11");
  I.click('button[type="submit"]');
  I.seeInCurrentUrl("/");
});

Scenario("Shows validation error with invalid credentials", ({ I }) => {
  I.fillField('input[name="email"]', "wrong@test.com");
  I.fillField('input[name="password"]', "wrong1234");
  I.click('button[type="submit"]');
  I.waitForText("Invalid login credentials", 10);
  I.see("Invalid login credentials");
});
