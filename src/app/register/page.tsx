import AuthPage from "@/components/auth/AuthPage";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Criar conta - ResolveLabs" };

export default function RegisterPage() {
  return (
    <AuthPage>
      <AuthForm mode="register" />
    </AuthPage>
  );
}
