/**
 * CodeceptJS BDD tests for products.
 *
 * Run: pnpm run test:e2e:ai
 */

Feature("Products");

Before(({ I }) => {
  I.amOnPage("/login");
  I.waitForElement('input[name="email"]', 10);
  I.fillField('input[name="email"]', "themuuln1@gmail.com");
  I.fillField('input[name="password"]', "Tolom!11");
  I.click('button[type="submit"]');
});

Scenario("Products page shows product list", ({ I }) => {
  I.amOnPage("/products");
  I.see("Бүтээгдэхүүн");
});

Scenario("Products page has new product button", ({ I }) => {
  I.amOnPage("/products");
  I.see("Шинэ бүтээгдэхүүн");
});
