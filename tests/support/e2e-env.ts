/** Configuração compartilhada entre playwright.config.ts, global-setup e os testes. */
export const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

/** Banco exclusivo dos testes. O global-setup APAGA este banco, por isso o nome precisa conter "e2e". */
export const E2E_MONGODB_URI = process.env.E2E_MONGODB_URI ?? "mongodb://127.0.0.1:27018/resolvelabs_e2e";
export const E2E_JWT_SECRET = process.env.E2E_JWT_SECRET ?? "e2e-only-secret-please-do-not-use-in-production-0123456789";

export const ADMIN = { email: "e2e-admin@resolvelabs.test", password: "Admin#E2e-2026" } as const;
export const USER_PASSWORD = "Senha#E2e-2026";

export const FREE_LIMIT = 3;

/** Celular e aceite dos termos são obrigatórios no cadastro. */
