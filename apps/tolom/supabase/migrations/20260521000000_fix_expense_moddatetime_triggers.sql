-- Fix: moddatetime() triggers on expense_categories and expenses were created
-- without the required column argument. The moddatetime extension expects
-- `moddatetime(column_name)` — e.g. `moddatetime(updated_at)`.
-- Without the argument, any UPDATE on these tables throws:
--   moddatetime (<table>): A single argument was expected

drop trigger if exists handle_expense_categories_updated_at on expense_categories;
create trigger handle_expense_categories_updated_at
  before update on expense_categories
  for each row execute function moddatetime(updated_at);

drop trigger if exists handle_expenses_updated_at on expenses;
create trigger handle_expenses_updated_at
  before update on expenses
  for each row execute function moddatetime(updated_at);
