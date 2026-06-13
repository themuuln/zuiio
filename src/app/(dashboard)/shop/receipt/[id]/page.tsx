import { Receipt } from "@phosphor-icons/react/dist/ssr";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function ReceiptPage({
  params: _params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col gap-4 pb-20">
      <h1 className="text-lg font-semibold">Баримт</h1>
      <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Receipt className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Баримт олдсонгүй</EmptyTitle>
          <EmptyDescription>
            Энэ баримт олдсонгүй эсвэл устгагдсан байна.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
