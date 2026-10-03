import type { Shape } from "../types";

const en = {
  meta: { login: "Sign in", register: "Create account" },
  login: {
    title: "Sign in to your account",
    description: "Access your dashboard and your tools.",
    submit: "Sign in",
    pending: "Signing in…",
    altText: "Don't have an account yet?",
    altLink: "Create account",
  },
  register: {
    title: "Create a free account",
    description: "Start on the FREE plan. You can subscribe to PRO whenever you want.",
    submit: "Create account",
    pending: "Creating your account…",
    altText: "Already have an account?",
    altLink: "Sign in",
  },
  referral: {
    title: "You were invited by a friend",
    body: "Referral applied (code {code}). Create your account to get started.",
  },
  email: "Email",
  emailPlaceholder: "you@company.com",
  password: "Password",
  passwordPlaceholderLogin: "Your password",
  passwordPlaceholderRegister: "At least 8 characters",
  phone: "Mobile phone (Brazilian number)",
  phonePlaceholder: "(11) 91234-5678",
  phoneInvalid: "Enter a valid mobile number with area code: (XX) XXXXX-XXXX.",
  termsRequired: "You must accept the Terms of Use.",
  termsLead: "I have read and agree to the",
  termsLink: "Terms of Use",
};

export type AuthMessages = Shape<typeof en>;

const es: AuthMessages = {
  meta: { login: "Iniciar sesión", register: "Crear cuenta" },
  login: {
    title: "Inicia sesión en tu cuenta",
    description: "Accede a tu panel y a tus herramientas.",
    submit: "Iniciar sesión",
    pending: "Iniciando sesión…",
    altText: "¿Aún no tienes cuenta?",
    altLink: "Crear cuenta",
  },
  register: {
    title: "Crea una cuenta gratuita",
    description: "Empieza en el plan FREE. Puedes suscribirte a PRO cuando quieras.",
    submit: "Crear cuenta",
    pending: "Creando tu cuenta…",
    altText: "¿Ya tienes cuenta?",
    altLink: "Iniciar sesión",
  },
  referral: {
    title: "Te invitó un amigo",
    body: "Referido aplicado (código {code}). Crea tu cuenta para empezar.",
  },
  email: "Correo electrónico",
  emailPlaceholder: "tu@empresa.com",
  password: "Contraseña",
  passwordPlaceholderLogin: "Tu contraseña",
  passwordPlaceholderRegister: "Mínimo de 8 caracteres",
  phone: "Teléfono móvil (número brasileño)",
  phonePlaceholder: "(11) 91234-5678",
  phoneInvalid: "Indica un móvil válido con código de área: (XX) XXXXX-XXXX.",
  termsRequired: "Es necesario aceptar los Términos de Uso.",
  termsLead: "He leído y acepto los",
  termsLink: "Términos de Uso",
};

const pt: AuthMessages = {
  meta: { login: "Entrar", register: "Criar conta" },
  login: {
    title: "Entrar na sua conta",
    description: "Acesse seu painel e suas ferramentas.",
    submit: "Entrar",
    pending: "Entrando…",
    altText: "Ainda não tem conta?",
    altLink: "Criar conta",
  },
  register: {
    title: "Criar conta gratuita",
    description: "Comece no plano FREE. Você pode assinar o PRO quando quiser.",
    submit: "Criar conta",
    pending: "Criando sua conta…",
    altText: "Já tem conta?",
    altLink: "Entrar",
  },
  referral: {
    title: "Você foi convidado(a) por um amigo",
    body: "Indicação aplicada (código {code}). Crie sua conta para começar.",
  },
  email: "E-mail",
  emailPlaceholder: "voce@empresa.com",
  password: "Senha",
  passwordPlaceholderLogin: "Sua senha",
  passwordPlaceholderRegister: "Mínimo de 8 caracteres",
  phone: "Celular",
  phonePlaceholder: "(11) 91234-5678",
  phoneInvalid: "Informe um celular válido com DDD: (XX) XXXXX-XXXX.",
  termsRequired: "É necessário aceitar os Termos de Uso.",
  termsLead: "Li e concordo com os",
  termsLink: "Termos de Uso",
};

export default { en, es, pt };
