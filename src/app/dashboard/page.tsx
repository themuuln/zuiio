import {
  Car,
  ClipboardList,
  Clock,
  DollarSign,
  Plus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    label: "Total Work Orders",
    value: "248",
    icon: ClipboardList,
    description: "+12 this month",
  },
  {
    label: "Active Work Orders",
    value: "14",
    icon: Clock,
    description: "5 awaiting parts",
  },
  {
    label: "Customers",
    value: "312",
    icon: Users,
    description: "+8 new this month",
  },
  {
    label: "Revenue (MTD)",
    value: "$24,580",
    icon: DollarSign,
    description: "+12.5% vs last month",
  },
];

const recentActivity = [
  {
    action: "Work Order #248 created",
    detail: "2018 Toyota Camry – Oil Change",
    time: "2 hours ago",
  },
  {
    action: "Invoice #892 paid",
    detail: "$245.00 – Customer: Sarah Johnson",
    time: "4 hours ago",
  },
  {
    action: "Inventory received",
    detail: "Oil filters (20 units) from AutoParts Inc.",
    time: "Yesterday",
  },
  {
    action: "Work Order #247 completed",
    detail: "2020 Honda Civic – Brake replacement",
    time: "Yesterday",
  },
  {
    action: "New customer added",
    detail: "Michael Chen – 2019 Ford F-150",
    time: "2 days ago",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to TOLOM</h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your shop today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions + Recent activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Quick actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="size-4" />
              New Work Order
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="size-4" />
              New Customer
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Car className="size-4" />
              New Vehicle
            </Button>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-4">
              {recentActivity.map((item) => (
                <li
                  key={item.action + item.time}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 block size-2 shrink-0 rounded-full bg-muted-foreground/30" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {item.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
