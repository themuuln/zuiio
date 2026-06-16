"use client";

import { Coins } from "@phosphor-icons/react";
import { useState } from "react";
import { ExpenseForm } from "@/app/(dashboard)/expenses/new/expense-form";
import { buttonVariants } from "@/components/ui/button";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";

export function ExpensesCreateDrawer({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={setOpen}
      title="Зарлага нэмэх"
      description="Өдөр тутмын үйл ажиллагааны зардлыг мөнгөн урсгалтай нь хамт бүртгэнэ."
      trigger={
        <button type="button" className={buttonVariants({ variant: "default" })}>
          <Coins className="size-4" />
          Шинэ зарлага
        </button>
      }
    >
      <ExpenseForm onSuccess={() => setOpen(false)} />
    </SlideInDrawer>
  );
}
