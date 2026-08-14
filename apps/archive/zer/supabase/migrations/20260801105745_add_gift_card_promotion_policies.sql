-- Gift Cards: admin CRUD
CREATE POLICY "gift_cards_select_own_org" ON public.gift_cards
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('gift_cards.read'::public.app_permission)
  );

CREATE POLICY "gift_cards_insert_own_org" ON public.gift_cards
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND has_permission('gift_cards.create'::public.app_permission)
  );

CREATE POLICY "gift_cards_update_own_org" ON public.gift_cards
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('gift_cards.update'::public.app_permission)
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND has_permission('gift_cards.update'::public.app_permission)
  );

CREATE POLICY "gift_cards_delete_own_org" ON public.gift_cards
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('gift_cards.delete'::public.app_permission)
  );

-- Gift Card Transactions: insert on sale, select for history
CREATE POLICY "gct_select_own_org" ON public.gift_card_transactions
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND (
      has_permission('gift_cards.read'::public.app_permission)
      OR has_permission('sales.read'::public.app_permission)
    )
  );

CREATE POLICY "gct_insert_own_org" ON public.gift_card_transactions
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND (
      has_permission('gift_cards.update'::public.app_permission)
      OR has_permission('sales.create'::public.app_permission)
    )
  );
CREATE POLICY "promotions_select_own_org" ON public.promotions
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('promotions.read'::public.app_permission)
  );

CREATE POLICY "promotions_insert_own_org" ON public.promotions
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND has_permission('promotions.create'::public.app_permission)
  );

CREATE POLICY "promotions_update_own_org" ON public.promotions
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('promotions.update'::public.app_permission)
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND has_permission('promotions.update'::public.app_permission)
  );

CREATE POLICY "promotions_delete_own_org" ON public.promotions
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('promotions.delete'::public.app_permission)
  );

-- Conditions: cascade through promotion
CREATE POLICY "promotion_conditions_select" ON public.promotion_conditions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.promotions p
      WHERE p.id = promotion_id
        AND p.organization_id = (SELECT get_current_organization())
        AND has_permission('promotions.read'::public.app_permission)
    )
  );

CREATE POLICY "promotion_conditions_insert" ON public.promotion_conditions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.promotions p
      WHERE p.id = promotion_id
        AND p.organization_id = (SELECT get_current_organization())
        AND has_permission('promotions.create'::public.app_permission)
    )
  );

CREATE POLICY "promotion_conditions_delete" ON public.promotion_conditions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.promotions p
      WHERE p.id = promotion_id
        AND p.organization_id = (SELECT get_current_organization())
        AND has_permission('promotions.update'::public.app_permission)
    )
  );

-- Rewards: cascade through promotion
CREATE POLICY "promotion_rewards_select" ON public.promotion_rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.promotions p
      WHERE p.id = promotion_id
        AND p.organization_id = (SELECT get_current_organization())
        AND has_permission('promotions.read'::public.app_permission)
    )
  );

CREATE POLICY "promotion_rewards_insert" ON public.promotion_rewards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.promotions p
      WHERE p.id = promotion_id
        AND p.organization_id = (SELECT get_current_organization())
        AND has_permission('promotions.create'::public.app_permission)
    )
  );

CREATE POLICY "promotion_rewards_delete" ON public.promotion_rewards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.promotions p
      WHERE p.id = promotion_id
        AND p.organization_id = (SELECT get_current_organization())
        AND has_permission('promotions.update'::public.app_permission)
    )
  );