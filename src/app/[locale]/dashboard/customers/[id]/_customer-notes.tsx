"use client";

import { Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerNoteType } from "@/lib/types";
import {
  useCreateCustomerNote,
  useCustomerNotes,
  useDeleteCustomerNote,
} from "@/lib/queries/use-customer-notes";
import { Typography } from "@/components/ui/typography";

interface CustomerNotesProps {
  orgId: string | undefined;
  customerId: string | undefined;
}

const NOTE_TYPES: { value: CustomerNoteType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "follow_up", label: "Follow Up" },
  { value: "complaint", label: "Complaint" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
];

const typeBadgeColor: Record<string, string> = {
  general: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  follow_up: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  complaint: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  call: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  email: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
  meeting: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  other: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

export function CustomerNotes({ orgId, customerId }: CustomerNotesProps) {
  const t = useTranslations("customers");

  const { data: notes = [], isLoading } = useCustomerNotes(orgId, customerId);
  const createNote = useCreateCustomerNote(orgId, customerId);
  const deleteNote = useDeleteCustomerNote(orgId, customerId);

  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState<CustomerNoteType>("general");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await createNote.mutateAsync({ content: content.trim(), type: noteType });
      setContent("");
      setNoteType("general");
      setShowForm(false);
      toast.success("Note added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note");
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync(noteId);
      toast.success("Note deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4" />
          Notes
          {notes.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({notes.length})
            </span>
          )}
        </CardTitle>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 size-3.5" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20">
            <Textarea
              placeholder="Write a note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex items-center gap-3">
              <Select
                value={noteType}
                onValueChange={(value: string | null) => {
                  if (value) setNoteType(value as CustomerNoteType);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map((nt) => (
                    <SelectItem key={nt.value} value={nt.value}>
                      {nt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setContent("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!content.trim() || createNote.isPending}
                >
                  {createNote.isPending ? (
                    <Loader2 className="mr-1 size-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-1 size-3.5" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <Typography.Muted className="py-4 text-center text-sm text-muted-foreground">
            {showForm ? "Add the first note above" : "No notes yet"}
          </Typography.Muted>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group rounded-lg border p-3 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex flex-1 flex-col gap-1">
                    <Typography.Text className="whitespace-pre-wrap text-sm">{note.content}</Typography.Text>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {NOTE_TYPES.find((nt) => nt.value === note.type)
                          ?.label ?? note.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
