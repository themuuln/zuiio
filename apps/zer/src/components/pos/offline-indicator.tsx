"use client";

import { WifiHigh, WifiSlash } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OfflineIndicatorProps {
  pendingCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function OfflineIndicator({
  pendingCount = 0,
  onSync,
  isSyncing = false,
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isOnline ? "outline" : "destructive"}
          size="sm"
          className="gap-1.5"
          onClick={onSync}
          disabled={!isOnline || isSyncing || pendingCount === 0}
        >
          {isOnline ? (
            <WifiHigh className="size-4" />
          ) : (
            <WifiSlash className="size-4" />
          )}
          {!isOnline && <span className="hidden sm:inline">Оффлайн</span>}
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isOnline ? (
          pendingCount > 0 ? (
            <p>{pendingCount} үйлдэл хүлээж байна.</p>
          ) : (
            <p>Интернет холболт хэвийн</p>
          )
        ) : (
          <p>Интернет холболтгүй. Үйлдлүүд нөөцлөгдөж байна.</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
