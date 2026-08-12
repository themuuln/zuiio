"use client";

import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createSale } from "@/app/(dashboard)/sales/new/actions";
import { OfflineIndicator } from "@/components/pos/offline-indicator";
import { PosCartPanel } from "@/components/pos/pos-cart-panel";
import {
  PosPaymentDialog,
  type PosPaymentResult,
} from "@/components/pos/pos-payment-dialog";
import {
  type PosCategory,
  PosProductGrid,
} from "@/components/pos/pos-product-grid";
import {
  PosVariantDialog,
  type PosVariantSelection,
} from "@/components/pos/pos-variant-dialog";
import { Button } from "@/components/ui/button";
import { useBarcodeScanner } from "@/lib/hooks/use-barcode-scanner";
import { useOffline } from "@/lib/offline/offline-provider";
import { queueOfflineAction } from "@/lib/offline-sync";
import {
  addProductToCart,
  buildSaleFormData,
  cartSubtotal,
  type PosLine,
  type PosProduct,
  removeLine,
  setLineQuantity,
  setLineUnitPrice,
} from "@/lib/pos";
import { productKeys, saleKeys } from "@/lib/query/keys";

export type PosOpenSession = {
  id: string;
  registerName: string | null;
};

/**
 * Touch POS register. Left: tappable product catalog (search, categories,
 * variants). Right: cart with touch steppers + price override. Payment via
 * method chips + cash keypad with change. Sales run through the shared
 * `createSale` server action (stock locks, journal, invoice, notifications)
 * and the offline mutation queue when disconnected.
 */
export function PosRegister({
  products,
  categories,
  openSession,
  hasReceiptPrinter = false,
}: {
  products: PosProduct[];
  categories: PosCategory[];
  openSession: PosOpenSession | null;
  hasReceiptPrinter?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOnline, pendingCount, isReplaying, replay, refreshPendingCount } =
    useOffline();

  const [lines, setLines] = useState<PosLine[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [variantProduct, setVariantProduct] = useState<PosProduct | null>(null);

  const addProduct = useCallback((product: PosProduct) => {
    if (product.has_variants) {
      setVariantProduct(product);
      return;
    }
    setLines((prev) => addProductToCart(prev, product));
  }, []);

  const addVariant = useCallback(
    (variant: PosVariantSelection) => {
      if (!variantProduct) return;
      setLines((prev) => addProductToCart(prev, variantProduct, variant));
      setVariantProduct(null);
    },
    [variantProduct],
  );

  const handleBarcode = useCallback(
    (code: string) => {
      const product = products.find((p) => p.barcode === code);
      if (!product) {
        toast.error(`Баркод олдсонгүй: ${code}`);
        return;
      }
      addProduct(product);
    },
    [addProduct, products],
  );

  useBarcodeScanner({ onScan: handleBarcode });

  const saleMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createSale(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      toast.success("Борлуулалт амжилттай");
      setLines([]);
      setPaymentOpen(false);
      setPaymentError(null);
      void queryClient.invalidateQueries({ queryKey: productKeys.all() });
      void queryClient.invalidateQueries({ queryKey: saleKeys.all() });
      const saleId = result && "sale" in result ? result.sale.id : null;
      if (saleId && hasReceiptPrinter) {
        router.push(`/sales/${saleId}?print=1`);
      }
    },
    onError: (error) => {
      capture(error, { context: "pos-register: createSale" });
      setPaymentError(error instanceof Error ? error.message : "Алдаа гарлаа");
    },
  });

  const handleConfirmPayment = useCallback(
    (payload: PosPaymentResult) => {
      if (lines.length === 0) return;
      const formData = buildSaleFormData({
        lines,
        paymentMethod: payload.method,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
      });

      if (!isOnline) {
        // Offline: queue the sale for replay and clear the register.
        const fields: Record<string, string> = {};
        formData.forEach((value, key) => {
          fields[key] = value.toString();
        });
        void queueOfflineAction("sale", fields, [
          saleKeys.all(),
          productKeys.all(),
        ] as unknown as string[][])
          .then(() => {
            toast.success("Офлайн борлуулалт дараалалд орлоо");
            setLines([]);
            setPaymentOpen(false);
            setPaymentError(null);
            void refreshPendingCount();
          })
          .catch((error) => {
            capture(error, { context: "pos-register: queue offline" });
            setPaymentError("Офлайн борлуулалтыг хадгалах боломжгүй");
          });
        return;
      }

      setPaymentError(null);
      saleMutation.mutate(formData);
    },
    [isOnline, lines, refreshPendingCount, saleMutation],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Cash session awareness + offline sync */}
      <div className="flex flex-wrap items-center gap-2">
        {openSession ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Ээлж нээлттэй: {openSession.registerName ?? "Касс"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-600/10 px-3 py-1 text-xs font-medium text-amber-700">
            <WarningCircle className="size-3.5" />
            Кассын ээлж нээгээгүй байна
            <Button
              asChild
              variant="link"
              size="sm"
              className="h-auto px-0 text-xs"
            >
              <Link href="/cash-register">Ээлж нээх</Link>
            </Button>
          </span>
        )}
        <OfflineIndicator
          pendingCount={pendingCount}
          onSync={() => void replay()}
          isSyncing={isReplaying}
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:h-[calc(100dvh-13rem)] lg:grid-cols-[minmax(0,1fr)_380px]">
        <PosProductGrid
          products={products}
          categories={categories}
          onAdd={addProduct}
          onOpenVariants={setVariantProduct}
        />
        <PosCartPanel
          lines={lines}
          onIncrement={(index) =>
            setLines((prev) =>
              setLineQuantity(prev, index, prev[index].quantity + 1),
            )
          }
          onDecrement={(index) =>
            setLines((prev) =>
              setLineQuantity(prev, index, prev[index].quantity - 1),
            )
          }
          onRemove={(index) => setLines((prev) => removeLine(prev, index))}
          onEditPrice={(index, unitPrice) =>
            setLines((prev) => setLineUnitPrice(prev, index, unitPrice))
          }
          onClear={() => setLines([])}
          onCharge={() => {
            setPaymentError(null);
            setPaymentOpen(true);
          }}
        />
      </div>

      <PosPaymentDialog
        open={paymentOpen}
        total={cartSubtotal(lines)}
        onOpenChange={setPaymentOpen}
        onConfirm={handleConfirmPayment}
        isSubmitting={saleMutation.isPending}
        error={paymentError}
      />

      <PosVariantDialog
        product={variantProduct}
        onClose={() => setVariantProduct(null)}
        onSelect={addVariant}
      />
    </div>
  );
}
