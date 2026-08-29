import { redirect } from "next/navigation";

interface BudgetsPageProps {
  searchParams?: Promise<{ period?: string }>;
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const params = searchParams ? await searchParams : {};
  const periodParam = params.period ? `&period=${params.period}` : "";
  redirect(`/transactions?tab=budget${periodParam}`);
}
