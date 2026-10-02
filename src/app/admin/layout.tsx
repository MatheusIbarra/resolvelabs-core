import { requireRolePage } from "@/lib/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRolePage(["admin"], "/dashboard");
  return children;
}
