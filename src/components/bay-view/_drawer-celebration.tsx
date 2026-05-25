"use client";

import { CheckCircle2 } from "lucide-react";

interface CelebrationProps {
  show: boolean;
  message: string;
}

export function DrawerCelebration({ show, message }: CelebrationProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-300">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-500/20 animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="size-10 text-green-500" />
        </div>
        <p className="text-lg font-semibold">{message}</p>
      </div>
    </div>
  );
}
