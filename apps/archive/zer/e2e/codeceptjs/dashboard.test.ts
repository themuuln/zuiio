/**
 * Comprehensive CodeceptJS BDD tests for the dashboard.
 * The heal plugin auto-recovers from broken selectors.
 *
 * Run: pnpm run test:e2e:ai
 */

Feature("Dashboard");

Before(({ I }) => {
  I.amOnPage("/login");
  I.waitForElement('input[name="email"]', 10);
  I.fillField('input[name="email"]', "themuuln1@gmail.com");
  I.fillField('input[name="password"]', "Tolom!11");
  I.click('button[type="submit"]');
});

Scenario("Dashboard shows KPIs", ({ I }) => {
  I.amOnPage("/");
  I.waitForText("Өнөөдрийн борлуулалт", 10);
  I.see("Өнөөдрийн зарлага");
  I.seeElement("main");
});

Scenario("Dashboard has recent sales section", ({ I }) => {
  I.amOnPage("/");
  I.see("Сүүлийн борлуулалтууд");
});
