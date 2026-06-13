"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import { Button } from "@/components/ui/button";

export function NewSaleButton() {
  const { clearCart } = useCart();
  const router = useRouter();

  const handleNewSale = () => {
    clearCart();
    router.push("/shop");
  };

  return (
    <Button
      size="lg"
      className="h-[52px] w-full text-sm font-semibold"
      onClick={handleNewSale}
    >
      Шинэ борлуулалт
    </Button>
  );
}
