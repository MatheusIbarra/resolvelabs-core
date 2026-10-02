import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_JWT_SECRET, E2E_MONGODB_URI, E2E_PORT } from "./tests/support/e2e-env";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  globalSetup: "./tests/global-setup.ts",
  // Os cenários compartilham um banco de dados e dependem de ordem: um worker, em sequência.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: E2E_BASE_URL,
    locale: "pt-BR",
    acceptDownloads: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // Localmente usa o Chrome instalado (sem baixar navegador); no CI usa o Chromium do Playwright.
      use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome" },
    },
    // Safari: motor diferente (ex.: sem iteração assíncrona de streams em versões antigas). Requer `npx playwright install webkit`.
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    // Build de produção: o mesmo código que vai ao ar, sem o lock do servidor de desenvolvimento.
    command: `npm run build && npx vinext start -p ${E2E_PORT} -H 127.0.0.1`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      MONGODB_URI: E2E_MONGODB_URI,
      JWT_SECRET: E2E_JWT_SECRET,
      // O WebKit não aceita cookie Secure em http local; só afeta este servidor de teste.
      INSECURE_COOKIES: "true",
      RATE_LIMIT_DISABLED: "true",
      // Fluxos de pagamento não são exercitados aqui; valores neutros evitam chamadas reais ao Stripe.
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
    },
  },
});
