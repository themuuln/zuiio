# Flow Executor — TODO

## Дууссан

- [x] Flow Executor types (flow schema, execution state, node results)
- [x] Flow Interpreter (deterministic graph walker)
- [x] 9 node handlers (sendMessage, askQuestion, condition, setField, delay, action, cardCarousel, aiReply, abTest)
- [x] Persistence layer (flow versions, conversation runs, wait states, outbox)
- [x] Public API (handleFlowMessage, handleFlowCallback, resumeDelayedFlows)
- [x] Publish API (agent-gateway: validation + write to flow_versions)
- [x] Zatly publish route (calls agent-gateway API)
- [x] Webhook integration (Facebook + Telegram: flow routing before AI agent)
- [x] Cron route (resume delayed flows)
- [x] Supabase migration (4 tables: flow_versions, conversation_runs, flow_wait_states, flow_outbox)
- [x] ProductType-д "zatly" нэмсэн

## Дараагийн алхмууд

### Шаардлагатай (Must)

1. **Agent-gateway URL тохируулах**
   - Zatly-ийн environment variable-уудыг тохируулах
   - `AGENT_GATEWAY_URL` = agent-gateway-ийн URL
   - `AGENT_GATEWAY_API_KEY` = API нууц үг

2. **Zatly "Publish" товчоос API дуудах**
   - FlowBuilder component-оос `POST /api/flow/publish` дуудах хэсгийг холбох
   - automationId, orgId, nodes, edges илгээх

3. **Cron job тохируулах**
   - Vercel cron эсвэл Supabase pg_cron ашиглан
   - `POST /api/cron/resume-flows`-ийг 5 минут тутам ажиллуулах

4. **Meta Business Verification**
   - Facebook Messenger-ийг production-д нээх
   - ~4 хоног хугацаа шаардлагатай

### Сонирхолтой (Should)

5. **Zatly-ийн Supabase Edge Function retire хийх**
   - `supabase/functions/facebook-webhook/index.ts`-ийг flow executorоор солих
   - Partial runtime-ыг арилгах

6. **Outbox pattern тест хийх**
   - Message send fail → retry → success жишээг шалгах
   - DB commit болон channel send хоорондын зөрүүг шалгах

7. **A/B test stickiness тест хийх**
   - Нэг хэрэглэгч 2 удаа flow-оор орвол нэг л variant харуулах
   - Hash-based assignment ажиллаж байгааг шалгах

8. **Flow version pinning тест хийх**
   - V1 run үргэлжилж байхад V2 publish
   - V1 run V1-ээ дуусгах, V2 зөвхөн шинэ run-д

### Боломжит (Could)

9. **WhatsApp channel нэмэх**
   - WhatsApp webhook handler бичих
   - Flow executor WhatsApp-д ажиллаж байгааг шалгах

10. **Flow analytics**
    - Node бүрийн execution count, error rate
    - Conversion rate (start → end)
    - A/B test results dashboard

11. **Flow templates**
    - Зургаар хийсэн flow-уудыг template болгох
    - Template library-гээс шинэ flow үүсгэх

12. **Multi-language support**
    - Flow node бүрд хэлний сонголт нэмэх
    - Автомат хэл илрүүлэлт (Cyrillic → Mongolian, Latin → English)
