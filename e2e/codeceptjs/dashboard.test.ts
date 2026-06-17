/**
 * Comprehensive CodeceptJS BDD tests for the dashboard.
 * The heal plugin auto-recovers from broken selectors.
 *
 * Run: pnpm run test:e2e:ai
 */

Feature("Dashboard");

Before(({ I }) => {
  I.amOnPage("/login");
  I.fillField('input[name="email"]', "themuuln1@gmail.com");
  I.fillField('input[name="password"]', "Tolom!11");
  I.click('button[type="submit"]');
  I.waitForURL(/\/$/);
});

Scenario("Dashboard shows KPIs", ({ I }) => {
  I.see("Борлуулалт");
  I.see("Зарлага");
  I.seeElement("main");
});

Scenario("Dashboard has recent sales section", ({ I }) => {
  I.see("Сүүлийн үеийн борлуулалтууд");
});
