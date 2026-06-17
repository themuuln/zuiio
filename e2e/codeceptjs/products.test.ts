/**
 * CodeceptJS BDD tests for products.
 *
 * Run: pnpm run test:e2e:ai
 */

Feature("Products");

Before(({ I }) => {
  I.amOnPage("/login");
  I.fillField('input[name="email"]', "themuuln1@gmail.com");
  I.fillField('input[name="password"]', "Tolom!11");
  I.click('button[type="submit"]');
  I.waitForURL(/\/$/);
});

Scenario("Products page shows product list", ({ I }) => {
  I.amOnPage("/products");
  I.waitForText("Бүтээгдэхүүн", 10);
  I.seeElement("table, .divide-y, [role='grid']");
});

Scenario("Products page has new product button", ({ I }) => {
  I.amOnPage("/products");
  I.see("Шинэ бүтээгдэхүүн");
});
