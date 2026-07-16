# Adding Tools

Tools are the bridge between the LLM and business data. This guide explains how to add new tools to the agent gateway.

## Tool Interface

Every tool implements the `GatewayTool` interface from `src/providers/types.ts`:

```typescript
interface GatewayTool {
  name: string;
  description: string;
  parameters: ToolParam[];
  execute: (
    args: Record<string, unknown>,
    context: ToolContext,
  ) => Promise<unknown>;
}
```

### Context

The `ToolContext` is injected by the gateway layer:

```typescript
interface ToolContext {
  orgId: string;      // Resolved tenant — NEVER from LLM output
  userId: string;     // Resolved user ID
  supabase: SupabaseClient;  // Service-role client (bypasses RLS)
}
```

**Critical:** `orgId` is the resolved tenant. You MUST filter all database queries by this value.

## Step-by-Step

### 1. Define the tool

Add your tool to the appropriate product function in `src/gateway/webhook-helpers.ts`:

```typescript
// ─── Tolom Tools ───────────────────────────────────────────────────────────

function tolomTools(context: ToolContext): GatewayTool[] {
  const { supabase, orgId } = context;

  return [
    // ... existing tools ...

    {
      name: "getTopProducts",
      description: "Энэ сарын хамгийн их борлогдсон бүтээгдэхүүнүүд",
      parameters: [],
      execute: async () => {
        const { data, error } = await supabase
          .from("work_order_items")
          .select("product_name, quantity, total_price")
          .eq("organization_id", orgId)  // ← ALWAYS filter by orgId
          .is("deleted_at", null)
          .order("total_price", { ascending: false })
          .limit(5);

        if (error) {
          return "Бүтээгдэхүүний мэдээлэл авч чадсангүй.";
        }

        if (!data || data.length === 0) {
          return "Энэ сард борлуулалт байхгүй байна.";
        }

        return data
          .map((item, i) =>
            `${i + 1}. ${item.product_name} — ${item.quantity} ширхэг, ${item.total_price}₮`
          )
          .join("\n");
      },
    },
  ];
}
```

### 2. Add parameters (if needed)

Tools can accept parameters from the LLM:

```typescript
{
  name: "searchCustomers",
  description: "Харилцагч хайх нэрээр",
  parameters: [
    {
      name: "query",
      type: "string",
      description: "Хайх нэр (жишээ: 'Бат')",
      required: true,
    },
  ],
  execute: async (args) => {
    const query = args.query as string;
    // ... use query in Supabase filter
  },
}
```

### 3. Handle errors

Never throw from a tool. Return a user-facing error message in Mongolian:

```typescript
execute: async () => {
  try {
    const { data, error } = await supabase
      .from("some_table")
      .select("*")
      .eq("organization_id", orgId);

    if (error) {
      return "Мэдээлэл авч чадсангүй. Өөр үг хэллэгээр асууна уу.";
    }

    // ... process data
  } catch {
    return "Алдаа гарлаа. Дахин оролдоно уу.";
  }
}
```

### 4. Write tools go through confirmation

For write operations (create, update, delete), use the confirmation gate:

```typescript
import { stageAction } from "@/runtime/confirmation";

{
  name: "updateProductPrice",
  description: "Бүтээгдэхүүний үнийг шинэчлэх",
  parameters: [
    { name: "productId", type: "string", description: "Бүтээгдэхүүний ID", required: true },
    { name: "newPrice", type: "number", description: "Шинэ үнэ (₮)", required: true },
  ],
  execute: async (args, context) => {
    const productId = args.productId as string;
    const newPrice = args.newPrice as number;

    // Stage the action for confirmation
    const { nonce, buttons } = stageAction(
      "updateProductPrice",
      { productId, newPrice },
      context.orgId,  // chatId
      context.userId, // userId
      `Үнэ шинэчлэх: ${newPrice}₮`,
    );

    return {
      message: `Үнэ шинэчлэхэд итгэлтэй байна уу?\nШинэ үнэ: ${newPrice}₮`,
      buttons,
      stagedNonce: nonce,
    };
  },
}
```

## Guidelines

### Do

- **Always filter by `orgId`** — every Supabase query must include `.eq("organization_id", orgId)`
- **Return strings** — tool results are injected into the LLM context as text
- **Use Mongolian** — all user-facing text should be in Mongolian
- **Handle errors gracefully** — never throw; return a user-friendly error message
- **Keep results concise** — large results are truncated to 2048 tokens
- **Use `is("deleted_at", null)`** — for soft-deleted records

### Don't

- **Never trust LLM-provided orgId** — always use `context.orgId`
- **Never expose raw DB errors** — use `sanitizeDbError()` or return generic messages
- **Never skip the `orgId` filter** — this is the multi-tenant security invariant
- **Never throw from execute** — catch all errors and return user-friendly messages
- **Never return huge datasets** — paginate or limit results

## Tool Naming

- Use camelCase: `getDailySummary`, `searchCustomers`, `createInvoice`
- Prefix with action verb: `get`, `search`, `create`, `update`, `delete`
- Be specific: `getMonthlySalesReport` not `getReport`

## Testing Tools

See [TESTING.md](TESTING.md) for the test structure. Integration tests for tools live in `tests/integration/tools.test.ts`.

```typescript
it("getDailySummary returns today's data", async () => {
  const tools = tolomTools(mockContext);
  const tool = tools.find(t => t.name === "getDailySummary");
  const result = await tool!.execute({}, mockContext);
  expect(result).toContain("өнөөдөр");
});
```

## Audit

All tool calls are automatically wrapped with `withAudit()` which:
- Records timing (duration in ms)
- Logs tool name, args, and result
- Inserts to `agent_audit_log` table
- Errors are silently caught (audit is fire-and-forget)

No manual audit setup is needed — the gateway applies it automatically.
