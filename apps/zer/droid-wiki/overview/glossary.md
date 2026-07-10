# Glossary

Active contributors: themuuln

Project-specific terms and domain vocabulary used throughout the Zer ERP codebase.

## Mongolian business terms

| Mongolian          | English         | Context                                 |
| ------------------ | --------------- | --------------------------------------- |
| Борлуулалт         | Sale            | Sales transactions and registration     |
| Дэлгүүр            | Shop            | POS / point-of-sale module              |
| Зарлага            | Expense         | Expense tracking                        |
| Худалдан авалт     | Purchase        | Procurement / purchase orders           |
| Буцаалт            | Return          | Sales/purchase returns                  |
| Нэхэмжлэх          | Invoice         | Billing documents                       |
| Үнийн санал        | Quotation       | Price quotes / estimates                |
| Хямдрал            | Discount        | Sales promotions                        |
| Тайлан             | Report          | Analytics and reports                   |
| Комисс             | Commission      | Salesperson commissions                 |
| Нягтлан            | Accounting      | Double-entry bookkeeping                |
| Бүтээгдэхүүн       | Product         | Inventory items                         |
| Ангилал            | Category        | Product categories                      |
| Агуулах            | Warehouse       | Storage locations                       |
| Үлдэгдэл хөдөлгөөн | Stock movement  | Inventory movement history              |
| Салбар             | Branch          | Physical location / outlet              |
| Харилцагч          | Customer/Client | Contact entity (buyer)                  |
| Нийлүүлэгч         | Supplier        | Vendor (seller)                         |
| Хяналтын самбар    | Dashboard       | Home / overview page                    |
| Тохиргоо           | Settings        | Configuration                           |
| Брэнд              | Brand           | Product brand                           |
| Вариант            | Variant         | Product variation (size, color, flavor) |
| Багц               | Bundle          | Product kit / bundle                    |
| Үйлдлийн түүх      | Audit log       | Activity history                        |
| Эрх                | Permission      | Access right                            |
| Үүрэг              | Role            | User role / role definition             |
| Данс               | Account         | GL account                              |
| Журналын бичилт    | Journal entry   | GL journal entry                        |
| Туршилтын баланс   | Trial balance   | Trial balance report                    |
| Авлага             | Receivable      | Accounts receivable / customer balance  |
| Өглөг              | Payable         | Accounts payable / supplier balance     |

## Technical terms

| Term                         | Definition                                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `requireAppContext()`        | Server-side function that authenticates the user, loads their organization context, and returns Supabase client + org/branch IDs + permissions |
| `checkPermission()`          | Server-side permission guard against the `app_permission` enum                                                                                 |
| `requireWriteAction()`       | Convenience wrapper that combines `requireAppContext()` + `checkPermission()` + branch scope guard                                             |
| `withBranchFilter()`         | Helper that conditionally adds a branch_id filter to Supabase queries based on user scope and URL params                                       |
| RLS                          | Row-Level Security — PostgreSQL policies that enforce org isolation and permission checks at the database level                                |
| `get_current_organization()` | SECURITY DEFINER RPC function that returns the current user's organization_id                                                                  |
| `app_permission`             | PostgreSQL enum defining all granular permissions (e.g., `sales.create`, `products.read`)                                                      |
| Server Component             | React Server Component — fetches data server-side, no client JS needed                                                                         |
| Server Action                | Next.js server-side function called from client components for mutations                                                                       |
| Slide-in drawer              | Base UI Drawer component used for all create/edit/detail views                                                                                 |
| SSR                          | Server-Side Rendering                                                                                                                          |
| RSC                          | React Server Components                                                                                                                        |
