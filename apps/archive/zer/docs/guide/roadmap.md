---
title: Хөгжүүлэлтийн төлөвлөгөө
desc: Төлөвлөгдсөн фичерүүд, хялбараас хэцүү рүү эрэмбэлсэн
---

# Хөгжүүлэлтийн төлөвлөгөө

Zer ERP-ийн хөгжүүлэлтийн төлөвлөгөө. Хялбараас хэцүү рүү, хамгийн хэрэгцээтэйгээс эхлэн эрэмбэлсэн.

> Төлөв байдал 2026-08-03: `✅` = хэрэгжсэн, `⬜` = төлөвлөгдсөн (баримт бичиг бэлэн, код гараагүй).

---

## 1-р үе: Маш хялбар (хэдэн цаг–1 өдөр)

- [x] [Баркод шошго хэвлэх](/guide/features/barcode-label.html) — products.barcode + POS баркод сканнер (камер + wedge)
- [x] [Үнийн жагсаалт (Price Lists)](/guide/features/price-lists.html) — price_lists + price_list_rules + pricing.ts
- [ ] [Файл хавсаргах](/guide/features/attachments.html) — ⬜ төлөвлөгдсөн

## 2-р үе: Хялбар (1–2 өдөр)

- [x] [Төсөв vs бодит дүн (Budget vs Actual)](/guide/features/budget-vs-actual.html) — /budget
- [x] [Харилцагчид мэдэгдэл](/guide/features/customer-notifications.html) — Telegram + email + web-push (notification_configs, push_subscriptions)
- [ ] [Батлуулах урсгал (Approval Workflows)](/guide/features/approvals.html) — ⬜ төлөвлөгдсөн
- [x] [Санхүүгийн тайлан (P&L, Balance Sheet)](/guide/features/financial-statements.html) — financial_statement_functions

## 3-р үе: Дунд (3–5 өдөр)

- [x] [Цалин / Хүний нөөц](/guide/features/payroll.html) — /hr/payroll (payroll_runs, payroll_items)
- [ ] [Үндсэн хөрөнгийн бүртгэл](/guide/features/fixed-assets.html) — ⬜ төлөвлөгдсөн
- [ ] [Харилцагчийн портал](/guide/features/customer-portal.html) — ⬜ төлөвлөгдсөн
- [x] [API / Webhooks](/guide/features/api-webhooks.html) — webhook_subscriptions + HMAC delivery

## 4-р үе: Хэцүү (1–3 долоо хоног)

- [x] [Үнэнч байдлын хөтөлбөр (Loyalty)](/guide/features/loyalty.html) — /loyalty
- [x] [Үйлдвэрлэл / BOM](/guide/features/manufacturing-bom.html) — /bom + /production (захиалга, өртөг)

---

## 2026-08-03-д нэмэгдсэн (e-commerce + differentiation)

- [x] Offline-first POS — IndexedDB mutation queue (`@zuiio/offline`) + SW v4 + query-cache persistence
- [x] AI туслах — `/ai-assistant` (runWithTools + org-scoped tools)
- [x] Web-push мэдэгдэл — VAPID + push_subscriptions
- [x] Дэлгүүрийн худалдан авагчийн бүртгэл — store_accounts + get_my_orders + `/[slug]/account`
- [x] Худалдан авагчийн нийтийн захиалга — `submit_shop_order` RPC (server-side pricing)
- [x] Dashboard загварууд — dashboard_template (default/retail/financial/inventory)
- [x] Олон байршил — stock_transfers + approve_stock_transfer RPC
- [x] Hardware — wedge баркод сканнер + has_receipt_printer авто-принт + **ESC/POS драйвер** (`/api/hardware/escpos` мост, `escpos_host`/`escpos_port`) + **мөнгөн хайрцаг** (`has_cash_drawer`, бэлэн төлбөрт нээгдэнэ) + **терминал** (`/terminal/pos` дэлгэц дүүрэн kiosk)
- [x] Embeddable analytics — embed_tokens + `/embed/report` iframe
- [x] Хэрэглэгчийн mobile app — `apps/zer-mobile` (Expo)
