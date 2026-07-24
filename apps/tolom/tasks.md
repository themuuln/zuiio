# Finance Analytics Service Tests

## Task: profitability-test
Write tests for `src/lib/services/report-service/profitability.ts`
- Files: src/lib/services/report-service/profitability.test.ts (NEW)
- Tests for: calculateProfitability, getWorkOrderProfit, getDashboardProfitSummary, getPnLSummary, getPreviousPeriodSummary
- Use createMockSupabaseClient from @/test/mocks/supabase
- Mock withCache like other report-service tests do

## Task: revenue-test
Write tests for `src/lib/services/report-service/revenue.ts`
- Files: src/lib/services/report-service/revenue.test.ts (NEW)
- Tests for: getRevenueForecast, getRevenueTargets, setRevenueTarget
- Use createMockSupabaseClient from @/test/mocks/supabase
- Mock withCache like other report-service tests do

## Task: insights-test
Write tests for `src/lib/services/report-service/insights.ts`
- Files: src/lib/services/report-service/insights.test.ts (NEW)
- Tests for: generateInsights, generateReportInsights
- Use createMockSupabaseClient from @/test/mocks/supabase
- Mock withCache like other report-service tests do
