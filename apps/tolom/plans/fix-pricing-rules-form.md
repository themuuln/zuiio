# Fix Pricing Rules Form Anti-Patterns

## Context
The `_pricing-rules-section.tsx` file (775 lines) uses raw `useState<RuleForm>` for form state with no validation, no Field wrappers, and a Dialog for delete confirmation. It needs to be converted to react-hook-form + zod + Field components + AlertDialog, while keeping its existing DetailDrawer shell and helper functions.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| src/app/[locale]/dashboard/settings/_pricing-rules-section.tsx | Modify | Convert form pattern, add schema, replace delete dialog |

Single file change — no other files affected.

## Implementation Order
1. **Update imports**: Remove Dialog imports, add zod, react-hook-form Controller, useForm/zodResolver, Field components, AlertDialog components
2. **Add zod schema**: Define `priceRuleSchema` with validation rules for fields
3. **Replace form state management**: Remove `useState<RuleForm>`, add `useForm` + `zodResolver` + `formDefaults` memo + reset effect
4. **Update callbacks**: Strip `setForm()` calls from `openNew`/`openEdit`, derive defaults from `editingRule`
5. **Clean up onSuccess**: Remove `setForm(DEFAULT_FORM)` from mutation callbacks
6. **Convert form fields in DetailDrawer**: Replace raw `<div>`+`<Label>`+`<Input>` with `<Field>`+`<FieldLabel>`+`<FieldContent>`+`<FieldError>` using `form.register()` and `Controller`
7. **Replace submit button**: Use form `handleSubmit` via `<form>` element, `formId`, and `type="submit"`
8. **Replace delete Dialog with AlertDialog**

## Detailed Changes

### 1. Imports
**Remove:**
- `Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle` from `@/components/ui/dialog`

**Add:**
- `z` from `zod`
- `Controller` from `react-hook-form`
- `useId` from `react`
- `useForm, zodResolver` from `@/lib/hooks/use-form`
- `Field, FieldContent, FieldError, FieldGroup, FieldLabel` from `@/components/ui/field`
- `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle` from `@/components/ui/alert-dialog`

**Keep:**
- `Label` (still used for sub-labels in category grid)

### 2. Zod Schema
```ts
const priceRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  apply_to: z.enum(["part", "service", "both"]),
  conditions_type: z.enum(["class", "make", "make_model", "fuel", "body_type", "all"]),
  conditions_makes: z.string(),
  conditions_models: z.string(),
  conditions_classes: z.string(),
  conditions_fuel_types: z.string(),
  conditions_body_types: z.string(),
  conditions_description: z.string(),
  operator: z.enum(["multiply", "add_fixed", "set_fixed", "percentage_add", "percentage_sub"]),
  value: z.string().min(1, "Value is required"),
  priority: z.string().min(1, "Priority is required"),
  part_category: z.string(),
  service_category: z.string(),
  part_name_pattern: z.string(),
  service_name_pattern: z.string(),
}).superRefine((data, ctx) => {
  // At least one brand condition required for non-"all" types
  if (data.conditions_type !== "all") {
    const relevantField =
      data.conditions_type === "class" ? "conditions_classes" :
      data.conditions_type === "make" || data.conditions_type === "make_model" ? "conditions_makes" :
      data.conditions_type === "fuel" ? "conditions_fuel_types" :
      data.conditions_type === "body_type" ? "conditions_body_types" : null;
    if (relevantField && !data[relevantField].trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `At least one ${data.conditions_type.replace("_", " ")} condition is required`,
        path: [relevantField],
      });
    }
  }
});
```

### 3. State Management
**Before:**
```ts
const [form, setForm] = useState<RuleForm>(DEFAULT_FORM);
```

**After:**
```ts
const formId = useId();
const form = useForm<RuleForm>({
  resolver: zodResolver(priceRuleSchema) as unknown as Resolver<RuleForm>,
  defaultValues: DEFAULT_FORM,
  mode: "onSubmit",
});
```

Plus a `formDefaults` memo and reset effect:
```ts
const formDefaults = useMemo(() => {
  if (!editingRule) return DEFAULT_FORM;
  // ... map from editingRule to RuleForm ...
}, [editingRule]);

useEffect(() => {
  if (dialogOpen) {
    form.reset(formDefaults);
  }
}, [dialogOpen, formDefaults, form]);
```

### 4. Form Field Pattern
Each field follows the pattern:
```tsx
<Field data-invalid={!!form.formState.errors.name}>
  <FieldLabel>{t("ruleName")}</FieldLabel>
  <FieldContent>
    <Input {...form.register("name")} placeholder={t("ruleNamePlaceholder")} />
    {form.formState.errors.name && (
      <FieldError>{form.formState.errors.name.message}</FieldError>
    )}
  </FieldContent>
</Field>
```

For Select fields, use `Controller`:
```tsx
<Controller
  control={form.control}
  name="apply_to"
  render={({ field }) => (
    <Field data-invalid={!!form.formState.errors.apply_to}>
      <FieldLabel>{t("appliesTo")}</FieldLabel>
      <FieldContent>
        <Select value={field.value || null} onValueChange={field.onChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>...</SelectContent>
        </Select>
        {form.formState.errors.apply_to && (
          <FieldError>{form.formState.errors.apply_to.message}</FieldError>
        )}
      </FieldContent>
    </Field>
  )}
/>
```

### 5. Submit Handler
Wrap body in `<form>`:
```tsx
<DetailDrawer.Body>
  <form id={formId} onSubmit={form.handleSubmit(...)} className="flex flex-col gap-4">
    ...
  </form>
</DetailDrawer.Body>
```

Footer button uses `type="submit" form={formId}`.

### 6. Delete Confirmation
Replace `Dialog` with `AlertDialog`:
```tsx
<AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogTitle>{t("deletePriceRuleTitle")}</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogDescription>
      {t("deletePriceRuleDesc")}
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>
        {t("cancel")}
      </AlertDialogCancel>
      <AlertDialogAction
        variant="destructive"
        onClick={() => { if (deleteConfirm) deletePriceRule.mutate(deleteConfirm); }}
        disabled={deletePriceRule.isPending}
      >
        {deletePriceRule.isPending ? t("saving") : t("delete")}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 7. Remove stale `setForm` calls
- `onSuccess` of `createPriceRule`: remove `setForm(DEFAULT_FORM)`
- `onSuccess` of `updatePriceRule`: remove `setForm(DEFAULT_FORM)`
- `openNew`: remove `setForm(DEFAULT_FORM)` (reset handled by useEffect)

## Edge Cases
- **Dual mode (create/edit)**: `formDefaults` memo derives from `editingRule` — null = defaults, non-null = mapped values. `useEffect` resets on open.
- **Select null value handling**: `field.value || null` maps empty string to null for Select component
- **NumericInput**: Uses `Controller` to convert between form `string` values and NumericInput's `number` type
- **Category grid sub-labels**: `Label` import kept for the inner part/service category labels which aren't wrapped in Field components
- **All `buildConditions`/`buildPriceRuleBody` calls**: unchanged — they take `RuleForm` which is structurally identical to `z.infer<typeof priceRuleSchema>`

## Verification
1. `bun run typecheck` — zero new TypeScript errors in the file
2. Visual: open create form → submit empty → see error messages next to invalid fields
3. Visual: open edit form → see pre-filled values
4. Visual: click delete → see AlertDialog instead of Dialog
