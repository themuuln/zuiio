# Tolom Common Pitfalls

## 1. Silent error swallowing

```ts
// ❌ WRONG — error silently lost
const { data } = await supabase.from('products').select('*');

// ✅ CORRECT — error captured
const { data, error } = await supabase.from('products').select('*');
if (error) { reportServerError('query', error); }
```

## 2. Type casting on insert/update

```ts
// ❌ WRONG — suppresses type checking
await supabase.from('products').insert(data as unknown as Record<string, unknown>);

// ✅ CORRECT — explicit typed insert
await supabase.from('products').insert({ name: data.name, price: data.price });
```

## 3. Raw NextResponse.json() in API routes

```ts
// ❌ WRONG — bypasses project pattern
return NextResponse.json({ data });

// ✅ CORRECT — uses handler wrapper
return ok({ data });
```

## 4. Direct inventory mutation

```ts
// ❌ WRONG — violates append-only ledger
await supabase.from('inventory').update({ quantity: newQty }).eq('id', itemId);

// ✅ CORRECT — record a ledger entry
await supabase.from('inventory_ledger').insert({ item_id: itemId, quantity_change: delta, ... });
```

## 5. Missing i18n updates

When adding a user-facing string, ALWAYS update both `mn.json` and `en.json`. Removing a string? Remove from both.
