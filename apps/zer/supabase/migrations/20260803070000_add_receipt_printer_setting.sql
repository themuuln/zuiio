-- =============================================
-- Receipt printer support
--
-- Adds a POS setting flagging that the shop has a
-- receipt printer attached. When enabled, the POS
-- navigates to the sale receipt and triggers the
-- browser print dialog after each completed sale.
--
-- Defaults to false so existing shops keep current
-- behavior; no new grants or policies are needed
-- (column lives on organizations, covered by the
-- existing org-scoped RLS policies).
-- =============================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS has_receipt_printer boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organizations.has_receipt_printer IS
  'POS: whether the shop has a receipt printer attached (auto-print after sale).';
