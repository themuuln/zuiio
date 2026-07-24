import { Typography } from "@/components/ui/typography";

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-primary/60" />
        <Typography.H3 className="m-0">{title}</Typography.H3>
      </div>
      {description && (
        <Typography.Muted className="mt-1 ml-4">{description}</Typography.Muted>
      )}
    </div>
  );
}
