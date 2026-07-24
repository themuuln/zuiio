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
      <Typography.H3 className="m-0">{title}</Typography.H3>
      {description && (
        <Typography.Muted className="mt-1">{description}</Typography.Muted>
      )}
    </div>
  );
}
