-- zer perf: index unindexed foreign keys + drop provably redundant indexes
-- Applied to production krrkhozadforrydffegg 2026-08-12 (advisor findings).

-- =====================================================================
-- 1. Covering indexes for unindexed foreign keys (advisor: unindexed FK)
--    Idempotent; guards used only where the target table/column is
--    remote-only (absent from local migrations replay).
-- =====================================================================
-- idx_mfa_challenges_factor_id: platform-managed schema (auth.mfa_challenges.factor_id); skip when current role cannot create
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_mfa_challenges_factor_id ON auth.mfa_challenges(factor_id);
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'skipped idx_mfa_challenges_factor_id on auth.mfa_challenges (insufficient privilege)';
  END;
END $$;
-- idx_saml_relay_states_flow_state_id: platform-managed schema (auth.saml_relay_states.flow_state_id); skip when current role cannot create
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_saml_relay_states_flow_state_id ON auth.saml_relay_states(flow_state_id);
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'skipped idx_saml_relay_states_flow_state_id on auth.saml_relay_states (insufficient privilege)';
  END;
END $$;
-- idx_oauth_authorizations_client_id: platform-managed schema (auth.oauth_authorizations.client_id); skip when current role cannot create
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_oauth_authorizations_client_id ON auth.oauth_authorizations(client_id);
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'skipped idx_oauth_authorizations_client_id on auth.oauth_authorizations (insufficient privilege)';
  END;
END $$;
-- idx_oauth_authorizations_user_id: platform-managed schema (auth.oauth_authorizations.user_id); skip when current role cannot create
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_oauth_authorizations_user_id ON auth.oauth_authorizations(user_id);
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'skipped idx_oauth_authorizations_user_id on auth.oauth_authorizations (insufficient privilege)';
  END;
END $$;
-- idx_s3_multipart_uploads_parts_bucket_id: platform-managed schema (storage.s3_multipart_uploads_parts.bucket_id); skip when current role cannot create
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_s3_multipart_uploads_parts_bucket_id ON storage.s3_multipart_uploads_parts(bucket_id);
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'skipped idx_s3_multipart_uploads_parts_bucket_id on storage.s3_multipart_uploads_parts (insufficient privilege)';
  END;
END $$;
-- idx_s3_multipart_uploads_parts_upload_id: platform-managed schema (storage.s3_multipart_uploads_parts.upload_id); skip when current role cannot create
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_s3_multipart_uploads_parts_upload_id ON storage.s3_multipart_uploads_parts(upload_id);
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'skipped idx_s3_multipart_uploads_parts_upload_id on storage.s3_multipart_uploads_parts (insufficient privilege)';
  END;
END $$;






CREATE INDEX IF NOT EXISTS idx_products_published_by ON public.products(published_by);
CREATE INDEX IF NOT EXISTS idx_sales_bank_account_id ON public.sales(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_sales_currency_id ON public.sales(currency_id);
CREATE INDEX IF NOT EXISTS idx_expenses_bank_account_id ON public.expenses(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_currency_id ON public.expenses(currency_id);
CREATE INDEX IF NOT EXISTS idx_shared_reports_branch_id ON public.shared_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_report_email_log_organization_id ON public.report_email_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_branch_id ON public.commission_payouts(branch_id);
CREATE INDEX IF NOT EXISTS idx_discount_conditions_discount_id ON public.discount_conditions(discount_id);
CREATE INDEX IF NOT EXISTS idx_product_bundle_items_bundle_id ON public.product_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_telegram_agent_links_user_id ON public.telegram_agent_links(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_approved_by ON public.leave_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_product_attribute_categories_organization_id ON public.product_attribute_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_price_list_segments_organization_id ON public.price_list_segments(organization_id);
CREATE INDEX IF NOT EXISTS idx_price_list_rules_organization_id ON public.price_list_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_account_entries_actor_id ON public.customer_account_entries(actor_id);
CREATE INDEX IF NOT EXISTS idx_order_template_items_product_id ON public.order_template_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_template_items_organization_id ON public.order_template_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_order_template_items_variant_id ON public.order_template_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_business_event_stock_targets_product_id ON public.business_event_stock_targets(product_id);
CREATE INDEX IF NOT EXISTS idx_business_event_stock_targets_category_id ON public.business_event_stock_targets(category_id);
CREATE INDEX IF NOT EXISTS idx_business_event_stock_targets_organization_id ON public.business_event_stock_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_sale_addons_organization_id ON public.sale_addons(organization_id);
CREATE INDEX IF NOT EXISTS idx_sale_addons_gift_option_id ON public.sale_addons(gift_option_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_branch_id ON public.cash_registers(branch_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_branch_id ON public.cash_sessions(branch_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened_by ON public.cash_sessions(opened_by);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_closed_by ON public.fiscal_periods(closed_by);
CREATE INDEX IF NOT EXISTS idx_bom_items_material_product_id ON public.bom_items(material_product_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_bom_id ON public.production_orders(bom_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_created_by ON public.production_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_production_orders_product_id ON public.production_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_production_stages_organization_id ON public.production_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_production_materials_organization_id ON public.production_materials(organization_id);
CREATE INDEX IF NOT EXISTS idx_production_materials_source_bom_item_id ON public.production_materials(source_bom_item_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_checked_by ON public.quality_checks(checked_by);
CREATE INDEX IF NOT EXISTS idx_quality_checks_production_stage_id ON public.quality_checks(production_stage_id);
CREATE INDEX IF NOT EXISTS idx_production_stage_labor_employee_id ON public.production_stage_labor(employee_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_branch_id ON public.deliveries(branch_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_provider_id ON public.deliveries(provider_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_zone_id ON public.deliveries(zone_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_history_changed_by ON public.delivery_status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_delivery_webhooks_organization_id ON public.delivery_webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_delivery_webhooks_provider_id ON public.delivery_webhooks(provider_id);
CREATE INDEX IF NOT EXISTS idx_messenger_agent_links_user_id ON public.messenger_agent_links(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_organization_id ON public.coupon_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_sale_id ON public.coupon_usage(sale_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_created_by ON public.gift_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_created_by ON public.gift_card_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_promotions_created_by ON public.promotions(created_by);
CREATE INDEX IF NOT EXISTS idx_promotion_rewards_reward_product_id ON public.promotion_rewards(reward_product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_contact_id ON public.reviews(contact_id);
CREATE INDEX IF NOT EXISTS idx_reviews_moderated_by ON public.reviews(moderated_by);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_by ON public.blog_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_warehouse_id ON public.stock_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_warehouse_id ON public.stock_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_product_id ON public.stock_transfer_items(product_id);
CREATE INDEX IF NOT EXISTS idx_bot_buyer_sessions_organization_id ON public.bot_buyer_sessions(organization_id);

-- ---- guarded: remote-only tables / columns (safe no-op locally) ----
DO $$
BEGIN
  IF to_regclass('public.purchase_orders') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.purchase_orders') AND a.attname = 'currency_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_currency_id ON public.purchase_orders(currency_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.loyalty_points') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.loyalty_points') AND a.attname = 'organization_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_loyalty_points_organization_id ON public.loyalty_points(organization_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.loyalty_rewards') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.loyalty_rewards') AND a.attname = 'organization_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_organization_id ON public.loyalty_rewards(organization_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.notification_channels') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.notification_channels') AND a.attname = 'organization_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_notification_channels_organization_id ON public.notification_channels(organization_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.message_templates') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.message_templates') AND a.attname = 'channel_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_message_templates_channel_id ON public.message_templates(channel_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.message_templates') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.message_templates') AND a.attname = 'organization_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_message_templates_organization_id ON public.message_templates(organization_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.message_log') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.message_log') AND a.attname = 'template_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_message_log_template_id ON public.message_log(template_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.message_log') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.message_log') AND a.attname = 'channel_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_message_log_channel_id ON public.message_log(channel_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.message_log') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.message_log') AND a.attname = 'organization_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_message_log_organization_id ON public.message_log(organization_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.conversation_runs') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.conversation_runs') AND a.attname = 'flow_version_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_conversation_runs_flow_version_id ON public.conversation_runs(flow_version_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.flow_wait_states') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.flow_wait_states') AND a.attname = 'run_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_flow_wait_states_run_id ON public.flow_wait_states(run_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.flow_outbox') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.flow_outbox') AND a.attname = 'run_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_flow_outbox_run_id ON public.flow_outbox(run_id);
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.agent_webchat_widgets') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.oid = to_regclass('public.agent_webchat_widgets') AND a.attname = 'organization_id'
      AND a.attnum > 0 AND NOT a.attisdropped) THEN
    CREATE INDEX IF NOT EXISTS idx_agent_webchat_widgets_organization_id ON public.agent_webchat_widgets(organization_id);
  END IF;
END $$;

-- =====================================================================
-- 2. Drop provably redundant indexes (idx_scan = 0, non-unique, not
--    constraint-backed; either columns a strict prefix of a covering
--    index or an exact duplicate of a unique constraint index)
-- =====================================================================
-- idx_blog_posts_org: covered by idx_blog_posts_org_published (organization_id, is_published, published_at)
DROP INDEX IF EXISTS public.idx_blog_posts_org;
-- idx_coupons_org: covered by idx_coupons_code (organization_id, code)
DROP INDEX IF EXISTS public.idx_coupons_org;
-- idx_currencies_org: covered by idx_currencies_org_code (organization_id, code)
DROP INDEX IF EXISTS public.idx_currencies_org;
-- idx_gift_cards_org: covered by idx_gift_cards_code (organization_id, code)
DROP INDEX IF EXISTS public.idx_gift_cards_org;
-- idx_pad_org: covered by idx_pad_slug (organization_id, slug)
DROP INDEX IF EXISTS public.idx_pad_org;
-- idx_promotions_org: covered by idx_promotions_active (organization_id, is_active)
DROP INDEX IF EXISTS public.idx_promotions_org;
-- idx_reviews_org: covered by idx_reviews_org_status (organization_id, status)
DROP INDEX IF EXISTS public.idx_reviews_org;
-- idx_reviews_product: covered by idx_reviews_product_status (product_id, status)
DROP INDEX IF EXISTS public.idx_reviews_product;
-- idx_shared_reports_organization_id: covered by idx_shared_reports_org_date_range (organization_id, date_from, date_to)
DROP INDEX IF EXISTS public.idx_shared_reports_organization_id;
-- idx_webhook_deliveries_org: covered by idx_webhook_deliveries_status (organization_id, status)
DROP INDEX IF EXISTS public.idx_webhook_deliveries_org;
-- idx_warehouse_products_warehouse_id: covered by idx_warehouse_products_org_lookup (warehouse_id, product_id)
DROP INDEX IF EXISTS public.idx_warehouse_products_warehouse_id;
-- idx_attendance_employee_date: exact duplicate of unique constraint attendance_records_employee_id_date_key
DROP INDEX IF EXISTS public.idx_attendance_employee_date;
-- idx_fiscal_periods_org_period: exact duplicate of unique constraint fiscal_periods_organization_id_period_name_key
DROP INDEX IF EXISTS public.idx_fiscal_periods_org_period;
-- idx_pad_slug: exact duplicate of unique constraint product_attribute_definitions_org_slug_unique
DROP INDEX IF EXISTS public.idx_pad_slug;
-- idx_pls_pl: covered by unique constraint pls_unique (price_list_id, customer_segment_id)
DROP INDEX IF EXISTS public.idx_pls_pl;
-- idx_coupons_code: exact duplicate of unique constraint coupons_organization_id_code_key
DROP INDEX IF EXISTS public.idx_coupons_code;
-- idx_gift_cards_code: exact duplicate of unique constraint gift_cards_organization_id_code_key
DROP INDEX IF EXISTS public.idx_gift_cards_code;

