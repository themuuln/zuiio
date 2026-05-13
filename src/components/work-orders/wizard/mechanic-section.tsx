"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MechanicSelect } from "@/components/mechanic-select";
import { useWizardContext } from "./wizard-context";

export function MechanicSection() {
  const ctx = useWizardContext();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mechanic</CardTitle>
        </CardHeader>
        <CardContent>
          <MechanicSelect
            value={ctx.selectedMechanic}
            onChange={ctx.setSelectedMechanic}
            mechanics={ctx.mechanics}
            size="lg"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Description / Notes (optional)"
            value={ctx.description}
            onChange={(e) => ctx.setDescription(e.target.value)}
            className="h-11"
          />
        </CardContent>
      </Card>
    </div>
  );
}
