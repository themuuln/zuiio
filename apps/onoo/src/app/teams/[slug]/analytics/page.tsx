import { redirect } from "next/navigation";

export default async function TeamAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/teams/${slug}#team-analytics`);
}
