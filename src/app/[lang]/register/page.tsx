import type { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";
import AuthForm from "@/components/auth/AuthForm";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { privateTitle } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: privateTitle(getTranslator(await pageLocale(params)).t("auth.meta.register")) };
}

export default function RegisterPage() {
  return (
    <AuthPage>
      <AuthForm mode="register" />
    </AuthPage>
  );
}
