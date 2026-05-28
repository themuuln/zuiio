"use client";

import { Phone, Mail, MapPin, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";

interface ContactInfo {
  label: string;
  value: string | null | undefined;
  icon?: typeof Phone | typeof Mail | typeof MapPin;
  copyable?: boolean;
}

export function ContactCard({
  title,
  items,
  badge,
}: {
  title?: string;
  items: ContactInfo[];
  badge?: { label: string; color?: "default" | "secondary" | "outline" | "destructive" };
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {title && (
        <Typography.Muted className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
          {title}
        </Typography.Muted>
      )}
      <div className="rounded-md border border-border/50 bg-card p-2.5 flex flex-col gap-2">
        {badge && (
          <Badge variant={badge.color ?? "secondary"} className="text-[10px] h-4 px-1.5 w-fit">
            {badge.label}
          </Badge>
        )}
        {items.map((item) => {
          if (!item.value) return null;
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start gap-2">
              {Icon && <Icon className="size-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <Typography.Muted className="text-[10px] text-muted-foreground/50">{item.label}</Typography.Muted>
                <Typography.Text className="text-xs font-medium truncate">{item.value}</Typography.Text>
              </div>
              {item.copyable && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-5 shrink-0 text-muted-foreground/30 hover:text-foreground"
                  onClick={() => {
                    navigator.clipboard.writeText(item.value!);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="size-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
