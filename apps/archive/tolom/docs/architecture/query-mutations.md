# Tolom Query Mutations

## useOrgMutation Rules

Use `useOrgMutation` for standard API mutations:

1. **Use by default** for create/update/delete
2. **`mutateAsync`** when you need UI cleanup after success
3. **No redundant `refetch()`** after mutation — React Query handles cache
4. **Check `res.ok`** before treating response as success
5. **`void`** for no-input mutations
6. **`function` endpoint + `bodyFn`** for dynamic routes

## Full Example

```tsx
const mutation = useOrgMutation("work-orders", {
  onSuccess: () => {
    toast.success("Амжилттай");
    setOpen(false);
  },
});

// In onSubmit:
const res = await mutation.mutateAsync(bodyFn(formData));
if (!res.ok) throw new Error(res.error);
```
