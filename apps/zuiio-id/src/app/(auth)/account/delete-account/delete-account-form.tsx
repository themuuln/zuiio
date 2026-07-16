"use client";

import { useActionState } from "react";
import { deleteAccount } from "./actions";

export function DeleteAccountForm() {
  const [state, formAction, isPending] = useActionState(deleteAccount, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">Анхааруулга</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Таны бүх нэвтрэх мэдээлэл устгагдана</li>
          <li>• Танай байгууллагын гишүүнчлэл цуцлагдана</li>
          <li>• OAuth зөвшөөрөл цуцлагдана</li>
          <li>• Энэ үйлдлийг буцаах боломжгүй</li>
        </ul>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Нүүр хуудсыг устгахын тулд нууц үгээ оруулна уу
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          placeholder="Нууц үг"
        />
      </div>

      {state?.formError && (
        <div className="animate-slide-up rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="active-scale h-11 rounded-lg bg-destructive px-4 text-sm font-medium text-white transition-colors hover:bg-destructive/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Устгаж байна…" : "Бүртгэл устгах"}
      </button>
    </form>
  );
}
