# Zer Optimistic Mutations

All CRUD uses `useOptimisticCreate`/`useOptimisticUpdate`/`useOptimisticDelete` from `@zuiio/query`.

```tsx
import { useOptimisticCreate } from "@zuiio/query";
import { entityKeys } from "@/lib/query/keys";

const mutation = useOptimisticCreate({
  mutationFn: async (formData: FormData) => {
    const result = await createEntity(undefined, formData);
    if (result?.error) throw new Error(result.error);
    return result;
  },
  queryKey: entityKeys.all,
  buildOptimistic: (formData) => ({
    id: `opt-${Date.now()}`,
    name: formData.get("name")?.toString() ?? "",
  }),
});

// In onSubmit:
mutation.mutate(formData, { onSuccess: () => { setOpen(false); reset(); toast.success("Амжилттай."); } });
```

**Already migrated entities** (DO NOT revert): Products, Categories, Customers, Suppliers, Bundles, Invoices, Discounts, Quotations, Returns, Purchase Orders, Accounts, Journal Entries.
