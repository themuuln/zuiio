import {
  CreditCard,
  CurrencyDollar,
  TrendDown,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { FinancialSummary as FinancialSummaryData } from "@/lib/reports";

export function FinancialSummary({ data }: { data: FinancialSummaryData }) {
  const cards = [
    {
      title: "Нийт борлуулалт",
      description: "Сонгосон хугацааны борлуулалтын дүн",
      value: data.totalSales,
      icon: CurrencyDollar,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Нийт зарлага",
      description: "Сонгосон хугацааны зарлагын дүн",
      value: data.totalExpenses,
      icon: CreditCard,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Цэвэр мөнгөн урсгал",
      description: "Орлого - зарлага",
      value: data.netCash,
      icon: TrendUp,
      color: data.netCash >= 0 ? "text-chart-2" : "text-destructive",
      bg: "bg-chart-2/12",
    },
    {
      title: "Нийт ашиг",
      description: "Борлуулалт - өртөг",
      value: data.grossProfit,
      icon: TrendDown,
      color: data.grossProfit >= 0 ? "text-chart-2" : "text-destructive",
      bg: "bg-chart-2/12",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>{card.title}</CardTitle>
              <div className={`rounded-2xl ${card.bg} p-2 ${card.color}`}>
                <Icon />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold ${card.color}`}>
                {formatCurrency(card.value)}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
