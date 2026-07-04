"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function LowStockToast({ count }: { count: number }) {
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (count > 0 && !hasShownToast.current) {
      toast.warning(`${count} бүтээгдэхүүний нөөц бага байна`, {
        description:
          "Бүтээгдэхүүний нөөц хэт бага түвшинд хүрсэн тул нөхөх шаардлагатай.",
        duration: 5000,
      });
    }
  }, [count]);

  return null;
}
