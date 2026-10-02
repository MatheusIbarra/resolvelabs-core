import AuthPage from "@/components/auth/AuthPage";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Entrar - ResolveLabs" };

export default function LoginPage() {
  return (
    <AuthPage>
      <AuthForm mode="login" />
    </AuthPage>
  );
}
