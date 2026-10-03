import { pageLocale, redirect, type LangParams } from "@/i18n/server";

export default async function AdminIndexPage({ params }: LangParams) {
  redirect(await pageLocale(params), "/admin/dashboard");
}
