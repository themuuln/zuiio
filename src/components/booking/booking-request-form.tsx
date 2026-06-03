"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";

interface BookingRequestFormProps {
  token: string;
  onSuccess: (message: string) => void;
  apiEndpoint?: string;
  initialName?: string;
  initialPhone?: string;
}

export function BookingRequestForm({
  token,
  onSuccess,
  apiEndpoint,
  initialName,
  initialPhone,
}: BookingRequestFormProps) {
  const [name, setName] = useState(initialName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [plate, setPlate] = useState("");
  const [notes, setNotes] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const normalized = phone.trim().replace(/[\s-]/g, "");
      if (!/^\+976\d{8}$/.test(normalized)) {
        newErrors.phone =
          "Enter a valid Mongolian phone number (e.g. +976 9911 9911)";
      }
    }
    if (!plate.trim()) {
      newErrors.plate = "Vehicle plate is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    try {
      const endpoint = apiEndpoint ?? `/api/booking/${token}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          plate: plate.trim(),
          notes: notes.trim() || undefined,
          requestedDate: requestedDate || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrors({
          submit: json.error?.message ?? "Failed to submit. Please try again.",
        });
        return;
      }

      onSuccess(
        json.data?.message ??
          "Booking request submitted. The shop will contact you to confirm.",
      );
    } catch {
      setErrors({ submit: "Network error. Please check your connection." });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card className="border-border">
        <CardContent className="p-6 flex flex-col gap-4">
          <Field>
            <FieldLabel>
              Name <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>
              Phone <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +976 9911 9911"
                type="tel"
              />
              {errors.phone && <FieldError>{errors.phone}</FieldError>}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>
              Vehicle Plate <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="e.g. 4444УНА"
              />
              {errors.plate && <FieldError>{errors.plate}</FieldError>}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Preferred Date</FieldLabel>
            <FieldContent>
              <Input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Notes</FieldLabel>
            <FieldContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what service is needed (optional)"
                rows={3}
              />
            </FieldContent>
          </Field>

          {errors.submit && (
            <Typography.Muted className="text-xs text-destructive text-center">
              {errors.submit}
            </Typography.Muted>
          )}

          <Button type="submit" disabled={sending} className="w-full">
            {sending && <Loader2 className="size-4 animate-spin mr-2" />}
            {sending ? "Submitting..." : "Request Appointment"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
