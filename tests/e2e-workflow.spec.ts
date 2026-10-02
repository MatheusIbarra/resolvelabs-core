import { expect, test, type Page } from "@playwright/test";
import { ADMIN, FREE_LIMIT, USER_PASSWORD } from "./support/e2e-env";
import { SAMPLE_STATEMENT, buildStatementPdf } from "./support/pdf";

// Os cenários compartilham o banco e o usuário criado no primeiro teste: execução em sequência.
test.describe.configure({ mode: "serial" });

const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@resolvelabs.test`;

const statementPdf = () => ({
  name: "extrato.pdf",
  mimeType: "application/pdf",
  buffer: buildStatementPdf(SAMPLE_STATEMENT),
});

/** Cria a conta pela API e deixa o navegador logado (os cookies da API valem para a página). */
async function registerAndLogin(page: Page, email: string) {
  const credentials = { email, password: USER_PASSWORD };
  const register = await page.request.post("/api/auth/register", { data: credentials });
  expect(register.status(), "cadastro via API").toBe(201);
  const login = await page.request.post("/api/auth/login", { data: credentials });
  expect(login.status(), "login via API").toBe(200);
}

test.describe("ResolveLabs - jornada do usuário e do admin", () => {
  const freeUserEmail = uniqueEmail("free");

  test("1. Registro de usuário: cadastra pela interface e cai no dashboard", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Criar conta gratuita" })).toBeVisible();

    await page.getByLabel("E-mail").fill(freeUserEmail);
    await page.getByLabel("Senha").fill(USER_PASSWORD);

    // O formulário cadastra e em seguida faz login: espera as duas respostas da API.
    const registered = page.waitForResponse((r) => r.url().endsWith("/api/auth/register") && r.request().method() === "POST");
    const loggedIn = page.waitForResponse((r) => r.url().endsWith("/api/auth/login") && r.request().method() === "POST");
    await page.getByRole("button", { name: "Criar conta" }).click();

    expect((await registered).status(), "POST /api/auth/register").toBe(201);
    expect((await loggedIn).status(), "POST /api/auth/login").toBe(200);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Olá, bem-vindo ao seu painel." })).toBeVisible();
    // A sidebar mostra o e-mail da sessão: confirma que o login é do usuário recém-criado.
    await expect(page.getByText(freeUserEmail)).toBeVisible();
  });

  test("2. Free tier: converte PDF até esgotar o limite e vê o paywall", async ({ page }) => {
    await registerAndLogin(page, uniqueEmail("limit"));
    await page.goto("/ferramentas/pdf-para-ofx");
    await expect(page.getByLabel(`Uso gratuito: 0 de ${FREE_LIMIT}`)).toBeVisible();

    const fileInput = page.locator('input[type="file"]');

    // As conversões gratuitas funcionam e cada uma baixa um .ofx.
    for (let used = 1; used <= FREE_LIMIT; used++) {
      const download = page.waitForEvent("download");
      const usage = page.waitForResponse((r) => r.url().endsWith("/api/usage") && r.request().method() === "POST");

      await fileInput.setInputFiles(statementPdf());

      expect((await usage).status(), `consumo de uso nº ${used}`).toBe(200);
      expect((await download).suggestedFilename()).toBe("extrato.ofx");
      await expect(page.getByLabel(`Uso gratuito: ${used} de ${FREE_LIMIT}`)).toBeVisible();
      await expect(page.getByText(/OFX gerado/).first()).toBeVisible();
    }

    // Limite esgotado: o aviso persistente aparece e a próxima tentativa abre o paywall.
    await expect(page.getByText("Você atingiu o limite gratuito.")).toBeVisible();

    const accessCheck = page.waitForResponse((r) => r.url().endsWith("/api/auth/me") && r.status() === 200);
    await page.getByRole("button", { name: /Arraste seu extrato em PDF aqui/ }).click();
    await accessCheck; // a validação de permissão roda antes de abrir o modal

    const paywall = page.getByRole("dialog", { name: "Limite gratuito atingido." });
    await expect(paywall).toBeVisible();
    await expect(paywall.getByText(`${FREE_LIMIT}/${FREE_LIMIT} execuções utilizadas`)).toBeVisible();
    await expect(paywall.getByRole("button", { name: /Testar 7 dias grátis/ })).toBeVisible();

    // O modal fecha com Esc e a ferramenta continua bloqueada (nenhuma nova conversão).
    await page.keyboard.press("Escape");
    await expect(paywall).toBeHidden();
    await expect(page.getByLabel(`Uso gratuito: ${FREE_LIMIT} de ${FREE_LIMIT}`)).toBeVisible();
  });

  test("3. Admin: abre /admin/dashboard e a tabela de usuários carrega os dados da API", async ({ page }) => {
    // Login pela interface com a conta de admin criada no global-setup.
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(ADMIN.email);
    await page.getByLabel("Senha").fill(ADMIN.password);
    const loggedIn = page.waitForResponse((r) => r.url().endsWith("/api/auth/login") && r.request().method() === "POST");
    await page.getByRole("button", { name: "Entrar" }).click();
    expect((await loggedIn).status()).toBe(200);
    await expect(page).toHaveURL(/\/dashboard$/);

    // A lista de usuários vem da API protegida: espera a resposta ao abrir o painel.
    const usersResponse = page.waitForResponse((r) => r.url().endsWith("/api/admin/users") && r.request().method() === "GET");
    await page.goto("/admin/dashboard");
    const response = await usersResponse;
    expect(response.status(), "GET /api/admin/users").toBe(200);
    const { users } = (await response.json()) as { users: { email: string; role: string }[] };
    expect(users.map((u) => u.email)).toContain(ADMIN.email);
    expect(users.map((u) => u.email)).toContain(freeUserEmail);

    // A tabela renderiza o que a API devolveu.
    await expect(page.getByRole("heading", { name: "Painel administrativo" })).toBeVisible();
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "E-mail" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Plano" })).toBeVisible();
    await expect(table.getByRole("row", { name: new RegExp(ADMIN.email) })).toContainText("admin");
    await expect(table.getByRole("row", { name: new RegExp(freeUserEmail) })).toContainText("free");
    expect(await table.getByRole("row").count()).toBe(users.length + 1); // + linha de cabeçalho
  });

  test("4. Segurança: usuário comum não acessa a área admin (página e API)", async ({ page }) => {
    await registerAndLogin(page, uniqueEmail("comum"));

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/); // o middleware devolve ao painel comum
    await expect(page.getByRole("heading", { name: "Painel administrativo" })).toHaveCount(0);

    // fetch feito pelo próprio navegador (envia o cookie de sessão como um usuário real faria)
    const apiStatus = await page.evaluate(async () => (await fetch("/api/admin/users")).status);
    expect(apiStatus).toBe(403); // a API também confere o role no servidor, não só o middleware
  });
});
