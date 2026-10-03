import { requireRolePage } from "@/lib/pageGuard";
import { pageLocale, type LangParams } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children, params }: { children: React.ReactNode } & LangParams) {
  await requireRolePage(await pageLocale(params), ["admin"], "/dashboard");
  return children;
}
