# Zer Forms and Drawers

## Forms

All forms use **react-hook-form** + **zod** + **Server Actions**:

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1, "Нэр шаардлагатай") });
type Values = z.infer<typeof schema>;

export default function MyForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Values) => {
    const formData = new FormData();
    formData.append("name", data.name);
    const result = await serverAction(undefined, formData);
    if (result?.error) throw new Error(result.error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      <button type="submit" disabled={isSubmitting}>Хадгалах</button>
    </form>
  );
}
```

**Rules:**
1. Always `onSubmit={handleSubmit(onSubmit)}` — never `form action={...}`
2. Use `register()` for standard inputs, `Controller` for custom components (Combobox, Select)
3. Server errors go in `serverError` useState or `ErrorBanner` component
4. Combine `mutation.isPending` with `isSubmitting` on submit buttons
5. Error messages in Mongolian

## Drawers

### Standard drawer

```tsx
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { DrawerCancel, DrawerFooter, DrawerSubmit } from "@/components/ui/drawer-footer";

<SlideInDrawer open={open} onOpenChange={setOpen} title="Шинэ ..." trigger={<Button>Шинэ ...</Button>}
  footer={<DrawerFooter><DrawerCancel onClick={() => setOpen(false)} /><DrawerSubmit form="my-form" label="Хадгалах" /></DrawerFooter>}>
  <form id="my-form" onSubmit={handleSubmit(onSubmit)}>...</form>
</SlideInDrawer>
```

### Nested drawers

Use `NestedDrawerPanel` from `@/components/ui/nested-drawer-panel` for drawers inside drawers (e.g., variant manager inside product create).

### Checkout drawer (footer-driven submit)

```tsx
const [formState, setFormState] = useState({ isFormValid: false, isPending: false, totalAmount: 0 });

<SlideInDrawer
  footer={
    <button type="submit" form="checkout-form"
      disabled={!formState.isFormValid || formState.isPending}
      className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-14 w-full")}>
      {formState.isPending ? "..." : `Борлуулалт үүсгэх (${formState.totalAmount}₮)`}
    </button>
  }
>
  <CheckoutForm onStateChange={setFormState} ... />
</SlideInDrawer>
```

1. Form gets `id="checkout-form"`; footer button uses `form="checkout-form"`
2. `onStateChange` reports `{ isFormValid, isPending, totalAmount }` from inside the form
3. Use `buttonVariants()` for consistent styling when not using `DrawerSubmit` directly
