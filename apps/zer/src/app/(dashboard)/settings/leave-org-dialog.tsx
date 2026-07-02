"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { leaveOrganization } from "./actions";

type LeaveOrganizationDialogProps = {
  orgName: string;
};

export function LeaveOrganizationDialog({
  orgName,
}: LeaveOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    if (confirmText !== orgName) return;

    setPending(true);
    const formData = new FormData();
    formData.append("confirm_name", confirmText);
    const result = await leaveOrganization(formData);

    if (result?.error) {
      toast.error(result.error);
      setPending(false);
    }
    // On success, redirect happens server-side — no need to handle here
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Байгууллагаас гарах</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <WarningCircle className="size-5 text-destructive" />
            Байгууллагаас гарах
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Та байгууллагаас гарснаар <strong>{orgName}</strong>-ын бүх
              өгөгдөлд хандах боломжгүй болно. Шинээр байгууллага үүсгэн ажиллаж
              эхлэх боломжтой.
            </p>
            <p className="font-medium text-foreground">
              Баталгаажуулахын тулд байгууллагын нэрийг бичнэ үү:
            </p>
            <Input
              type="text"
              placeholder={orgName}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="font-mono text-sm"
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Буцах</AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmText !== orgName || pending}
            onClick={handleConfirm}
          >
            {pending ? "Гарч байна..." : "Гарах"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
