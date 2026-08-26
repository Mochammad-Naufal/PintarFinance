import { redirect } from "next/navigation";

/**
 * Root page — immediately redirects to the main dashboard.
 * The actual dashboard UI lives at app/(dashboard)/dashboard/page.tsx.
 */
export default function RootPage() {
  redirect("/dashboard");
}
