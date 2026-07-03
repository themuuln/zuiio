import { Warehouse } from "@phosphor-icons/react/dist/ssr";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StockMovementsSummary } from "@/lib/reports";

const MOVEMENT_CONFIG: Record<
  string,
  { label: string; variant: "secondary" | "outline" | "destructive" }
> = {
  in: { label: "Орлого", variant: "secondary" },
  out: { label: "Зарлага", variant: "outline" },
  adjustment: { label: "Тохируулга", variant: "destructive" },
};

export function StockMovements({ data }: { data: StockMovementsSummary }) {
  const total = data.in + data.out + data.adjustment;
  const items = [
    { type: "in", count: data.in },
    { type: "out", count: data.out },
    { type: "adjustment", count: data.adjustment },
  ];

  return (
    <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Барааны хөдөлгөөн</CardTitle>
        <CardDescription>
          Сонгосон хугацааны барааны орлого, зарлага, тохируулга
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <ErpEmptyState
            icon={<Warehouse className="size-4" />}
            title="Хөдөлгөөний мэдээлэл алга"
            description="Сонгосон хугацаанд барааны хөдөлгөөн бүртгэгдээгүй байна."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {items.map((item) => {
              const config = MOVEMENT_CONFIG[item.type] ?? MOVEMENT_CONFIG.in;
              return (
                <div
                  key={item.type}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/35 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} удаа
                    </p>
                  </div>
                  <Badge variant={config.variant}>{item.count}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
