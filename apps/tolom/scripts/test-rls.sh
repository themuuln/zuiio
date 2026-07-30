#!/usr/bin/env bash
# RLS Integration Test — Verifies Customer Portal RLS Policies
set -euo pipefail

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
PSQL="psql $DB_URL -At"

echo "=== RLS Integration Tests for Customer Portal ==="

echo ""
echo "1. Checking RLS is enabled on relevant tables..."
for table in customers vehicle_owners vehicles digital_vehicle_inspections dvi_inspection_items work_orders invoices; do
  enabled=$(echo "SELECT COUNT(*) FROM pg_policies WHERE tablename='\${table}';" | $PSQL | tr -d ' ')
  if [ "$enabled" -gt 0 ]; then
    echo "   ✅ $table — $enabled policy(ies) exist (RLS enabled)"
  else
    echo "   ❌ $table — NO policies (RLS may be off)"
  fi
done

echo ""
echo "2. Checking customer-portal RLS policies exist..."
for policy_name in \
  "Customers can view own record" \
  "Customers can view their own vehicle ownerships" \
  "Customers can view their own vehicles" \
  "Customers can view inspections for their vehicles" \
  "Customers can view their inspection items" \
  "Customers can update their inspection items (approve/decline)" \
  "Customers can view work orders for their vehicles" \
  "Customers can view work order services for their vehicles" \
  "Customers can view work order parts for their vehicles" \
  "Customers can view their invoices" \
  "Customers can view their invoice items" \
  "Customers can view their invoice payments"; do
  count=$(echo "SELECT COUNT(*) FROM pg_policies WHERE policyname='${policy_name}';" | $PSQL)
  if [ "$count" -gt 0 ]; then
    echo "   ✅ $policy_name"
  else
    echo "   ❌ $policy_name — MISSING"
  fi
done

echo ""
echo "3. Checking indexes for portal performance..."
for idx in idx_customers_customer_user_id idx_vehicle_owners_customer; do
  count=$(echo "SELECT COUNT(*) FROM pg_indexes WHERE indexname='${idx}';" | $PSQL)
  if [ "$count" -gt 0 ]; then echo "   ✅ $idx — exists"
  else echo "   ❌ $idx — MISSING"; fi
done

echo ""
echo "4. Checking DVI table indexes for query performance..."
for idx in idx_dvi_org idx_dvi_vehicle idx_dvi_status idx_dvi_customer_token idx_dvi_items_inspection idx_dvi_items_inspection_category; do
  count=$(echo "SELECT COUNT(*) FROM pg_indexes WHERE indexname='${idx}';" | $PSQL)
  if [ "$count" -gt 0 ]; then echo "   ✅ $idx — exists"
  else echo "   ❌ $idx — MISSING"; fi
done

echo ""
echo "5. EXPLAIN: Portal vehicle lookup via customer_user_id (portal dashboard query):"
echo "
EXPLAIN (ANALYZE false, COSTS true, BUFFERS false, FORMAT text)
SELECT v.id, v.plate_number
FROM vehicles v
WHERE v.id IN (
  SELECT vo.vehicle_id FROM vehicle_owners vo
  WHERE vo.customer_id IN (
    SELECT c.id FROM customers c WHERE c.customer_user_id = '00000000-0000-0000-0000-000000000000'
  )
)
LIMIT 5;
" | $PSQL -X

echo ""
echo "6. EXPLAIN: Portal DVI list (inspections page query):"
echo "
EXPLAIN (ANALYZE false, COSTS true, FORMAT text)
SELECT dvi.id, dvi.status, dvi.created_at
FROM digital_vehicle_inspections dvi
WHERE dvi.vehicle_id IN (
  SELECT vo.vehicle_id FROM vehicle_owners vo
  WHERE vo.customer_id IN (
    SELECT c.id FROM customers c WHERE c.customer_user_id = '00000000-0000-0000-0000-000000000000'
  )
)
AND dvi.status IN ('sent','partially_approved','approved','declined','converted')
ORDER BY dvi.created_at DESC
LIMIT 10;
" | $PSQL -X

echo ""
echo "7. EXPLAIN: Portal DVI items (inspection detail query):"
echo "
EXPLAIN (ANALYZE false, COSTS true, FORMAT text)
SELECT dvi.*
FROM digital_vehicle_inspections dvi
WHERE dvi.id = '00000000-0000-0000-0000-000000000000'
AND dvi.vehicle_id IN (
  SELECT vo.vehicle_id FROM vehicle_owners vo
  WHERE vo.customer_id IN (
    SELECT c.id FROM customers c WHERE c.customer_user_id = '00000000-0000-0000-0000-000000000000'
  )
);
" | $PSQL -X

echo ""
echo "=== Done ==="